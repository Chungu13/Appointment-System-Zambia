import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { PageBanner, SalonFooter, ChatFab, CHROME_STYLE } from "./salon/SalonChrome";
import StorefrontServiceCard from "./salon/StorefrontServiceCard";
import { useSalonProfile } from "./salon/useSalonProfile";
import { useChatFab } from "./salon/useChatFab";
import { PRIMARY, BORDER, sans, imageForService, hasRealImage } from "./salon/theme";

export default function SalonServices() {
  const { profile, screen } = useSalonProfile();
  const chat = useChatFab();
  const [active, setActive] = useState("All");

  if (screen) return screen;

  const services = profile.services.filter(
    (s) => s.isActive && hasRealImage(s, profile.portfolioImages),
  );
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
                      padding: "11px 22px", borderRadius: 999, cursor: "pointer",
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
                <StorefrontServiceCard key={svc.id} svc={svc} imageUrl={imageForService(svc, profile.portfolioImages, profile.businessType)} onBook={chat.openChat} />
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
