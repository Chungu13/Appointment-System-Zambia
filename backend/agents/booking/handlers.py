import datetime as _dt
import logging
import uuid as _uuid
import zoneinfo as _zi

from django.db import transaction
from django.utils import timezone

from agents.models import AgentLog
from bookings.conflict import cancel_stale_pending_appointments, has_booking_conflict
from bookings.models import Appointment
from core.phone import normalise_phone, build_phone_variants, is_valid_zambian_phone
from payments.models import Payment

logger = logging.getLogger(__name__)


def _calculate_customer_total(deposit_zmw: float) -> int:
    """
    What the customer pays upfront, rounded UP to the nearest whole Kwacha so
    the mobile money prompt and booking summary show a clean number (e.g.
    ZMW 58) instead of a percentage-math remainder (e.g. ZMW 57.18). Always
    rounds up (never down) so Kimawa's commission never shrinks to cover the
    rounding - at most the customer pays a few extra ngwee.
    Owner always receives deposit_zmw exactly (paid out via disbursement).
    Kimawa earns 10% commission; Lipila fees are covered by the service fee.
    """
    from decimal import Decimal, ROUND_CEILING

    kimawa_fee      = deposit_zmw * 0.10
    lipila_disburse = deposit_zmw * 0.015
    subtotal        = deposit_zmw + kimawa_fee + lipila_disburse
    total           = subtotal / (1 - 0.025)   # gross up to cover 2.5% collection fee
    return int(Decimal(str(total)).quantize(Decimal("1"), rounding=ROUND_CEILING))


def _clean_zmw(amount: float):
    """Whole ZMW amounts should display as e.g. 7, not 7.0 - only fall back
    to a 2dp float for the rare case a business configured a fractional
    deposit/price."""
    amount = float(amount)
    return int(amount) if amount == int(amount) else round(amount, 2)


def handle_get_services(inputs: dict) -> dict:
    from services.models import Service
    qs = Service.objects.filter(is_active=True)
    if inputs.get("category"):
        qs = qs.filter(category=inputs["category"])
    rows = list(qs.values(
        "id", "name", "category", "description", "duration_minutes",
        "price_zmw", "price_max_zmw", "deposit_zmw", "requires_reference_picture",
    ))
    return {
        "services": [
            {
                **r,
                "price_zmw": str(r["price_zmw"]),
                "price_max_zmw": str(r["price_max_zmw"]) if r["price_max_zmw"] is not None else None,
                "deposit_zmw": str(r["deposit_zmw"]),
                "display_name": f"{r['category']}, {r['name']}" if r.get("category") else r["name"],
            }
            for r in rows
        ]
    }


def handle_resolve_service(inputs: dict) -> dict:
    """
    Resolve a customer-typed service name to the authoritative service_id.
    Used whenever the message has no [service_id:X] tag, so the AI never
    has to carry a remembered id across turns - businesses can have close
    variants (e.g. "Gel Polish (Hands)" vs "Gel Polish (Feet)") that are
    easy to mix up from memory but trivial to match exactly here.
    """
    from services.models import Service

    name = (inputs.get("name") or "").strip().lower()
    if not name:
        return {"matched": False, "error": "No service name given."}

    services = list(Service.objects.filter(is_active=True).values("id", "name", "requires_reference_picture"))
    if not services:
        return {"matched": False, "error": "No active services found."}

    def _hit(s):
        return {
            "matched": True,
            "service_id": s["id"],
            "service_name": s["name"],
            "requires_reference_picture": s["requires_reference_picture"],
        }

    exact = [s for s in services if s["name"].strip().lower() == name]
    if len(exact) == 1:
        return _hit(exact[0])

    partial = [s for s in services if name in s["name"].lower() or s["name"].lower() in name]
    if len(partial) == 1:
        return _hit(partial[0])

    if len(partial) > 1:
        return {
            "matched": False,
            "ambiguous": True,
            "options": [{"service_id": s["id"], "service_name": s["name"]} for s in partial],
        }

    return {
        "matched": False,
        "error": f"No service matching '{inputs.get('name')}'. Call get_services to see the full list.",
    }


def _price_summary(service_id) -> dict | None:
    """
    Single source of truth for deposit/fee/total/balance figures. Used by
    both check_availability (a full slot search) and get_price_summary (a
    lightweight refresh called right before the booking summary is shown),
    so the number the customer sees can never drift from what check_availability
    computed several turns earlier - and never depends on the AI remembering it.
    """
    from services.models import Service

    service_obj = Service.objects.filter(pk=service_id).values(
        "name", "deposit_zmw", "price_zmw", "duration_minutes", "requires_reference_picture"
    ).first()
    if not service_obj:
        return None

    deposit        = float(service_obj["deposit_zmw"])
    price          = float(service_obj["price_zmw"])
    customer_total = _calculate_customer_total(deposit)
    service_fee    = _clean_zmw(customer_total - deposit)
    balance_salon  = _clean_zmw(price - deposit)
    return {
        "service":                    service_obj["name"],
        "duration_minutes":           service_obj["duration_minutes"],
        "deposit_zmw":                deposit,
        "customer_total":             customer_total,
        "service_fee":                service_fee,
        "balance_at_salon":           balance_salon,
        "requires_reference_picture": service_obj["requires_reference_picture"],
    }


