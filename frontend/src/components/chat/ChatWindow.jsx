import { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { useAgentChat } from "../../hooks/useAgentChat";
import { playPopSound, playDingSound } from "../../lib/sounds";

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
  if (structured) {
    return { name: structured[1].trim(), duration: structured[2], price: structured[3], deposit: structured[4] || null, staff: structured[5]?.trim() || null };
  }
  const priceMatch = text.match(/ZMW\s*([\d,]+(?:\.\d+)?)/i);
  const durationMatch = text.match(/(\d+)\s*min/i);
  if (!priceMatch || !durationMatch) return null;
  const lines = text.trim().split("\n").map((l) => l.replace(/\*\*/g, "").trim()).filter(Boolean);
  if (!lines[0] || lines[0].length > 60) return null;
  const staffMatch = text.match(/with\s+([A-Za-z]+)/i);
  const depositMatch = text.match(/ZMW\s*([\d,]+(?:\.\d+)?)\s*deposit|deposit.*?ZMW\s*([\d,]+(?:\.\d+)?)/i);
  return { name: lines[0], duration: durationMatch[1], price: priceMatch[1], deposit: depositMatch ? depositMatch[1] || depositMatch[2] : null, staff: staffMatch?.[1] || null };
}

function parseBookingConfirmed(text) {
  const match = text.match(
    /BOOKING_CONFIRMED\s*\|\s*service:\s*(.+?)\s*\|\s*date:\s*(\d{4}-\d{2}-\d{2})\s*\|\s*time:\s*(\d{2}:\d{2})\s*\|\s*payment_ref:\s*(\S+?)\s*\|\s*amount:\s*ZMW\s*([\d.]+)\s*\|\s*staff:\s*(.+?)(?:\n|$)/i,
  );
  if (!match) return null;
  return { service: match[1].trim(), date: match[2], time: match[3], ref: match[4].trim(), amount: match[5], staff: match[6].trim() };
}

// ── Rich components ───────────────────────────────────────────────────────────

function PaymentCard({ data, salonName, customerName }) {
  const slug = window.location.hostname.split(".")[0];
  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN;
  const port = window.location.port || "3000";
  const payBase = appDomain ? `https://${appDomain}` : `http://localhost:${port}`;
  const payUrl =
    `${payBase}/pay` +
    `?ref=${encodeURIComponent(data.ref)}` +
    `&amount=${data.amount}` +
    `&service=${encodeURIComponent(data.service)}` +
    `&salon=${encodeURIComponent(salonName || "")}` +
    `&slug=${slug}` +
    `&date=${data.date}` +
    `&time=${encodeURIComponent(data.time)}` +
    `&staff=${encodeURIComponent(data.staff)}` +
    `&customer=${encodeURIComponent(customerName || "")}`;

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
  const [selected, setSelected] = useState(null);
  function pick(slot) { setSelected(slot); onSend(`I want to book at ${slot}`); }
  return (
    <div style={{ marginTop: 4 }}>
      {data.header && <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.55)", margin: "0 0 8px" }}>{data.header}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {data.slots.map((slot) => (
          <button key={slot} onClick={() => pick(slot)} style={{ padding: "6px 12px", backgroundColor: selected === slot ? PRIMARY : "rgba(255,255,255,0.06)", border: `0.5px solid ${selected === slot ? PRIMARY : "rgba(255,255,255,0.12)"}`, borderRadius: 6, color: "#fff", fontFamily: sans, fontSize: 12, fontWeight: 400, cursor: "pointer", transition: "background 0.12s" }}>{slot}</button>
        ))}
      </div>
      {data.footer && <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.55)", margin: "10px 0 0" }}>{data.footer}</p>}
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

