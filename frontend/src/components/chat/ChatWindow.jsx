import { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles, ShieldCheck } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAgentChat } from "../../hooks/useAgentChat";
import { playPopSound, playDingSound } from "../../lib/sounds";
import { CHECK_PAYMENT_STATUS } from "../../graphql/queries/bookings";

const DARK    = "#1A0A0D";
const PRIMARY = "#6B2737";
const serif   = "'Cormorant Garamond', Georgia, serif";
const sans    = "Inter, sans-serif";

// ── Parsing helpers ───────────────────────────────────────────────────────────

function to12h(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function parseTimeSlots(text) {
  const lines = text.split("\n");
  const timeLineRe = /^\s*-?\s*(\d{1,2}:\d{2})\s*(AM|PM)?(?:\s.*)?$/i;
  const timeLines = lines.filter((l) => timeLineRe.test(l) && l.trim().length > 0);

  if (timeLines.length >= 2) {
    const slots = [
      ...new Set(
        timeLines.map((l) => {
          const m = l.match(/(\d{1,2}:\d{2})\s*(AM|PM)?/i);
          if (!m) return null;
          const [, time, period] = m;
          if (period) {
            const [h, min] = time.split(":");
            return `${parseInt(h, 10)}:${min} ${period.toUpperCase()}`;
          }
          return to12h(time);
        }).filter(Boolean),
      ),
    ];
    const firstTimeIdx = lines.findIndex((l) => timeLineRe.test(l));
    const lastTimeIdx = lines.reduce((last, l, i) => (timeLineRe.test(l) && l.trim() ? i : last), -1);
    const header = lines.slice(0, firstTimeIdx).join(" ").replace(/\*\*/g, "").replace(/[:\-]+\s*$/, "").trim();
    const footer = lines.slice(lastTimeIdx + 1).join("\n").replace(/\*\*/g, "").trim();
    return { header: header || "Available times", slots, footer: footer || null };
  }

  const time12Re = /\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b/gi;
  const matches12 = [...text.matchAll(time12Re)];
  if (matches12.length >= 2) {
    const firstIdx = text.search(/\d{1,2}:\d{2}\s*(?:AM|PM)/i);
    const header = text.slice(0, firstIdx).replace(/\*\*/g, "").replace(/[:\-]+\s*$/, "").trim();
    return { header: header || "Available times", slots: [...new Set(matches12.map((m) => m[1].replace(/\s+/, " ")))] };
  }
  return null;
}

function parseServiceCard(text) {
  const structured = text.match(
    /SERVICE:\s*(.+?)\s*\|\s*DURATION:\s*(\d+)\s*min\s*\|\s*PRICE:\s*ZMW\s*([\d,]+(?:\.\d+)?)(?:\s*\|\s*DEPOSIT:\s*ZMW\s*([\d,]+(?:\.\d+)?))?(?:\s*\|\s*STAFF:\s*(.+?))?(?:\n|$)/i,
  );
  if (!structured) return null;
  return { name: structured[1].trim(), duration: structured[2], price: structured[3], deposit: structured[4] || null, staff: structured[5]?.trim() || null };
}

function parseBookingConfirmed(text) {
  if (!/BOOKING_CONFIRMED/i.test(text)) return null;
  // Key-value parser — robust to field order changes
  const get = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*([^|\\n]+?)\\s*(?:\\||$)`, "i"));
    return m ? m[1].trim() : "";
  };
  const service     = get("service");
  const date        = get("date");
  const time        = get("time");
  const ref         = get("payment_ref");
  const checkoutUrl = get("checkout_url");
  const amount      = get("amount").replace(/^ZMW\s*/i, "");
  const staff       = get("staff");
  if (!service || !date || !time) return null;
  return { service, date, time, ref, checkoutUrl, amount, staff };
}

function parseBookingCancelled(text) {
  if (!/BOOKING_CANCELLED/i.test(text)) return null;
  const get = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*([^|\\n]+?)\\s*(?:\\||$)`, "i"));
    return m ? m[1].trim() : "";
  };
  const service = get("service");
  const date    = get("date");
  const time    = get("time");
  const staff   = get("staff");
  const ref     = get("ref");
  if (!service || !date) return null;
  return { service, date, time, staff, ref };
}