def handle_get_price_summary(inputs: dict) -> dict:
    """
    Fresh pricing lookup, meant to be called right before printing the
    booking summary so the shown total is always current instead of a
    figure carried in the AI's memory from an earlier check_availability call.
    """
    summary = _price_summary(inputs.get("service_id"))
    if summary is None:
        return {"error": f"Service {inputs.get('service_id')} not found."}
    return {"service_id": inputs.get("service_id"), **summary}


def handle_check_availability(inputs: dict) -> tuple:
    """Returns (result_dict, raw_slots) — raw_slots stored by the agent for create_booking validation."""
    from bookings.availability import build_availability_slots
    from services.models import Service

    try:
        date = _dt.date.fromisoformat(inputs["date"])
    except ValueError:
        return {"error": f"Invalid date '{inputs['date']}'. Use YYYY-MM-DD."}, []

    # Hard guard: an invalid/missing service_id (e.g. 0, or one the AI didn't
    # actually resolve) must never fall through to the "no slots" branch below —
    # that logic finds zero qualified staff for a nonexistent service and reports
    # "closed" for every single day, which is a misleading answer to a completely
    # different problem. Fail loudly and specifically instead.
    if not Service.objects.filter(pk=inputs.get("service_id"), is_active=True).exists():
        return {
            "error": (
                f"service_id={inputs.get('service_id')} is not a real service. "
                "Call get_services or resolve_service to get a valid service_id before "
                "checking availability — never reuse a placeholder or guessed value."
            )
        }, []

    raw_slots = build_availability_slots(inputs["service_id"], date)

    if not raw_slots:
        from services.models import StaffService
        from staff.models import WorkingHours

        cat = _zi.ZoneInfo("Africa/Lusaka")
        day_of_week = date.weekday()
        qualified_ids = list(
            StaffService.objects.filter(service_id=inputs["service_id"])
            .values_list("staff_id", flat=True)
        )
        open_today = WorkingHours.objects.filter(
            staff_id__in=qualified_ids,
            day_of_week=day_of_week,
            is_day_off=False,
        ).exists()

        if not open_today:
            reason = "closed"
            message = "The salon is closed on this day."
        elif date == timezone.now().astimezone(cat).date():
            reason = "past_closing"
            message = "It is past closing time for today."
        else:
            reason = "fully_booked"
            message = "All slots are fully booked for this day."

        return {
            "date": inputs["date"],
            "available_slots": [],
            "reason": reason,
            "message": message,
        }, []

    # Group by staff so the AI can pick a staff_id without a separate lookup
    seen: dict = {}
    for s in raw_slots:
        sid = s["staff_id"]
        if sid not in seen:
            seen[sid] = {"staff_id": sid, "staff_name": s["staff_name"], "times": []}
        seen[sid]["times"].append(s["starts_at"].strftime("%I:%M %p").lstrip("0"))

    summary = _price_summary(inputs["service_id"])
    if summary:
        deposit             = summary["deposit_zmw"]
        customer_total      = summary["customer_total"]
        service_fee         = summary["service_fee"]
        balance_salon       = summary["balance_at_salon"]
        duration_mins       = summary["duration_minutes"]
        requires_ref_photo  = summary["requires_reference_picture"]
    else:
        deposit = customer_total = service_fee = balance_salon = 0.0
        duration_mins = 0
        requires_ref_photo = False

    result = {
        "service_id":                 inputs["service_id"],
        "date":                       inputs["date"],
        "service":                    raw_slots[0]["service_name"],
        "duration_minutes":           duration_mins,
        "deposit_zmw":                deposit,
        "customer_total":             customer_total,
        "service_fee":                service_fee,
        "balance_at_salon":           balance_salon,
        "available_staff":            list(seen.values()),
        "total_slots":                len(raw_slots),
        "requires_reference_picture": requires_ref_photo,
    }
    return result, raw_slots


