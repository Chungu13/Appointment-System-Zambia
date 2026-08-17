import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { X, ChevronLeft, Check } from "lucide-react";
import { AVAILABILITY } from "../../graphql/queries/services";
import { useBookingSubmit } from "../../hooks/useBookingSubmit";
import { isValidZambianPhone } from "../../lib/phone";

// Espresso / cream tokens, matching the rest of the storefront.
const PRIMARY = "#3B2A1E";
const DARK    = "#241812";
const MUTED   = "#5C4C3D";
const HINT    = "#8A7A6A";
const BORDER  = "#EDE3D6";
const CREAM   = "#FBF7F1";
const PAGE    = "#F5EFE8";

const sans = "Inter, sans-serif";

const STEPS = ["Choose stylist", "Pick a day", "Pick a time", "Your details"];

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isPastClosingToday(openingHours, now) {
  if (!openingHours?.length) return false;
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const row = openingHours.find((h) => h.dayOfWeek === todayIdx);
  if (!row || row.isClosed || !row.closesAt) return false;
  const [ch, cm] = row.closesAt.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() >= ch * 60 + cm;
}

function dayLabel(d, i) {
  if (i === 0) return "Today";
  if (i === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Tappable option card ──────────────────────────────────────────────────────
function OptionCard({ title, sub, selected, disabled, onClick, grow }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: grow ? "1 1 100%" : "0 1 auto",
        textAlign: "left",
        backgroundColor: selected ? PRIMARY : "#fff",
        color: selected ? "#fff" : DARK,
        border: selected ? "none" : `0.5px solid ${BORDER}`,
        borderRadius: 14,
        padding: "13px 16px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontFamily: sans,
        minWidth: 0,
      }}
    >
      <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>{title}</span>
      {sub && (
        <span style={{ display: "block", fontSize: 12, fontWeight: 300, marginTop: 2, color: selected ? "rgba(255,255,255,0.7)" : HINT }}>
          {sub}
        </span>
      )}
    </button>
  );
}

function Bubble({ children }) {
  return (
    <div style={{ backgroundColor: "#EFE6DC", borderRadius: 14, padding: "13px 16px", marginBottom: 14 }}>
      <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, color: DARK, margin: 0, lineHeight: 1.5 }}>
        {children}
      </p>
    </div>
  );
}

const FIELD = {
  width: "100%", boxSizing: "border-box", backgroundColor: "#fff",
  border: "1.5px solid #C9B49C", borderRadius: 12, padding: "13px 14px",
  fontFamily: sans, fontSize: 16, fontWeight: 400, color: DARK, outline: "none",
};

const LABEL = {
  fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: "0.12em",
  textTransform: "uppercase", color: MUTED, display: "block", marginBottom: 7,
};

/**
 * Deterministic booking flow — no AI. Stylist, day, time, details.
 *
 * Availability comes straight from the `availability` query, which is the same
 * source of truth the owner's views use, so what a customer can book always
 * matches the times an owner picked.
 */