function renderMessage(text, onSend, salonName, customerName) {
  const bookingIdx = text.search(/BOOKING_CONFIRMED\s*\|/i);
  if (bookingIdx !== -1) {
    const humanText = text.slice(0, bookingIdx).trim();
    const booking = parseBookingConfirmed(text.slice(bookingIdx));
    if (booking) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {humanText && <span style={{ whiteSpace: "pre-wrap" }}>{humanText}</span>}
          <PaymentCard data={booking} salonName={salonName} customerName={customerName} />
        </div>
      );
    }
  }
  const slots = parseTimeSlots(text);
  if (slots) return <SlotGrid data={slots} onSend={onSend} />;
  const service = parseServiceCard(text);
  if (service) return <ServiceCard data={service} onSend={onSend} />;
  return <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>;
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

  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="animate-chat-fade-in" style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ maxWidth: "78%", padding: "9px 14px", backgroundColor: PRIMARY, borderRadius: "12px 12px 2px 12px", fontFamily: sans, fontSize: 13, fontWeight: 400, color: "#fff", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {message.content}
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

function ChatInputBar({ onSend, loading }) {
  const [value, setValue] = useState("");
  function submit(e) { e.preventDefault(); if (!value.trim() || loading) return; onSend(value.trim()); setValue(""); }
  return (
    <form onSubmit={submit} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderTop: "0.5px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type a message…" disabled={loading} className="chat-dark-input" style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px", fontFamily: sans, fontSize: 13, fontWeight: 300, color: "#fff", outline: "none" }} />
      <button type="submit" disabled={!value.trim() || loading} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: PRIMARY, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !value.trim() || loading ? 0.4 : 1 }}>
        {loading ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> : <Send size={15} color="#fff" />}
      </button>
    </form>
  );
}

// ── Chat header (shared between intake and chat body) ─────────────────────────

function ChatHeader({ salonName, onClose }) {
  const initial = (salonName || "K")[0].toUpperCase();
  return (
    <div style={{ padding: "14px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: "#fff" }}>{initial}</span>
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
  const [phone, setPhone] = useState("+260");
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    backgroundColor: "rgba(255,255,255,0.07)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    borderRadius: 10, padding: "11px 14px",
    fontFamily: sans, fontSize: 13, fontWeight: 300,
    color: "#fff", outline: "none",
  };

  function submit(e) {
    e.preventDefault();
    if (!name.trim())                            { setError("Please enter your name.");         return; }
    if (!phone.trim() || phone.trim() === "+260") { setError("Please enter your phone number."); return; }
    setError("");
    onSubmit({ name: name.trim(), phone: phone.trim() });
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
          So we know who to book the appointment for.
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            autoFocus
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="+260 97 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            style={inputStyle}
          />
          {error && <p style={{ fontFamily: sans, fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>}
          <button type="submit" style={{ marginTop: 4, width: "100%", padding: "12px 0", backgroundColor: PRIMARY, color: "#fff", border: "none", borderRadius: 10, fontFamily: sans, fontSize: 13, fontWeight: 500, cursor: "pointer", letterSpacing: "0.02em" }}>
            Start booking →
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Chat body (rendered after intake) ────────────────────────────────────────

function ChatBody({ customer, onClose, salonName, initialMessage, confirmedBooking }) {
  const { messages, sendMessage, loading } = useAgentChat(
    customer.phone, customer.name, salonName, initialMessage, confirmedBooking,
  );
  const bottomRef = useRef(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => { playPopSound(); }, []);

  useEffect(() => {
    const prev = prevCountRef.current;
    const curr = messages.length;
    if (curr > prev && messages[curr - 1]?.role === "assistant") playDingSound();
    prevCountRef.current = curr;
  }, [messages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  return (
    <div className="animate-chat-slide-up fixed bottom-4 z-50 flex flex-col overflow-hidden"
      style={{ width: "min(380px, calc(100vw - 16px))", right: 8, maxHeight: 600, borderRadius: 20, backgroundColor: DARK, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <ChatHeader salonName={salonName} onClose={onClose} />

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} onSend={sendMessage} salonName={salonName} customerName={customer.name} />
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px 12px 12px 2px", padding: "10px 16px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="animate-bounce" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.4)", display: "inline-block", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInputBar onSend={sendMessage} loading={loading} />
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ChatWindow({ customerPhone, customerName, onClose, salonName, initialMessage, confirmedBooking }) {
  const [customer, setCustomer] = useState(
    customerPhone && customerPhone !== "+260000000000"
      ? { name: customerName || "", phone: customerPhone }
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