def _rank_available_staff(service_id, date, requested_start, requested_end, exclude_staff_ids=()):
    """
    Among staff qualified for a service and free during [requested_start,
    requested_end), return User instances ordered by fewest booked minutes
    that day first (least busy = best pick). Empty list if nobody qualified
    is free.
    """
    from django.contrib.auth import get_user_model
    from services.models import StaffService

    User = get_user_model()

    qualified_ids = list(
        StaffService.objects.filter(service_id=service_id, staff__is_active=True)
        .exclude(staff_id__in=exclude_staff_ids)
        .values_list("staff_id", flat=True)
    )
    if not qualified_ids:
        return []

    busy_ids = set(
        Appointment.objects.filter(
            staff_id__in=qualified_ids,
            status__in=[
                Appointment.STATUS_CONFIRMED,
                Appointment.STATUS_IN_PROGRESS,
                Appointment.STATUS_PENDING,
            ],
            starts_at__lt=requested_end,
            ends_at__gt=requested_start,
        ).values_list("staff_id", flat=True)
    )

    available_ids = [sid for sid in qualified_ids if sid not in busy_ids]
    if not available_ids:
        return []

    # Rank by fewest total booked minutes today
    staff_workload = []
    for staff_id in available_ids:
        today_appts = Appointment.objects.filter(
            staff_id=staff_id,
            starts_at__date=date,
            status__in=[
                Appointment.STATUS_CONFIRMED,
                Appointment.STATUS_IN_PROGRESS,
                Appointment.STATUS_PENDING,
            ],
        ).only("starts_at", "ends_at")
        booked_minutes = sum(
            int((a.ends_at - a.starts_at).total_seconds() / 60)
            for a in today_appts
        )
        staff_workload.append((staff_id, booked_minutes))

    staff_workload.sort(key=lambda x: x[1])
    users_by_id = {u.pk: u for u in User.objects.filter(pk__in=available_ids)}
    return [users_by_id[sid] for sid, _ in staff_workload]


def _select_best_staff(service_id, date, requested_start, requested_end, exclude_staff_ids=()):
    """
    Shared load-balancing logic: returns the single least-busy qualified and
    free User instance, or None if nobody qualified is free. Used by
    handle_create_booking's silent re-pick if the original pick fell through
    between the pairing announcement and the actual booking.
    """
    ranked = _rank_available_staff(service_id, date, requested_start, requested_end, exclude_staff_ids)
    return ranked[0] if ranked else None


def handle_check_staff_available(inputs: dict) -> dict:
    """
    Check whether one specific named staff member is qualified and free for a
    slot. Used when the customer asks for someone by name (typed or tapped a
    QUICK_REPLIES option) so the AI never has to guess free vs busy itself -
    get_best_staff's result only reflects the single best pick, not whether
    an arbitrary other name is free, so that alone isn't enough to answer this.
    """
    import datetime
    import zoneinfo
    from django.utils import timezone as tz_module
    from services.models import Service

    service_id = inputs.get("service_id")
    date_str = inputs.get("date", "")
    start_time_str = inputs.get("start_time", "")
    staff_name = (inputs.get("staff_name") or "").strip()

    try:
        date = datetime.date.fromisoformat(date_str)
        hour, minute = map(int, start_time_str.split(":"))
    except (ValueError, AttributeError):
        return {"error": "Invalid date or start_time. Use YYYY-MM-DD and HH:MM (24-hour)."}

    svc = Service.objects.filter(pk=service_id, is_active=True).values("duration_minutes", "buffer_minutes").first()
    if not svc:
        return {"error": f"Service {service_id} not found."}
    total_duration = svc["duration_minutes"] + svc["buffer_minutes"]

    cat = zoneinfo.ZoneInfo("Africa/Lusaka")
    requested_start = tz_module.make_aware(
        datetime.datetime(date.year, date.month, date.day, hour, minute), cat
    )
    requested_end = requested_start + datetime.timedelta(minutes=total_duration)

    ranked = _rank_available_staff(service_id, date, requested_start, requested_end)
    for staff in ranked:
        name = staff.full_name or staff.username
        if name.strip().lower() == staff_name.lower():
            return {"available": True, "staff_id": staff.pk, "staff_name": name}

    return {"available": False, "requested_name": staff_name}


def handle_get_best_staff(inputs: dict) -> dict:
    import datetime
    import zoneinfo
    from django.utils import timezone as tz_module
    from services.models import Service

    service_id = inputs.get("service_id")
    date_str = inputs.get("date", "")
    start_time_str = inputs.get("start_time", "")

    try:
        date = datetime.date.fromisoformat(date_str)
        hour, minute = map(int, start_time_str.split(":"))
    except (ValueError, AttributeError):
        return {"error": "Invalid date or start_time. Use YYYY-MM-DD and HH:MM (24-hour)."}

    # Always look up actual service duration from DB — don't trust the AI's value
    svc = Service.objects.filter(pk=service_id, is_active=True).values("duration_minutes", "buffer_minutes").first()
    if not svc:
        return {"error": f"Service {service_id} not found."}
    total_duration = svc["duration_minutes"] + svc["buffer_minutes"]

    cat = zoneinfo.ZoneInfo("Africa/Lusaka")
    requested_start = tz_module.make_aware(
        datetime.datetime(date.year, date.month, date.day, hour, minute), cat
    )
    requested_end = requested_start + datetime.timedelta(minutes=total_duration)

    ranked = _rank_available_staff(service_id, date, requested_start, requested_end)
    if not ranked:
        return {"error": "No staff available at that time. All qualified staff are booked."}

    staff = ranked[0]
    return {
        "staff_id":   staff.pk,
        "staff_name": staff.full_name or staff.username,
        # Every staff member free for this slot, least busy (= assigned) first.
        # Use this verbatim to build the QUICK_REPLIES staff pick list.
        "staff_options": [s.full_name or s.username for s in ranked],
    }


