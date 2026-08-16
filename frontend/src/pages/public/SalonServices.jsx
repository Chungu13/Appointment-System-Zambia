import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronDown } from "lucide-react";
import { PageBanner, SalonFooter, ChatFab, CHROME_STYLE } from "./salon/SalonChrome";
import { useSalonProfile } from "./salon/useSalonProfile";
import { useChatFab } from "./salon/useChatFab";
import { PRIMARY, DARK, BORDER, sans, imageForService } from "./salon/theme";
import { formatZMW } from "../../lib/utils";

function ServicePrice({ min, max }) {
  const [expanded, setExpanded] = useState(false);

  if (max == null) {
    return <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: DARK, margin: 0 }}>{formatZMW(min)}</p>;
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: sans }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: DARK, whiteSpace: "nowrap" }}>
        {expanded ? `${formatZMW(min)} – ${formatZMW(max)}` : `From ${formatZMW(min)}`}
      </span>
      <ChevronDown size={12} style={{ color: "#999", transition: "transform 0.18s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }} />
    </button>
  );
}

function ServiceCard({ svc, imageUrl, onBook }) {
  return (
    <div className="visual-service-card" style={{ border: `0.5px solid ${BORDER}`, borderRadius: 16, backgroundColor: "#fff", padding: 12, display: "flex", flexDirection: "column" }}>
      <div className="service-card-image" style={{ overflow: "hidden", borderRadius: 12, marginBottom: 14 }}>
        <img src={imageUrl} alt={svc.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <p style={{ fontFamily: sans, fontSize: 16, fontWeight: 600, color: DARK, margin: "0 0 6px" }}>{svc.name}</p>
      {svc.description && (
        <p
          style={{
            fontFamily: sans, fontSize: 13, fontWeight: 300, color: "#888", margin: "0 0 14px", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}
        >
          {svc.description}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", marginBottom: 12 }}>
        <ServicePrice min={svc.priceZmw} max={svc.priceMaxZmw} />
        <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: "#999" }}>{svc.durationMinutes} min</span>
      </div>
      <button
        onClick={() => {
          const label = svc.category ? `${svc.category}, ${svc.name}` : svc.name;
          onBook(`I want to book ${label} [service_id:${svc.id}]`, false, svc);
        }}
        style={{ width: "100%", fontFamily: sans, fontSize: 13, fontWeight: 600, color: "#fff", background: PRIMARY, border: "none", cursor: "pointer", padding: "14px 0", borderRadius: 10, letterSpacing: "0.02em" }}
      >
        Book Now
      </button>
    </div>
  );
}

export default function SalonServices() {
  const { profile, screen } = useSalonProfile();
  const chat = useChatFab();
  const [active, setActive] = useState("All");

  if (screen) return screen;

  const services = profile.services.filter((s) => s.isActive);
  const categories = ["All", ...Array.from(new Set(services.map((s) => s.category || "Services")))];
  const filtered = active === "All" ? services : services.filter((s) => (s.category || "Services") === active);

  return (
    <div style={{ backgroundColor: "#fff" }}>
      <Helmet>
        <title>{`Services | ${profile.businessName}`}</title>
      </Helmet>
      <style>{CHROME_STYLE}</style>

      <PageBanner profile={profile} title="Our Services" subtitle="Browse our full menu and book directly online." />

      <div className="px-16 max-sm:px-5" style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 64px" }}>
        {services.length === 0 ? (
          <p style={{ fontFamily: sans, fontSize: 13, color: "#7a6a5a" }}>No services listed yet.</p>
        ) : (
          <>
            <div className="pill-row" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 24, paddingBottom: 4 }}>
              {categories.map((cat) => {
                const isActive = active === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActive(cat)}
                    style={{
                      fontFamily: sans, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
                      padding: "9px 18px", borderRadius: 10, cursor: "pointer",
                      border: isActive ? "none" : `0.5px solid ${BORDER}`,
                      backgroundColor: isActive ? PRIMARY : "#fff",
                      color: isActive ? "#fff" : "#555",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <div className="visual-services-grid">
              {filtered.map((svc) => (
                <ServiceCard key={svc.id} svc={svc} imageUrl={imageForService(svc, profile.portfolioImages, profile.businessType)} onBook={chat.openChat} />
              ))}
            </div>
          </>
        )}
      </div>

      <SalonFooter profile={profile} />
      <ChatFab chat={chat} profile={profile} />
    </div>
  );
}
