import { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { useAgentChat } from "../../hooks/useAgentChat";
import { playPopSound, playDingSound } from "../../lib/sounds";

const DARK = "#1A0A0D";
const PRIMARY = "#6B2737";
const serif = "'Cormorant Garamond', Georgia, serif";
const sans = "Inter, sans-serif";

// ── Parsing helpers ───────────────────────────────────────────────────────────

function to12h(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function parseTimeSlots(text) {
  // Primary: 24-hour format lines — "- 08:00" or "- 08:00 with Alice" or "08:00"
  const lines = text.split("\n");
  const time24Re = /^\s*-?\s*(\d{1,2}:\d{2})(?:\s.*)?$/;
  const timeLines = lines.filter(
    (l) => time24Re.test(l) && l.trim().length > 0,
  );
  if (timeLines.length >= 2) {
    const slots = [
      ...new Set(timeLines.map((l) => l.match(/(\d{1,2}:\d{2})/)[1])),
    ];
    const firstTimeIdx = lines.findIndex((l) => time24Re.test(l));
    const header = lines
      .slice(0, firstTimeIdx)
      .join(" ")
      .replace(/\*\*/g, "")
      .replace(/[:\-]+\s*$/, "")
      .trim();
    return { header: header || "Available times", slots };
  }

  // Fallback: 12-hour format — "9:00 AM", "11:30 PM"
  const time12Re = /\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b/gi;
  const matches12 = [...text.matchAll(time12Re)];
  if (matches12.length >= 2) {
    const firstIdx = text.search(/\d{1,2}:\d{2}\s*(?:AM|PM)/i);
    const header = text
      .slice(0, firstIdx)
      .replace(/\*\*/g, "")
      .replace(/[:\-]+\s*$/, "")
      .trim();
    return {
      header: header || "Available times",
      slots: [...new Set(matches12.map((m) => m[1].replace(/\s+/, " ")))],
    };
  }

  return null;
}

function parseServiceCard(text) {
  // Primary: structured format from system prompt
  // SERVICE: Box Braids | DURATION: 240 min | PRICE: ZMW 200 | DEPOSIT: ZMW 100 | STAFF: Alice
  const structured = text.match(
    /SERVICE:\s*(.+?)\s*\|\s*DURATION:\s*(\d+)\s*min\s*\|\s*PRICE:\s*ZMW\s*([\d,]+(?:\.\d+)?)(?:\s*\|\s*DEPOSIT:\s*ZMW\s*([\d,]+(?:\.\d+)?))?(?:\s*\|\s*STAFF:\s*(.+?))?(?:\n|$)/i,
  );
  if (structured) {
    return {
      name: structured[1].trim(),
      duration: structured[2],
      price: structured[3],
      deposit: structured[4] || null,
      staff: structured[5]?.trim() || null,
    };
  }

  // Fallback: heuristic detection (ZMW price + N min on short first line)
  const priceMatch = text.match(/ZMW\s*([\d,]+(?:\.\d+)?)/i);
  const durationMatch = text.match(/(\d+)\s*min/i);
  if (!priceMatch || !durationMatch) return null;
  const lines = text
    .trim()
    .split("\n")
    .map((l) => l.replace(/\*\*/g, "").trim())
    .filter(Boolean);
  if (!lines[0] || lines[0].length > 60) return null;
  const staffMatch = text.match(/with\s+([A-Za-z]+)/i);
  const depositMatch = text.match(
    /ZMW\s*([\d,]+(?:\.\d+)?)\s*deposit|deposit.*?ZMW\s*([\d,]+(?:\.\d+)?)/i,
  );
  return {
    name: lines[0],
    duration: durationMatch[1],
    price: priceMatch[1],
    deposit: depositMatch ? depositMatch[1] || depositMatch[2] : null,
    staff: staffMatch?.[1] || null,
  };
}

// ── Booking confirmed parser ──────────────────────────────────────────────────

function parseBookingConfirmed(text) {
  const match = text.match(
    /BOOKING_CONFIRMED\s*\|\s*service:\s*(.+?)\s*\|\s*date:\s*(\d{4}-\d{2}-\d{2})\s*\|\s*time:\s*(\d{2}:\d{2})\s*\|\s*payment_ref:\s*(\S+?)\s*\|\s*amount:\s*ZMW\s*([\d.]+)\s*\|\s*staff:\s*(.+?)(?:\n|$)/i,
  );
  if (!match) return null;
  return {
    service: match[1].trim(),
    date: match[2],
    time: match[3],
    ref: match[4].trim(),
    amount: match[5],
    staff: match[6].trim(),
  };
}

// ── Rich components ───────────────────────────────────────────────────────────

function PaymentCard({ data, salonName }) {
  const slug = window.location.hostname.split(".")[0];
  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN;
  const port = window.location.port || "3000";
  const payBase = appDomain
    ? `https://${appDomain}`
    : `http://localhost:${port}`;
  const payUrl =
    `${payBase}/pay` +
    `?ref=${encodeURIComponent(data.ref)}` +
    `&amount=${data.amount}` +
    `&service=${encodeURIComponent(data.service)}` +
    `&salon=${encodeURIComponent(salonName || "")}` +
    `&slug=${slug}`;

  const dateLabel = (() => {
    try {
      return new Date(`${data.date}T${data.time}`).toLocaleDateString("en-GB", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    } catch {
      return data.date;
    }
  })();

  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: 14,
        marginTop: 4,
      }}
    >
      <p
        style={{
          fontFamily: serif,
          fontSize: 16,
          fontWeight: 400,
          color: "#fff",
          margin: "0 0 4px",
          lineHeight: 1.2,
        }}
      >
        {data.service}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          margin: "0 0 2px",
        }}
      >
        {dateLabel} at {to12h(data.time)}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          margin: "0 0 12px",
        }}
      >
        with {data.staff}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: sans,
            fontSize: 20,
            fontWeight: 500,
            color: "#fff",
          }}
        >
          ZMW {data.amount}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          deposit to confirm
        </span>
      </div>
      <a
        href={payUrl}
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 0",
          backgroundColor: PRIMARY,
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontFamily: sans,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.04em",
          cursor: "pointer",
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        Pay ZMW {data.amount} to confirm
      </a>
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          color: "rgba(255,255,255,0.3)",
          margin: "8px 0 0",
          textAlign: "center",
        }}
      >
        Slot held for 30 minutes
      </p>
    </div>
  );
}