def handle_create_booking(
    inputs: dict,
    customer_phone: str,
    tenant_schema_name: str,
    session_id: str,
    last_slots: list,
) -> dict:
    from django.contrib.auth import get_user_model
    from services.models import Service, StaffService
    from bookings.models import Customer

    User = get_user_model()

    # Hard guard: service_id must match what check_availability was called with
    if last_slots:
        expected_sid = last_slots[0]["service_id"]
        if inputs["service_id"] != expected_sid:
            return {
                "error": (
                    f"Wrong service_id={inputs['service_id']}. "
                    f"You checked availability for service_id={expected_sid}. "
                    f"You MUST use service_id={expected_sid} — do not book a different service."
                )
            }

    try:
        service = Service.objects.get(pk=inputs["service_id"], is_active=True)
    except Service.DoesNotExist:
        return {"error": f"Service {inputs['service_id']} not found."}

    # Fetch any reference photo attached earlier in this session — needed both
    # to enforce services that require one, and to attach it to the appointment
    # further down. Checked here in Python, not left to the AI to remember to ask.
    from agents.booking.session import load_reference_image, clear_reference_image
    pending_reference = load_reference_image(session_id)

    if service.requires_reference_picture and not pending_reference:
        return {
            "error": (
                f"{service.name} requires a reference photo of the exact style before this "
                "booking can be completed. Ask the customer to attach one using the paperclip "
                "icon in the chat, then try again — do not call create_booking without it."
            )
        }

    try:
        staff = User.objects.get(pk=inputs["staff_id"])
    except User.DoesNotExist:
        return {"error": f"Staff member {inputs['staff_id']} not found."}

    if not StaffService.objects.filter(service=service, staff=staff).exists():
        assigned = list(
            StaffService.objects.filter(service=service)
            .select_related("staff")
            .values_list("staff__full_name", flat=True)
        )
        return {
            "error": (
                f"{staff.full_name} is not assigned to {service.name}. "
                f"Please use one of the staff members returned by check_availability: "
                f"{', '.join(assigned) or 'none available'}."
            )
        }

    tz = timezone.get_current_timezone()
    try:
        import dateutil.parser
        starts_at = dateutil.parser.parse(inputs["starts_at"])
        if starts_at.tzinfo is None:
            starts_at = starts_at.replace(tzinfo=tz)
    except Exception:
        return {"error": f"Invalid datetime '{inputs['starts_at']}'."}

    ends_at = starts_at + _dt.timedelta(minutes=service.duration_minutes + service.buffer_minutes)

    # Hard guard: starts_at must be a real slot for this staff member — never
    # trust an AI-remembered time, rebuild the actual slot grid and check.
    from bookings.availability import build_availability_slots
    real_slots = build_availability_slots(service.pk, starts_at.date(), staff.pk)
    if not any(s["starts_at"] == starts_at for s in real_slots):
        return {
            "error": (
                f"{starts_at.strftime('%H:%M')} on {starts_at.date().isoformat()} is not a real slot "
                f"for {staff.full_name}. Call check_availability again and use one of the returned times."
            )
        }

    resolved_phone = (inputs.get("customer_phone") or "").strip() or customer_phone.strip()
    if not resolved_phone or not is_valid_zambian_phone(resolved_phone):
        return {
            "error": (
                "Cannot create booking: the phone number is missing or invalid. "
                "Go back to Step 2 and ask the customer for a valid Zambian mobile money number."
            )
        }
    resolved_phone = normalise_phone(resolved_phone)

    customer, _ = Customer.objects.get_or_create(
        phone=resolved_phone,
        defaults={"full_name": inputs["customer_name"]},
    )
    inputs["customer_phone"] = resolved_phone

    with transaction.atomic():
        cancel_stale_pending_appointments(staff, starts_at, ends_at)

        if has_booking_conflict(staff, starts_at, ends_at):
            # The staff picked earlier in the conversation got taken in the
            # meantime (e.g. while the customer was giving their phone
            # number). Silently re-pick the next-best available staff for
            # this same slot instead of bouncing an error back to the AI —
            # the customer already said yes to this time, not to a specific
            # person, so there's no need to interrupt them over it.
            alternative = _select_best_staff(
                service.id, starts_at.date(), starts_at, ends_at,
                exclude_staff_ids=[staff.id],
            )
            if alternative is None:
                return {"error": "That slot is no longer available. Please choose another time."}
            staff = alternative
            cancel_stale_pending_appointments(staff, starts_at, ends_at)
            if has_booking_conflict(staff, starts_at, ends_at):
                return {"error": "That slot is no longer available. Please choose another time."}

        # pending_reference was already fetched above. A no-deposit booking
        # goes straight to "confirmed", which fires the notification signal
        # synchronously from inside .create() itself, before any later
        # .save() call on this same object would run — so it must be passed
        # into .create() directly, not attached afterward.
        appt = Appointment.objects.create(
            customer=customer,
            staff=staff,
            service=service,
            starts_at=starts_at,
            ends_at=ends_at,
            status=Appointment.STATUS_PENDING if float(service.deposit_zmw) > 0 else Appointment.STATUS_CONFIRMED,
            booked_by=Appointment.BOOKED_BY_AGENT,
            customer_notes=inputs.get("notes", ""),
            notification_phone=inputs.get("notification_phone", ""),
            chat_session_id=session_id,
            reference_image_url=pending_reference.get("url", "") if pending_reference else "",
            reference_image_path=pending_reference.get("path", "") if pending_reference else "",
        )

        if pending_reference:
            clear_reference_image(session_id)

    AgentLog.objects.create(
        agent_type="booking",
        action=(
            f"Agent booked {service.name} for {customer.full_name} ({customer.phone}) "
            f"with {staff.full_name} at {starts_at:%Y-%m-%d %H:%M}"
        ),
        related_appointment=appt,
        outcome="success",
        metadata={
            "tenant": tenant_schema_name,
            "customer_phone": inputs["customer_phone"],
            "service_id": inputs["service_id"],
            "staff_id": staff.pk,
        },
    )

    return {
        "appointment_id": appt.pk,
        "service":        service.name,
        "staff":          staff.full_name,
        "starts_at":      starts_at.isoformat(),
        "status":         "pending",
        "price_zmw":      str(service.price_zmw),
        "deposit_zmw":    str(service.deposit_zmw),
    }


