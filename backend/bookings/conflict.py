"""
Appointment conflict helpers.

Both BookingAgent and the GraphQL reschedule mutation need to check for
overlapping appointments. Centralising here ensures the logic stays in sync.
Must be called inside a transaction (select_for_update requirement).
"""
from bookings.models import Appointment


def cancel_stale_pending_appointments(staff, starts_at, ends_at) -> int:
    """
    Cancel any pending appointments that overlap with [starts_at, ends_at).
    Called before creating a new booking so abandoned payment attempts don't
    permanently block a slot.
    Returns the number of appointments cancelled.
    """
    return Appointment.objects.filter(
        staff=staff,
        status=Appointment.STATUS_PENDING,
        starts_at__lt=ends_at,
        ends_at__gt=starts_at,
    ).update(status=Appointment.STATUS_EXPIRED)


def has_booking_conflict(staff, starts_at, ends_at, exclude_pk: int = None) -> bool:
    """
    Return True if a confirmed or in-progress appointment overlaps with [starts_at, ends_at).
    Pass exclude_pk when rescheduling so the appointment being moved doesn't block itself.
    """
    qs = (
        Appointment.objects
        .select_for_update()
        .filter(
            staff=staff,
            status__in=[Appointment.STATUS_CONFIRMED, Appointment.STATUS_IN_PROGRESS],
            starts_at__lt=ends_at,
            ends_at__gt=starts_at,
        )
    )
    if exclude_pk is not None:
        qs = qs.exclude(pk=exclude_pk)
    return qs.exists()
