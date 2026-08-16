import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PRIMARY, DARK, sans } from "./theme";
import { formatZMW } from "../../../lib/utils";

// Shared by the storefront home page and the Services page, which each used to
// carry their own near-identical copy.

function ServicePrice({ min, max }) {
  const [expanded, setExpanded] = useState(false);

  if (max == null) {
    return (
      <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: DARK, margin: 0 }}>
        {formatZMW(min)}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: sans }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: DARK, whiteSpace: "nowrap" }}>
        {expanded ? `${formatZMW(min)} to ${formatZMW(max)}` : `From ${formatZMW(min)}`}
      </span>
      <ChevronDown
        size={13}
        style={{ color: "#999", transition: "transform 0.18s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
      />
    </button>
  );
}

export default function StorefrontServiceCard({ svc, imageUrl, onBook }) {
  return (
    <div className="visual-service-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="service-card-image" style={{ overflow: "hidden", borderRadius: 18, marginBottom: 14 }}>
        <img
          src={imageUrl}
          alt={svc.name}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      <p style={{ fontFamily: sans, fontSize: 18, fontWeight: 600, color: DARK, margin: "0 0 8px", lineHeight: 1.2 }}>
        {svc.name}
      </p>

      {svc.description && (
        <p
          style={{
            fontFamily: sans, fontSize: 13, fontWeight: 300, color: "#888", margin: "0 0 10px", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}
        >
          {svc.description}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: "auto" }}>
        <div style={{ minWidth: 0 }}>
          <ServicePrice min={svc.priceZmw} max={svc.priceMaxZmw} />
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "#999", margin: "4px 0 0" }}>
            {svc.durationMinutes} min
          </p>
        </div>
        <button
          onClick={() => {
            const label = svc.category ? `${svc.category}, ${svc.name}` : svc.name;
            onBook(`I want to book ${label} [service_id:${svc.id}]`, false, svc);
          }}
          style={{
            flexShrink: 0, fontFamily: sans, fontSize: 13, fontWeight: 600, color: "#fff",
            background: PRIMARY, border: "none", cursor: "pointer",
            padding: "10px 22px", borderRadius: 10, letterSpacing: "0.01em",
          }}
        >
          Book
        </button>
      </div>
    </div>
  );
}