def handle_initiate_payment(inputs: dict, customer_phone: str, tenant_schema_name: str) -> dict:
    from payments.provider_factory import get_provider

    try:
        appt = Appointment.objects.select_related("customer", "service", "staff").get(
            pk=inputs["appointment_id"]
        )
    except Appointment.DoesNotExist:
        return {"error": f"Appointment {inputs['appointment_id']} not found."}

    if appt.status == Appointment.STATUS_CANCELLED:
        return {"error": "Cannot pay for a cancelled appointment."}

    mobile_money_phone = inputs.get("mobile_money_phone") or customer_phone

    actual_deposit = float(appt.service.deposit_zmw)
    actual_total   = _calculate_customer_total(actual_deposit)
    actual_fee     = _clean_zmw(actual_total - actual_deposit)

    if actual_deposit == 0:
        appt.status = Appointment.STATUS_CONFIRMED
        appt.save(update_fields=["status", "updated_at"])
        transaction_ref = f"APPT-{appt.pk}"
        AgentLog.objects.create(
            agent_type="payment",
            action=f"No-deposit booking confirmed for {appt.customer.full_name}, {appt.service.name}",
            related_appointment=appt,
            outcome="success",
            metadata={"tenant": tenant_schema_name, "appointment_id": appt.pk},
        )
        return {
            "payment_flow":  "no_deposit",
            "transaction_ref": transaction_ref,
            "amount_charged": 0,
            "deposit":       0,
            "service_fee":   0,
            "message":       "Booking confirmed. No deposit required.",
            "service_name":  appt.service.name,
            "staff_name":    appt.staff.full_name,
            "starts_at":     appt.starts_at.strftime("%Y-%m-%dT%H:%M"),
        }

    # Validate the mobile money number before touching Lipila
    if not is_valid_zambian_phone(mobile_money_phone):
        return {
            "error": (
                "That doesn't look like a valid Zambian mobile money number. "
                "Please enter a valid MTN, Airtel, or Zamtel number."
            )
        }

    transaction_ref = f"KIMAWA-{_uuid.uuid4().hex[:12].upper()}"

    payment = Payment.objects.create(
        appointment=appt,
        amount_zmw=actual_total,
        payment_type="deposit",
        method="airtel_money",
        status=Payment.STATUS_PENDING,
        transaction_ref=transaction_ref,
    )

    provider = get_provider()
    result = provider.initiate_collection(
        phone=mobile_money_phone,
        amount=actual_total,
        reference=transaction_ref,
        narration=f"{appt.service.name} deposit",
    )

    if not result.success:
        payment.status = Payment.STATUS_FAILED
        payment.save(update_fields=["status", "updated_at"])
        return {"error": f"Payment initiation failed: {result.message}"}

    update_fields = ["updated_at"]
    if result.provider_ref:
        payment.provider_ref = result.provider_ref
        update_fields.append("provider_ref")

    # Mock provider auto-confirms immediately — mark payment + appointment here too
    if result.status == "completed":
        payment.status  = Payment.STATUS_COMPLETED
        payment.paid_at = timezone.now()
        update_fields += ["status", "paid_at"]
        if appt.status not in (Appointment.STATUS_CONFIRMED, Appointment.STATUS_COMPLETED):
            appt.status = Appointment.STATUS_CONFIRMED
            appt.save(update_fields=["status", "updated_at"])

    payment.save(update_fields=list(set(update_fields)))

    AgentLog.objects.create(
        agent_type="payment",
        action=(
            f"Agent initiated payment of ZMW {actual_total} for "
            f"{appt.customer.full_name} ({mobile_money_phone})"
        ),
        related_appointment=appt,
        outcome="success",
        metadata={
            "tenant":         tenant_schema_name,
            "payment_id":     payment.pk,
            "transaction_ref": transaction_ref,
            "amount_charged": str(actual_total),
            "deposit_zmw":    str(actual_deposit),
            "phone":          mobile_money_phone,
        },
    )

    return {
        "payment_flow":    "mobile_money",
        "transaction_ref": transaction_ref,
        "phone":           mobile_money_phone,
        "amount_charged":  actual_total,
        "deposit":         actual_deposit,
        "service_fee":     actual_fee,
        "message":         f"Payment of ZMW {actual_total} initiated to {mobile_money_phone}",
        "service_name":    appt.service.name,
        "staff_name":      appt.staff.full_name,
        "starts_at":       appt.starts_at.strftime("%Y-%m-%dT%H:%M"),
    }