function parseBookingRescheduled(text) {
  if (!/BOOKING_RESCHEDULED/i.test(text)) return null;
  const get = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*([^|\\n]+?)\\s*(?:\\||$)`, "i"));
    return m ? m[1].trim() : "";
  };
  const service  = get("service");
  const oldDate  = get("old_date");
  const oldTime  = get("old_time");
  const newDate  = get("new_date");
  const newTime  = get("new_time");
  const staff    = get("staff");
  const ref      = get("ref");
  if (!service || !oldDate || !newDate) return null;
  return { service, oldDate, oldTime, newDate, newTime, staff, ref };
}

function parseMobilePaymentSent(text) {
  if (!/MOBILE_PAYMENT_SENT/i.test(text)) return null;
  const get = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*([^|\\n]+?)\\s*(?:\\||$)`, "i"));
    return m ? m[1].trim() : "";
  };
  const service = get("service");
  const date    = get("date");
  const time    = get("time");
  const amount  = get("amount").replace(/^ZMW\s*/i, "");
  const staff   = get("staff");
  const phone   = get("phone");
  const ref     = get("payment_ref");
  if (!service || !date || !time) return null;
  return { service, date, time, amount, staff, phone, ref };
}

// ── Rich components ───────────────────────────────────────────────────────────

function ConfirmedCard({ data }) {
  const dateLabel = (() => {
    try { return new Date(`${data.date}T${data.time}`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }); }
    catch { return data.date; }
  })();
  const depositPaid = data.amount && parseFloat(data.amount) > 0;
  return (
    <div style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(74,222,128,0.25)", borderRadius: 10, padding: 14, marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>✓</span>
        </div>
        <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: "#4ade80", margin: 0 }}>Booking confirmed</p>
      </div>
      <p style={{ fontFamily: serif, fontSize: 16, fontWeight: 400, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>{data.service}</p>
      <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 2px" }}>{dateLabel} at {to12h(data.time)}</p>
      {data.staff && <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 12px" }}>with {data.staff}</p>}
      <div style={{ backgroundColor: "rgba(74,222,128,0.08)", border: "0.5px solid rgba(74,222,128,0.15)", borderRadius: 6, padding: "8px 12px", marginTop: 4 }}>
        {depositPaid ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#4ade80" }}>✓</span>
            <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0 }}>
              Deposit paid: ZMW {data.amount}
            </p>
          </div>
        ) : (
          <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0 }}>No deposit required — pay at the salon.</p>
        )}
      </div>
      {data.ref && <p style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "8px 0 0" }}>Ref: {data.ref}</p>}
    </div>
  );
}

function PaymentCard({ data, salonName }) {
  const payUrl = data.checkoutUrl || "";

  const dateLabel = (() => {
    try { return new Date(`${data.date}T${data.time}`).toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" }); }
    catch { return data.date; }
  })();

  return (
    <div style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 14, marginTop: 4 }}>
      <p style={{ fontFamily: serif, fontSize: 16, fontWeight: 400, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>{data.service}</p>
      <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 2px" }}>{dateLabel} at {to12h(data.time)}</p>
      <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 12px" }}>with {data.staff}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
        <span style={{ fontFamily: sans, fontSize: 20, fontWeight: 500, color: "#fff" }}>ZMW {data.amount}</span>
        <span style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>deposit to confirm</span>
      </div>
      <a href={payUrl} style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "10px 0", backgroundColor: PRIMARY, color: "#fff", border: "none", borderRadius: 6, fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", cursor: "pointer", textAlign: "center", textDecoration: "none" }}>
        Pay ZMW {data.amount} to confirm
      </a>
      <p style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "8px 0 0", textAlign: "center" }}>Slot held for 30 minutes</p>
    </div>
  );
}