function ServiceCard({ data, onSend }) {
  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: 14,
        marginTop: 4,
      }}
    >
      <p
        style={{
          fontFamily: serif,
          fontSize: 17,
          fontWeight: 400,
          color: "#fff",
          margin: "0 0 4px",
          lineHeight: 1.2,
        }}
      >
        {data.name}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 300,
          color: "rgba(255,255,255,0.5)",
          margin: "0 0 8px",
        }}
      >
        {data.duration} min{data.staff ? ` · With ${data.staff}` : ""}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 18,
          fontWeight: 400,
          color: "#fff",
          margin: "0 0 12px",
          lineHeight: 1,
        }}
      >
        ZMW {data.price}
        {data.deposit && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 300,
              color: "rgba(255,255,255,0.45)",
              marginLeft: 8,
            }}
          >
            + ZMW {data.deposit} deposit
          </span>
        )}
      </p>
      <button
        onClick={() => onSend(`What times are available for ${data.name}?`)}
        style={{
          width: "100%",
          padding: "9px 0",
          backgroundColor: PRIMARY,
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontFamily: sans,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.04em",
          cursor: "pointer",
        }}
      >
        Select a time
      </button>
    </div>
  );
}

function SlotGrid({ data, onSend }) {
  const [selected, setSelected] = useState(null);

  function pick(slot) {
    setSelected(slot);
    onSend(`I want to book at ${slot}`);
  }

  return (
    <div style={{ marginTop: 4 }}>
      {data.header && (
        <p
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 300,
            color: "rgba(255,255,255,0.55)",
            margin: "0 0 8px",
          }}
        >
          {data.header}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {data.slots.map((slot) => (
          <button
            key={slot}
            onClick={() => pick(slot)}
            style={{
              padding: "6px 12px",
              backgroundColor:
                selected === slot ? PRIMARY : "rgba(255,255,255,0.06)",
              border: `0.5px solid ${selected === slot ? PRIMARY : "rgba(255,255,255,0.12)"}`,
              borderRadius: 6,
              color: "#fff",
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 400,
              cursor: "pointer",
              transition: "background 0.12s",
            }}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}

function renderMessage(text, onSend, salonName) {
  const bookingIdx = text.search(/BOOKING_CONFIRMED\s*\|/i);
  if (bookingIdx !== -1) {
    const humanText = text.slice(0, bookingIdx).trim();
    const booking = parseBookingConfirmed(text.slice(bookingIdx));
    if (booking) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {humanText && (
            <span style={{ whiteSpace: "pre-wrap" }}>{humanText}</span>
          )}
          <PaymentCard data={booking} salonName={salonName} />
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

// ── Message bubbles ───────────────────────────────────────────────────────────

function MessageBubble({ message, onSend, salonName }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div
        className="animate-chat-fade-in"
        style={{ display: "flex", justifyContent: "flex-end" }}
      >
        <div
          style={{
            maxWidth: "78%",
            padding: "9px 14px",
            backgroundColor: PRIMARY,
            borderRadius: "12px 12px 2px 12px",
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 400,
            color: "#fff",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div
      className="animate-chat-fade-in"
      style={{ display: "flex", justifyContent: "flex-start" }}
    >
      <div
        style={{
          maxWidth: "88%",
          padding: "10px 14px",
          backgroundColor: "rgba(255,255,255,0.06)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: "12px 12px 12px 2px",
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 300,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.7,
        }}
      >
        {renderMessage(message.content, onSend, salonName)}
      </div>
    </div>
  );
}

// ── Input bar ─────────────────────────────────────────────────────────────────

function ChatInputBar({ onSend, loading }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        borderTop: "0.5px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a message…"
        disabled={loading}
        className="chat-dark-input"
        style={{
          flex: 1,
          backgroundColor: "rgba(255,255,255,0.06)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          padding: "9px 14px",
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 300,
          color: "#fff",
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={!value.trim() || loading}
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: PRIMARY,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          opacity: !value.trim() || loading ? 0.4 : 1,
        }}
      >
        {loading ? (
          <span
            style={{
              width: 14,
              height: 14,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
        ) : (
          <Send size={15} color="#fff" />
        )}
      </button>
    </form>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ChatWindow({
  customerPhone,
  onClose,
  salonName,
  initialMessage,
}) {
  const { messages, sendMessage, loading } = useAgentChat(
    customerPhone,
    salonName,
    initialMessage,
  );
  const bottomRef = useRef(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    playPopSound();
  }, []);

  useEffect(() => {
    const prev = prevCountRef.current;
    const curr = messages.length;
    if (curr > prev && messages[curr - 1]?.role === "assistant")
      playDingSound();
    prevCountRef.current = curr;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const initial = (salonName || "K")[0].toUpperCase();

  return (
    <div
      className="animate-chat-slide-up fixed bottom-4 z-50 flex flex-col overflow-hidden"
      style={{
        width: "min(380px, calc(100vw - 16px))",
        right: 8,
        maxHeight: 600,
        borderRadius: 20,
        backgroundColor: DARK,
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        border: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: PRIMARY,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: sans,
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            {initial}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: serif,
              fontSize: 18,
              fontWeight: 400,
              color: "#fff",
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: "-0.3px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {salonName || "Booking Assistant"}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 3,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#4ade80",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 300,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Online now
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.35)",
              cursor: "pointer",
              padding: 10,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            onSend={sendMessage}
            salonName={salonName}
          />
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: "12px 12px 12px 2px",
                padding: "10px 16px",
                display: "flex",
                gap: 5,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="animate-bounce"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.4)",
                    display: "inline-block",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
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