def _upcoming_appointments_for_phone(phone: str) -> list:
    """
    Shared lookup: a customer's confirmed/pending upcoming appointments.
    Used by both find_my_appointments and resolve_appointment_selection so
    the two can never disagree about what's actually on the books.
    """
    from bookings.models import Customer

    tz = _zi.ZoneInfo("Africa/Lusaka")
    now = timezone.now()

    customer = None
    for phone_variant in build_phone_variants(phone):
        customer = Customer.objects.filter(phone=phone_variant).first()
        if customer:
            break
    if not customer:
        return []

    qs = (
        Appointment.objects
        .filter(
            customer=customer,
            status__in=[Appointment.STATUS_CONFIRMED, Appointment.STATUS_PENDING],
            starts_at__gte=now,
        )
        .select_related("service", "staff")
        .order_by("starts_at")[:10]
    )

    results = []
    for appt in qs:
        local_start = appt.starts_at.astimezone(tz)
        results.append({
            "appointment_id": appt.pk,
            "service":        appt.service.name,
            "service_id":     appt.service.pk,
            "staff":          appt.staff.full_name,
            "date":           local_start.strftime("%Y-%m-%d"),
            "time":           local_start.strftime("%H:%M"),
            "status":         appt.status,
            "ref":            f"APPT-{appt.pk}",
        })
    return results


def handle_find_my_appointments(inputs: dict, customer_phone: str) -> dict:
    phone = (inputs.get("phone") or customer_phone or "").strip()

    if not phone:
        return {
            "appointments": [],
            "message": "Phone number required. Ask the customer for their mobile number before calling this tool.",
            "needs_phone": True,
        }

    appointments = _upcoming_appointments_for_phone(phone)
    if not appointments:
        return {"appointments": [], "message": "You have no upcoming appointments."}

    return {"appointments": appointments}


def handle_resolve_appointment_selection(inputs: dict, customer_phone: str) -> dict:
    """
    Resolve whatever the customer said when asked which appointment they
    meant, against their ACTUAL current upcoming appointments fetched fresh
    right now — never let the AI guess an appointment_id from its memory of
    an earlier find_my_appointments call, especially with 2+ appointments.
    """
    phone = (inputs.get("phone") or customer_phone or "").strip()
    selection = (inputs.get("selection") or "").strip().lower()

    if not phone:
        return {"matched": False, "error": "Phone number required."}

    rows = _upcoming_appointments_for_phone(phone)
    if not rows:
        return {"matched": False, "error": "No upcoming appointments found."}

    def label(r):
        return f"{r['service']} on {r['date']} at {r['time']}"

    if len(rows) == 1:
        r = rows[0]
        return {"matched": True, "appointment_id": r["appointment_id"], "label": label(r)}

    if selection:
        norm_sel = selection.replace(":", "").replace(" ", "")
        matches = [
            r for r in rows
            if selection in label(r).lower()
            or selection in r["service"].lower()
            or selection == str(r["appointment_id"])
            or r["date"] in selection
            or r["time"].replace(":", "") in norm_sel
        ]
        if len(matches) == 1:
            r = matches[0]
            return {"matched": True, "appointment_id": r["appointment_id"], "label": label(r)}

    return {
        "matched": False,
        "ambiguous": True,
        "options": [{"appointment_id": r["appointment_id"], "label": label(r)} for r in rows],
    }