function ServiceCard({ data, onSend }) {
  return (
    <div style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 14, marginTop: 4 }}>
      <p style={{ fontFamily: serif, fontSize: 17, fontWeight: 400, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>{data.name}</p>
      <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>{data.duration} min{data.staff ? ` · With ${data.staff}` : ""}</p>
      <p style={{ fontFamily: sans, fontSize: 18, fontWeight: 400, color: "#fff", margin: "0 0 12px", lineHeight: 1 }}>
        ZMW {data.price}
        {data.deposit && <span style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.45)", marginLeft: 8 }}>+ ZMW {data.deposit} deposit</span>}
      </p>
      <button onClick={() => onSend(`What times are available for ${data.name}?`)} style={{ width: "100%", padding: "9px 0", backgroundColor: PRIMARY, color: "#fff", border: "none", borderRadius: 6, fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", cursor: "pointer" }}>
        Select a time
      </button>
    </div>
  );
}

function SlotGrid({ data, onSend }) {
  const [done, setDone] = useState(false);

  function pickSlot(slot) {
    if (done) return;
    setDone(true);
    onSend(`I want to book at ${slot}`);
  }

  return (
    <div style={{ marginTop: 4 }}>
      {data.header && <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.55)", margin: "0 0 8px" }}>{data.header}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {data.slots.map((slot) => (
          <button
            key={slot}
            onClick={() => pickSlot(slot)}
            disabled={done}
            style={{
              padding: "6px 12px",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              borderRadius: 6, color: "#fff", fontFamily: sans, fontSize: 12,
              fontWeight: 400, cursor: done ? "default" : "pointer",
              transition: "background 0.12s",
              opacity: done ? 0.35 : 1,
            }}
          >
            {slot}
          </button>
        ))}
      </div>
      {data.footer && <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.55)", margin: "10px 0 0" }}>{data.footer}</p>}
    </div>
  );
}

// ── Mobile payment sent card ──────────────────────────────────────────────────

function MobilePaymentCard({ data }) {
  const dateLabel = (() => {
    try {
      return new Date(`${data.date}T${data.time}`).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long",
      });
    } catch { return data.date; }
  })();

  return (
    <div style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 14, marginTop: 4 }}>
      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 14, color: "#fff" }}>📱</span>
        </div>
        <p style={{ fontFamily: serif, fontSize: 15, fontWeight: 400, color: "#fff", margin: 0 }}>
          Payment prompt sent
        </p>
      </div>

      {/* Booking details */}
      <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 2px" }}>{data.service}</p>
      <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 2px" }}>{dateLabel} at {to12h(data.time)}</p>
      <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 10px" }}>with {data.staff}</p>

      {/* Amount */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
        <span style={{ fontFamily: sans, fontSize: 20, fontWeight: 500, color: "#fff" }}>ZMW {data.amount}</span>
        <span style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>sent to {data.phone}</span>
      </div>

      {/* Instruction */}
      <div style={{ backgroundColor: "rgba(74,222,128,0.1)", border: "0.5px solid rgba(74,222,128,0.2)", borderRadius: 6, padding: "8px 12px" }}>
        <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.6 }}>
          Enter your PIN when prompted on your phone to confirm this booking.
        </p>
      </div>
    </div>
  );
}

// ── Cancelled card ────────────────────────────────────────────────────────────

function CancelledCard({ data }) {
  const dateLabel = (() => {
    try { return new Date(`${data.date}T${data.time || "00:00"}`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }); }
    catch { return data.date; }
  })();
  return (
    <div style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: 14, marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>✕</span>
        </div>
        <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: "#f87171", margin: 0 }}>Booking cancelled</p>
      </div>
      <p style={{ fontFamily: sans, fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "0 0 2px" }}>{data.service}</p>
      <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 2px" }}>{dateLabel}{data.time ? ` at ${to12h(data.time)}` : ""}</p>
      {data.staff && <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 10px" }}>with {data.staff}</p>}
      <p style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>Ref: {data.ref}</p>
    </div>
  );
}

// ── Rescheduled card ──────────────────────────────────────────────────────────

function RescheduledCard({ data }) {
  const fmt = (date, time) => {
    try { return new Date(`${date}T${time || "00:00"}`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + (time ? ` at ${to12h(time)}` : ""); }
    catch { return date; }
  };
  return (
    <div style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(74,222,128,0.25)", borderRadius: 10, padding: 14, marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>↻</span>
        </div>
        <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: "#4ade80", margin: 0 }}>Booking rescheduled</p>
      </div>
      <p style={{ fontFamily: sans, fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "0 0 10px" }}>{data.service}{data.staff ? ` · ${data.staff}` : ""}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "0.5px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.35)", minWidth: 32 }}>Was</span>
          <span style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.45)", textDecoration: "line-through" }}>{fmt(data.oldDate, data.oldTime)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.35)", minWidth: 32 }}>Now</span>
          <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: "#fff" }}>{fmt(data.newDate, data.newTime)}</span>
        </div>
      </div>
      <p style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "10px 0 0" }}>Ref: {data.ref}</p>
    </div>
  );
}