export default function BookingWizard({ service: initialService, profile, confirmedBooking, onClose }) {
  // Opened from a service card the service is known; opened from the floating
  // button it is not, so a picker runs first. It sits outside the four steps
  // rather than making the flow longer for everyone who arrived with a service.
  const [service, setService] = useState(initialService ?? null);
  const [step, setStep] = useState(1);
  const [staff, setStaff] = useState(null);       // null = any available
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(null);

  const { submit, loading: submitting, error: submitError } = useBookingSubmit();

  const bookableStaff = (profile?.staff ?? []).filter(
    (s) => !service?.name || !s.serviceNames?.length || s.serviceNames.includes(service.name),
  );

  // Next 14 days as day options. Today drops off the list once the business
  // has already closed for the day, since nothing bookable is left on it.
  const days = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (i === 0 && isPastClosingToday(profile?.openingHours, now)) continue;
      out.push({ iso: ymd(d), label: dayLabel(d, i), sub: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }) });
    }
    return out;
  }, [profile?.openingHours]);

  const { data: availData, loading: loadingSlots } = useQuery(AVAILABILITY, {
    variables: { serviceId: service?.id, date, staffId: staff?.id ?? null },
    skip: !service?.id || !date,
    fetchPolicy: "network-only",
  });
  const slots = availData?.availability ?? [];

  const needsDeposit = Number(service?.depositZmw ?? 0) > 0;

  async function confirm() {
    setFormError("");
    if (!form.name.trim()) return setFormError("Please enter your name.");
    if (!isValidZambianPhone(form.phone)) {
      return setFormError("Enter a valid MTN, Airtel or Zamtel number, e.g. 0971234567.");
    }
    try {
      const result = await submit({ service, slot, customer: form });
      if (!result.redirected) setDone(result);
    } catch {
      /* surfaced via submitError */
    }
  }

  // True when the customer picked the service in here, so Back can return to
  // the picker. Arriving from a service card, there is nothing to go back to.
  const canReturnToPicker = !initialService;

  function back() {
    setFormError("");
    if (step === 4) { setSlot(null); setStep(3); return; }
    if (step === 3) { setDate(null); setStep(2); return; }
    if (step === 2) { setStaff(null); setStep(1); return; }
    if (step === 1 && canReturnToPicker) { setService(null); return; }
  }

  // Returning from the payment provider — nothing to step through, just show
  // the outcome.
  const finished = done || confirmedBooking;
  const showBack = !finished && service && (step > 1 || canReturnToPicker);
  const stepIndex = finished ? 4 : !service ? -1 : step - 1;

  return (
    <div
      className="animate-chat-slide-up fixed bottom-4 z-50 flex flex-col overflow-hidden"
      style={{
        width: "min(390px, calc(100vw - 16px))", right: 8, maxHeight: "min(640px, calc(100vh - 32px))",
        borderRadius: 20, backgroundColor: PAGE,
        boxShadow: "0 8px 40px rgba(0,0,0,0.35)", border: `0.5px solid ${BORDER}`,
      }}
    >
      {/* Header */}
      <div style={{ backgroundColor: PRIMARY, padding: "16px 18px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {profile?.coverImageUrl
            ? <img src={profile.coverImageUrl} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.18)", flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: sans, fontSize: 18, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile?.businessName ?? "Book"}
            </p>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.65)", margin: "1px 0 0" }}>
              Book in a few taps
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, flexShrink: 0 }}>
            <X size={20} color="rgba(255,255,255,0.8)" />
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                flex: 1, height: 3, borderRadius: 2,
                backgroundColor: i <= stepIndex ? "#fff" : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", margin: "10px 0 0" }}>
          {finished ? "Booked" : !service ? "Choose a service" : `Step ${step} of 4 · ${STEPS[step - 1]}`}
        </p>
      </div>

      {/* Service context */}
      {service && !confirmedBooking && (
        <div style={{ backgroundColor: "#fff", padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0, borderBottom: `0.5px solid ${BORDER}` }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: DARK, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {service.name}
            </p>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: "1px 0 0" }}>
              {service.durationMinutes} min
            </p>
          </div>
          <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: PRIMARY, flexShrink: 0 }}>
            from K{Number(service.priceZmw)}
          </span>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
        {finished ? (
          <div style={{ textAlign: "center", padding: "24px 8px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Check size={26} color="#15803d" />
            </div>
            <p style={{ fontFamily: sans, fontSize: 18, fontWeight: 600, color: DARK, margin: "0 0 6px" }}>You're booked</p>
            <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, margin: 0, lineHeight: 1.6 }}>
              {confirmedBooking ? (
                <>
                  {confirmedBooking.service}
                  {confirmedBooking.staff ? ` with ${confirmedBooking.staff}` : ""}
                  {confirmedBooking.date ? ` on ${confirmedBooking.date}` : ""}
                  {confirmedBooking.time ? ` at ${confirmedBooking.time}` : ""}.
                </>
              ) : (
                <>
                  {service.name} with {slot?.staff?.fullName} on{" "}
                  {new Date(slot.startsAt).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })} at {timeLabel(slot.startsAt)}.
                </>
              )}
            </p>
            {confirmedBooking?.ref && (
              <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: HINT, margin: "10px 0 0" }}>
                Reference {confirmedBooking.ref}
              </p>
            )}
            <button
              onClick={onClose}
              style={{ marginTop: 20, fontFamily: sans, fontSize: 14, fontWeight: 600, padding: "13px 28px", borderRadius: 12, border: "none", backgroundColor: PRIMARY, color: "#fff", cursor: "pointer" }}
            >
              Done
            </button>
          </div>
        ) : !service ? (
          <>
            <Bubble>What would you like to book?</Bubble>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(profile?.services ?? []).filter((s) => s.isActive).map((s) => (
                <OptionCard
                  key={s.id}
                  grow
                  title={s.name}
                  sub={`${s.durationMinutes} min · from K${Number(s.priceZmw)}`}
                  onClick={() => setService(s)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {step === 1 && (
              <>
                <Bubble>Great choice! Who would you like to book with?</Bubble>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <OptionCard
                    grow
                    title="Any available"
                    sub="Soonest slot"
                    selected={staff === null}
                    onClick={() => { setStaff(null); setStep(2); }}
                  />
                  {bookableStaff.map((s) => (
                    <OptionCard
                      key={s.id}
                      title={s.fullName}
                      selected={staff?.id === s.id}
                      onClick={() => { setStaff(s); setStep(2); }}
                    />
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Bubble>Which day suits you{staff ? ` with ${staff.fullName.split(" ")[0]}` : ""}?</Bubble>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {days.map((d) => (
                    <OptionCard
                      key={d.iso}
                      title={d.label}
                      sub={d.sub}
                      selected={date === d.iso}
                      onClick={() => { setDate(d.iso); setStep(3); }}
                    />
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <Bubble>What time works for you?</Bubble>
                {loadingSlots && (
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, margin: 0 }}>Checking times…</p>
                )}
                {!loadingSlots && slots.length === 0 && (
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, margin: 0, lineHeight: 1.6 }}>
                    Nothing free{staff ? ` with ${staff.fullName.split(" ")[0]}` : ""} that day. Tap Back to try another.
                  </p>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))", gap: 8 }}>
                  {slots.map((s) => (
                    <OptionCard
                      key={s.startsAt}
                      title={timeLabel(s.startsAt)}
                      sub={!staff ? s.staff.fullName.split(" ")[0] : null}
                      selected={slot?.startsAt === s.startsAt}
                      onClick={() => { setSlot(s); setStep(4); }}
                    />
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <Bubble>Almost there. Who is this booking for?</Bubble>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={LABEL}>Your name</label>
                    <input
                      autoFocus
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Jane Mwansa"
                      style={FIELD}
                    />
                  </div>
                  <div>
                    <label style={LABEL}>Phone number</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="0971234567"
                      inputMode="tel"
                      style={FIELD}
                    />
                  </div>
                  <div>
                    <label style={LABEL}>Notes <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Anything we should know?"
                      rows={2}
                      style={{ ...FIELD, resize: "none", fontSize: 14 }}
                    />
                  </div>

                  <div style={{ backgroundColor: CREAM, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
                    <Row label="With" value={slot?.staff?.fullName} />
                    <Row label="When" value={`${new Date(slot.startsAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })} · ${timeLabel(slot.startsAt)}`} />
                    <Row
                      label={needsDeposit ? "Deposit now" : "Pay at salon"}
                      value={needsDeposit ? `K${Number(service.depositZmw)}` : `K${Number(service.priceZmw)}`}
                      last
                    />
                  </div>

                  {(formError || submitError) && (
                    <p style={{ fontFamily: sans, fontSize: 12, color: "#dc2626", margin: 0 }}>
                      {formError || submitError?.graphQLErrors?.[0]?.message || submitError?.message}
                    </p>
                  )}

                  <button
                    onClick={confirm}
                    disabled={submitting}
                    style={{
                      width: "100%", fontFamily: sans, fontSize: 15, fontWeight: 600,
                      padding: "15px 0", borderRadius: 12, border: "none",
                      backgroundColor: PRIMARY, color: "#fff",
                      cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    {submitting ? "Booking…" : needsDeposit ? `Pay K${Number(service.depositZmw)} deposit` : "Confirm booking"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Back */}
      {showBack && (
        <div style={{ padding: "12px 18px", borderTop: `0.5px solid ${BORDER}`, flexShrink: 0, backgroundColor: "#fff" }}>
          <button
            onClick={back}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: sans, fontSize: 13, fontWeight: 500, color: MUTED, padding: 0 }}
          >
            <ChevronLeft size={16} /> Back
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: last ? 0 : 7 }}>
      <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED }}>{label}</span>
      <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: DARK, textAlign: "right" }}>{value}</span>
    </div>
  );
}