def handle_cancel_appointment(inputs: dict, customer_phone: str, tenant_schema_name: str) -> dict:
    from bookings.models import AppointmentHistory, Customer

    try:
        appt = Appointment.objects.select_related("customer", "service", "staff").get(
            pk=inputs["appointment_id"]
        )
    except Appointment.DoesNotExist:
        return {"error": f"Appointment {inputs['appointment_id']} not found."}

    phone = (inputs.get("phone") or customer_phone or "").strip()
    owner_phones = build_phone_variants(phone)
    if appt.customer.phone not in owner_phones:
        return {"error": "This appointment does not belong to your account."}

    if appt.status == Appointment.STATUS_CANCELLED:
        return {"error": "This appointment is already cancelled."}
    if appt.status == Appointment.STATUS_EXPIRED:
        return {"error": "This booking expired before payment was completed."}
    if appt.status in (Appointment.STATUS_COMPLETED, Appointment.STATUS_NO_SHOW):
        return {"error": "This appointment has already been completed and cannot be cancelled."}
    if appt.starts_at < timezone.now():
        return {"error": "This appointment has already passed."}

    hours_until = (appt.starts_at - timezone.now()).total_seconds() / 3600
    warning = None
    if hours_until < 2:
        warning = f"This appointment is less than {int(hours_until * 60)} minutes away."

    reason = inputs.get("reason") or "Customer requested cancellation via chat"
    old_status = appt.status

    with transaction.atomic():
        appt.status = Appointment.STATUS_CANCELLED
        appt.cancelled_at = timezone.now()
        appt.cancellation_reason = reason
        appt.cancelled_by = "customer"
        appt.save(update_fields=["status", "cancelled_at", "cancellation_reason", "cancelled_by", "updated_at"])

        AppointmentHistory.objects.create(
            appointment=appt,
            changed_by=None,
            changed_by_agent="booking_agent",
            old_status=old_status,
            new_status=Appointment.STATUS_CANCELLED,
            note=reason,
        )

    deposit_was_paid = float(appt.service.deposit_zmw) > 0

    AgentLog.objects.create(
        agent_type="booking",
        action=f"Agent cancelled appointment #{appt.pk} for {appt.customer.full_name}",
        related_appointment=appt,
        outcome="success",
        metadata={
            "tenant":         tenant_schema_name,
            "appointment_id": appt.pk,
            "reason":         reason,
        },
    )

    result = {
        "cancelled":        True,
        "appointment_id":   appt.pk,
        "service":          appt.service.name,
        "staff":            appt.staff.full_name,
        "date":             appt.starts_at.strftime("%Y-%m-%d"),
        "time":             appt.starts_at.strftime("%H:%M"),
        "ref":              f"APPT-{appt.pk}",
        "deposit_was_paid": deposit_was_paid,
    }
    if warning:
        result["warning"] = warning
    return result