// ── Receipt card ──────────────────────────────────────────────────────────────

function ReceiptCard({ booking, salonName }) {
  const dateLabel = (() => {
    try {
      return new Date(`${booking.date}T${booking.time}`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch { return booking.date; }
  })();

  const Row = ({ label, value, bold, mono }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "8px 0", borderBottom: "0.5px solid #e8d8dc" }}>
      <span style={{ fontSize: 11, color: "#9B7A80", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 600 : 400, color: "#1A0A0D", textAlign: "right", fontFamily: mono ? "monospace" : sans }}>{value}</span>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", marginTop: 4, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#1A0A0D", padding: "20px 20px 16px", textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <span style={{ color: "#fff", fontSize: 20, lineHeight: 1 }}>✓</span>
        </div>
        <p style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: "#fff", margin: "0 0 2px", letterSpacing: "-0.3px" }}>Booking Confirmed</p>
        {salonName && <p style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>{salonName}</p>}
      </div>

      {/* Body */}
      <div style={{ padding: "4px 16px 0" }}>
        <Row label="Service"  value={booking.service} />
        <Row label="Date"     value={dateLabel} />
        <Row label="Time"     value={to12h(booking.time)} />
        <Row label="With"     value={booking.staff} />
      </div>

      {/* Payment strip */}
      <div style={{ backgroundColor: "#FDF5F6", borderTop: "0.5px solid #E8D8DC", borderBottom: "0.5px solid #E8D8DC", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 0" }}>
        <span style={{ fontSize: 12, color: "#9B7A80" }}>Deposit paid</span>
        <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 600, color: "#1A0A0D" }}>ZMW {booking.amount}</span>
      </div>

      {/* Ref */}
      <div style={{ padding: "8px 16px 0" }}>
        <Row label="Ref" value={booking.ref} mono />
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 16px 16px", textAlign: "center" }}>
        <p style={{ fontFamily: sans, fontSize: 11, color: "#9B7A80", margin: 0, lineHeight: 1.6 }}>
          You'll receive a reminder before your appointment.
        </p>
      </div>
    </div>
  );
}

function renderRichText(text) {
  const lines = text.split("\n");
  const els = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) {
      els.push(<div key={i} style={{ height: 6 }} />);
      i++;
      continue;
    }
    // Bullet line
    if (/^[-•]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[-•]\s*/, "");
      const colonIdx = content.indexOf(":");
      const hasLabel = colonIdx > 0 && colonIdx < 40;
      els.push(
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "5px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          <ShieldCheck size={13} style={{ color: PRIMARY, flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontFamily: sans, fontSize: 13, color: "rgba(255,255,255,0.88)", lineHeight: 1.55 }}>
            {hasLabel ? (
              <>
                <span style={{ fontWeight: 600, color: "#fff" }}>{content.slice(0, colonIdx)}</span>
                <span style={{ color: "rgba(255,255,255,0.55)" }}>:</span>
                {content.slice(colonIdx + 1)}
              </>
            ) : content}
          </span>
        </div>
      );
      i++;
      continue;
    }
    // Section header (short line ending with ":")
    if (trimmed.endsWith(":") && trimmed.length < 60) {
      els.push(
        <p key={i} style={{ fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: els.length > 0 ? "10px 0 4px" : "0 0 4px" }}>
          {trimmed.slice(0, -1)}
        </p>
      );
      i++;
      continue;
    }
    // Plain line
    els.push(
      <span key={i} style={{ fontFamily: sans, fontSize: 13, color: "rgba(255,255,255,0.88)", lineHeight: 1.6, display: "block" }}>
        {trimmed}
      </span>
    );
    i++;
  }
  return <div style={{ display: "flex", flexDirection: "column" }}>{els}</div>;
}

function renderMessage(text, onSend, salonName, customerName) {
  // Mobile money — USSD prompt sent to phone
  const mobileIdx = text.search(/MOBILE_PAYMENT_SENT\s*\|/i);
  if (mobileIdx !== -1) {
    const humanText = text.slice(0, mobileIdx).trim();
    const mobileData = parseMobilePaymentSent(text.slice(mobileIdx));
    if (mobileData) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {humanText && <span style={{ whiteSpace: "pre-wrap" }}>{humanText}</span>}
          <MobilePaymentCard data={mobileData} />
        </div>
      );
    }
  }

  // Booking confirmed — ConfirmedCard handles both deposit-paid and no-deposit cases
  const bookingIdx = text.search(/BOOKING_CONFIRMED\s*\|/i);
  if (bookingIdx !== -1) {
    const humanText = text.slice(0, bookingIdx).trim();
    const booking = parseBookingConfirmed(text.slice(bookingIdx));
    if (booking) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {humanText && <span style={{ whiteSpace: "pre-wrap" }}>{humanText}</span>}
          <ConfirmedCard data={booking} />
        </div>
      );
    }
  }

  // Cancellation confirmation
  const cancelIdx = text.search(/BOOKING_CANCELLED\s*\|/i);
  if (cancelIdx !== -1) {
    const humanText = text.slice(0, cancelIdx).trim();
    const cancelData = parseBookingCancelled(text.slice(cancelIdx));
    if (cancelData) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {humanText && <span style={{ whiteSpace: "pre-wrap" }}>{humanText}</span>}
          <CancelledCard data={cancelData} />
        </div>
      );
    }
  }

  // Reschedule confirmation
  const reschedIdx = text.search(/BOOKING_RESCHEDULED\s*\|/i);
  if (reschedIdx !== -1) {
    const humanText = text.slice(0, reschedIdx).trim();
    const reschedData = parseBookingRescheduled(text.slice(reschedIdx));
    if (reschedData) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {humanText && <span style={{ whiteSpace: "pre-wrap" }}>{humanText}</span>}
          <RescheduledCard data={reschedData} />
        </div>
      );
    }
  }

  const slots = parseTimeSlots(text);
  if (slots) return <SlotGrid data={slots} onSend={onSend} />;
  const service = parseServiceCard(text);
  if (service) return <ServiceCard data={service} onSend={onSend} />;
  return renderRichText(text);
}