def handle_reschedule_appointment(inputs: dict, customer_phone: str, tenant_schema_name: str) -> dict:
    from bookings.models import AppointmentHistory

    try:
        appt = Appointment.objects.select_related("customer", "service", "staff").get(
            pk=inputs["appointment_id"]
        )
    except Appointment.DoesNotExist:
        return {"error": f"Appointment {inputs['appointment_id']} not found."}

    owner_phones = build_phone_variants(customer_phone)
    if appt.customer.phone not in owner_phones:
        return {"error": "This appointment does not belong to your account."}

    if appt.status == Appointment.STATUS_CANCELLED:
        return {"error": "This appointment is already cancelled and cannot be rescheduled."}
    if appt.status in (Appointment.STATUS_COMPLETED, Appointment.STATUS_NO_SHOW):
        return {"error": "This appointment has already been completed."}

    try:
        new_date = _dt.date.fromisoformat(inputs["new_date"])
    except (ValueError, KeyError):
        return {"error": "Invalid new_date. Use YYYY-MM-DD."}

    try:
        hour, minute = map(int, inputs["new_time"].split(":"))
    except (ValueError, KeyError, AttributeError):
        return {"error": "Invalid new_time. Use HH:MM (24-hour)."}

    tz = timezone.get_current_timezone()
    new_start = timezone.make_aware(
        _dt.datetime(new_date.year, new_date.month, new_date.day, hour, minute), tz
    )

    if new_start < timezone.now():
        return {"error": "Cannot reschedule to a time that has already passed."}

    new_end = new_start + _dt.timedelta(
        minutes=appt.service.duration_minutes + appt.service.buffer_minutes
    )

    with transaction.atomic():
        if has_booking_conflict(appt.staff, new_start, new_end, exclude_pk=appt.pk):
            return {"error": "That time slot is no longer available. Please choose another time."}

        old_start = appt.starts_at
        appt.starts_at = new_start
        appt.ends_at   = new_end
        appt.save(update_fields=["starts_at", "ends_at", "updated_at"])

        AppointmentHistory.objects.create(
            appointment=appt,
            changed_by=None,
            changed_by_agent="booking_agent",
            old_status=appt.status,
            new_status=appt.status,
            note=f"Rescheduled from {old_start:%Y-%m-%d %H:%M} to {new_start:%Y-%m-%d %H:%M} via chat",
        )

    AgentLog.objects.create(
        agent_type="booking",
        action=f"Agent rescheduled appointment #{appt.pk} for {appt.customer.full_name}",
        related_appointment=appt,
        outcome="success",
        metadata={
            "tenant":         tenant_schema_name,
            "appointment_id": appt.pk,
            "old_starts_at":  old_start.isoformat(),
            "new_starts_at":  new_start.isoformat(),
        },
    )

    return {
        "rescheduled":    True,
        "appointment_id": appt.pk,
        "service":        appt.service.name,
        "staff":          appt.staff.full_name,
        "old_date":       old_start.strftime("%Y-%m-%d"),
        "old_time":       old_start.strftime("%H:%M"),
        "new_date":       new_start.strftime("%Y-%m-%d"),
        "new_time":       new_start.strftime("%H:%M"),
        "ref":            f"APPT-{appt.pk}",
    }


def handle_validate_phone(inputs: dict) -> dict:
    phone = inputs.get("phone", "").strip()
    if is_valid_zambian_phone(phone):
        return {"valid": True, "message": "This is a valid Zambian mobile money number."}
    return {"valid": False, "message": "This is not a valid Zambian mobile money number."}


def handle_retry_payment(inputs: dict, customer_phone: str, tenant_schema_name: str) -> dict:
    from payments.provider_factory import get_provider

    try:
        appt = Appointment.objects.select_related("service", "staff", "customer").get(
            pk=inputs["appointment_id"]
        )
    except Appointment.DoesNotExist:
        return {"error": f"Appointment {inputs['appointment_id']} not found."}

    actual_deposit = float(appt.service.deposit_zmw)
    if actual_deposit == 0:
        return {"error": "This booking has no deposit. No payment is needed."}

    actual_total = _calculate_customer_total(actual_deposit)
    mobile_phone = (inputs.get("mobile_money_phone") or customer_phone or appt.customer.phone).strip()
    if not mobile_phone:
        return {"error": "No mobile money number available. Please ask the customer for their number."}

    transaction_ref = f"KIMAWA-RETRY-{_uuid.uuid4().hex[:12].upper()}"
    payment = Payment.objects.create(
        appointment=appt,
        amount_zmw=actual_total,
        payment_type="deposit",
        method="airtel_money",
        status=Payment.STATUS_PENDING,
        transaction_ref=transaction_ref,
    )

    provider = get_provider()
    result = provider.initiate_collection(
        phone=mobile_phone,
        amount=actual_total,
        reference=transaction_ref,
        narration=f"{appt.service.name} deposit (retry)",
    )

    if not result.success:
        payment.status = Payment.STATUS_FAILED
        payment.save(update_fields=["status", "updated_at"])
        return {"error": f"Failed to resend payment prompt: {result.message}"}

    AgentLog.objects.create(
        agent_type="payment",
        action=f"Agent retried payment for {appt.customer.full_name} ({mobile_phone})",
        related_appointment=appt,
        outcome="success",
        metadata={
            "tenant":          tenant_schema_name,
            "transaction_ref": transaction_ref,
            "amount_charged":  str(actual_total),
            "phone":           mobile_phone,
        },
    )

    return {
        "payment_flow":    "mobile_money",
        "transaction_ref": transaction_ref,
        "phone":           mobile_phone,
        "amount_charged":  actual_total,
        "service_name":    appt.service.name,
        "staff_name":      appt.staff.full_name,
        "starts_at":       appt.starts_at.strftime("%Y-%m-%dT%H:%M"),
        "message":         f"Payment prompt of ZMW {actual_total} resent to {mobile_phone}.",
    }