function MessageBubble({ message, onSend, salonName, customerName }) {
  if (message.type === "receipt") {
    return (
      <div className="animate-chat-fade-in" style={{ display: "flex", justifyContent: "flex-start" }}>
        <div style={{ maxWidth: "92%", width: "100%" }}>
          <ReceiptCard booking={message.booking} salonName={salonName} />
        </div>
      </div>
    );
  }

  // Streaming in-progress: show raw accumulated text + blinking cursor
  if (message.streaming) {
    return (
      <div className="animate-chat-fade-in" style={{ display: "flex", justifyContent: "flex-start" }}>
        <div style={{ maxWidth: "88%", padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px 12px 12px 2px", fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {message.content}
          <span className="streaming-cursor">▋</span>
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";
  if (isUser) {
    const displayText = message.content.replace(/\s*\[service_id:\d+\]/gi, "").trim();

    // Clean up booking messages: "I want to book Category — Service" → "I'd like to book Service"
    const bookMatch = displayText.match(/^I want to book (?:.+?—\s*)?(.+)$/i);
    const cleanText = bookMatch ? `I'd like to book ${bookMatch[1]}` : displayText;

    return (
      <div className="animate-chat-fade-in" style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ maxWidth: "78%", padding: "9px 14px", backgroundColor: PRIMARY, borderRadius: "12px 12px 2px 12px", fontFamily: sans, fontSize: 13, fontWeight: 400, color: "#fff", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {cleanText}
        </div>
      </div>
    );
  }
  return (
    <div className="animate-chat-fade-in" style={{ display: "flex", justifyContent: "flex-start" }}>
      <div style={{ maxWidth: "88%", padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px 12px 12px 2px", fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>
        {renderMessage(message.content, onSend, salonName, customerName)}
      </div>
    </div>
  );
}

function ChatInputBar({ onSend, loading, disabled = false }) {
  const [value, setValue] = useState("");
  const isDisabled = loading || disabled;
  function submit(e) { e.preventDefault(); if (!value.trim() || isDisabled) return; onSend(value.trim()); setValue(""); }
  return (
    <form onSubmit={submit} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderTop: "0.5px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={disabled ? "Just a moment…" : "Type a message…"} disabled={isDisabled} className="chat-dark-input" style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px", fontFamily: sans, fontSize: 16, fontWeight: 300, color: "#fff", outline: "none" }} />
      <button type="submit" disabled={!value.trim() || isDisabled} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: PRIMARY, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !value.trim() || isDisabled ? 0.4 : 1 }}>
        {loading ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> : <Send size={15} color="#fff" />}
      </button>
    </form>
  );
}

// ── Chat header (shared between intake and chat body) ─────────────────────────

function ChatHeader({ salonName, onClose }) {
  return (
    <div style={{ padding: "14px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: 18, width: "auto" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: serif, fontSize: 18, fontWeight: 400, color: "#fff", margin: 0, lineHeight: 1.2, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {salonName || "Booking Assistant"}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80", display: "inline-block" }} />
          <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,0.5)" }}>Online now</span>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", padding: 10, display: "flex", alignItems: "center" }}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ── Intake form ───────────────────────────────────────────────────────────────

function IntakeForm({ salonName, onSubmit, onClose }) {
  const [name, setName]   = useState("");
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    backgroundColor: "rgba(255,255,255,0.07)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    borderRadius: 10, padding: "11px 14px",
    fontFamily: sans, fontSize: 16, fontWeight: 300,
    color: "#fff", outline: "none",
  };

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    setError("");
    onSubmit({ name: name.trim(), phone: "" });
  }

  return (
    <div className="animate-chat-slide-up fixed bottom-4 z-50 flex flex-col overflow-hidden"
      style={{ width: "min(380px, calc(100vw - 16px))", right: 8, maxHeight: 600, borderRadius: 20, backgroundColor: DARK, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <ChatHeader salonName={salonName} onClose={onClose} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 20px" }}>
        <p style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.3px" }}>
          Before we start
        </p>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.5)", margin: "0 0 24px", lineHeight: 1.6 }}>
          What's your name?
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            autoFocus
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          {error && <p style={{ fontFamily: sans, fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>}
          <button type="submit" style={{ marginTop: 4, width: "100%", padding: "12px 0", backgroundColor: PRIMARY, color: "#fff", border: "none", borderRadius: 10, fontFamily: sans, fontSize: 13, fontWeight: 500, cursor: "pointer", letterSpacing: "0.02em" }}>
            Start booking
          </button>
        </form>
      </div>
    </div>
  );
}

function getChatVerifyUrl() {
  const RESERVED = new Set(["www", "api", "app", "admin", "mail", "smtp", "ftp", "cdn"]);
  const parts = window.location.hostname.split(".");
  const sub =
    parts.length >= 3 ? parts[0] :
    parts.length === 2 && parts[1] === "localhost" ? parts[0] :
    null;
  const slug = sub && !RESERVED.has(sub) ? sub : null;
  const apiDomain = import.meta.env.VITE_TENANT_API_DOMAIN;
  if (slug) {
    return apiDomain
      ? `https://${slug}.${apiDomain}/chat/verify/`
      : `http://${slug}.localhost:8000/chat/verify/`;
  }
  const base = (import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8000/graphql/").replace(/\/graphql\/?$/, "");
  return `${base}/chat/verify/`;
}

// ── Chat body (rendered after intake) ────────────────────────────────────────

function ChatBody({ customer, onClose, salonName, initialMessage, confirmedBooking }) {
  const [sessionToken, setSessionToken] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const verifyUrl = useRef(getChatVerifyUrl()).current;
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  async function doVerify(turnstileToken) {
    try {
      const res = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken: turnstileToken || "" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sessionToken) setSessionToken(data.sessionToken);
      }
    } catch { /* Verification failed — chat still usable without a token */ }
    finally { setVerifying(false); }
  }

  useEffect(() => {
    // If no Turnstile key, verify immediately on mount (backend skips Turnstile check)
    if (!turnstileSiteKey) doVerify("");
    // If Turnstile key is set, doVerify is called from the Turnstile onSuccess callback
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { messages, sendMessage, loading, limitReached, sessionEnded } = useAgentChat(
    customer.phone, customer.name, salonName, initialMessage, confirmedBooking, sessionToken,
  );
  const [extraMessages, setExtraMessages] = useState([]);
  const [pollRef, setPollRef] = useState(null);
  const receiptInjectedRef = useRef(false);
  const displayMessages = [...messages, ...extraMessages];
  const bottomRef = useRef(null);
  const prevCountRef = useRef(messages.length);

  // Detect MOBILE_PAYMENT_SENT and start polling
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "assistant" && msg.content) {
        const data = parseMobilePaymentSent(msg.content);
        if (data?.ref && data.ref !== pollRef) {
          receiptInjectedRef.current = false;
          setPollRef(data.ref);
        }
        break;
      }
    }
  }, [messages]);

  // Poll checkPaymentStatus every 3s while waiting for PIN confirmation
  const { data: pollData } = useQuery(CHECK_PAYMENT_STATUS, {
    variables: { ref: pollRef },
    pollInterval: 3000,
    skip: !pollRef || receiptInjectedRef.current,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (pollData?.checkPaymentStatus?.status === "completed" && pollRef && !receiptInjectedRef.current) {
      receiptInjectedRef.current = true;
      // Find the mobile payment data from the triggering message
      let mobileData = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === "assistant" && msg.content) {
          const d = parseMobilePaymentSent(msg.content);
          if (d?.ref === pollRef) { mobileData = d; break; }
        }
      }
      setExtraMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "receipt",
          booking: {
            service:  mobileData?.service || pollData.checkPaymentStatus.serviceName,
            date:     mobileData?.date    || pollData.checkPaymentStatus.startsAt.slice(0, 10),
            time:     mobileData?.time    || pollData.checkPaymentStatus.startsAt.slice(11, 16),
            staff:    mobileData?.staff   || "",
            amount:   mobileData?.amount  || "",
            ref:      pollRef,
            customer: customer.name,
          },
        },
      ]);
      setPollRef(null);
    }
  }, [pollData, pollRef]);

  useEffect(() => { playPopSound(); }, []);

  useEffect(() => {
    const prev = prevCountRef.current;
    const curr = messages.length;
    if (curr > prev && messages[curr - 1]?.role === "assistant") playDingSound();
    prevCountRef.current = curr;
  }, [messages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [displayMessages, loading]);

  return (
    <div className="animate-chat-slide-up fixed bottom-4 z-50 flex flex-col overflow-hidden"
      style={{ width: "min(380px, calc(100vw - 16px))", right: 8, maxHeight: 600, borderRadius: 20, backgroundColor: DARK, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <ChatHeader salonName={salonName} onClose={onClose} />

      {/* Hidden Turnstile — runs silently; onSuccess/onError both call doVerify */}
      {turnstileSiteKey && verifying && (
        <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", top: 0, left: 0 }}>
          <Turnstile
            siteKey={turnstileSiteKey}
            onSuccess={(token) => doVerify(token)}
            onError={() => doVerify("")}
            onExpire={() => doVerify("")}
          />
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {displayMessages.map((msg, i) => (
          <MessageBubble key={i} message={msg} onSend={sendMessage} salonName={salonName} customerName={customer.name} />
        ))}
        {loading && !displayMessages.some((m) => m.streaming) && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px 12px 12px 2px", padding: "10px 16px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="animate-bounce" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.4)", display: "inline-block", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        {limitReached && (
          <div style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: "12px 12px 12px 2px", padding: "10px 14px" }}>
            <span style={{ fontFamily: sans, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              You've reached the message limit for this session. To continue, please refresh the page or contact the salon directly.
            </span>
          </div>
        )}
        {sessionEnded && (
          <div style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: "12px 12px 12px 2px", padding: "10px 14px" }}>
            <span style={{ fontFamily: sans, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              Close and reopen the chat to start a new booking.
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInputBar onSend={sendMessage} loading={loading} disabled={limitReached || sessionEnded} />
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ChatWindow({ customerPhone, customerName, onClose, salonName, initialMessage, confirmedBooking, skipIntake }) {
  const [customer, setCustomer] = useState(
    (customerPhone && customerPhone !== "+260000000000") || skipIntake
      ? { name: customerName || "", phone: customerPhone || "" }
      : null,
  );

  // If returning from payment with a receipt, skip intake form
  if (confirmedBooking && !customer) {
    return (
      <ChatBody
        customer={{ name: confirmedBooking.customer || "", phone: "" }}
        onClose={onClose}
        salonName={salonName}
        initialMessage={initialMessage}
        confirmedBooking={confirmedBooking}
      />
    );
  }

  if (!customer) {
    return <IntakeForm salonName={salonName} onSubmit={setCustomer} onClose={onClose} />;
  }

  return (
    <ChatBody
      customer={customer}
      onClose={onClose}
      salonName={salonName}
      initialMessage={initialMessage}
      confirmedBooking={confirmedBooking}
    />
  );
}
