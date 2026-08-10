import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronDown } from "lucide-react";
import { PageBanner, HeroExtras, SectionHeading, HoursCard, LocationCard, SalonFooter, ChatFab, CHROME_STYLE } from "./salon/SalonChrome";
import { useSalonProfile } from "./salon/useSalonProfile";
import { useChatFab } from "./salon/useChatFab";
import { PRIMARY, DARK, BORDER, TYPE_LABELS, sans, imageForService } from "./salon/theme";
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
    <div className="visual-service-card" style={{ borderRadius: 16, backgroundColor: "#fff", padding: 12, display: "flex", flexDirection: "column" }}>
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

function ServicesSection({ services, portfolioImages, businessType, onBook }) {
  const [active, setActive] = useState("All");
  if (services.length === 0) return null;

  const categories = ["All", ...Array.from(new Set(services.map((s) => s.category || "Services")))];
  const filtered = active === "All" ? services : services.filter((s) => (s.category || "Services") === active);

  return (
    <section id="services" className="salon-container" style={{ paddingTop: 56, paddingBottom: 0 }}>
      <SectionHeading title="Our Services" subtitle="Browse our full menu and book directly online." />
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
          <ServiceCard key={svc.id} svc={svc} imageUrl={imageForService(svc, portfolioImages, businessType)} onBook={onBook} />
        ))}
      </div>
    </section>
  );
}

export default function SalonLanding() {
  const { profile, screen } = useSalonProfile();
  const chat = useChatFab();
  const { hash } = useLocation();

  // Detect return from payment page and auto-open chat with confirmation.
  // Payment redirects always land back on the tenant's home page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successRef = params.get("payment_success");
    if (!successRef) return;
    window.history.replaceState({}, "", window.location.pathname);
    const booking = {
      ref: successRef,
      service: params.get("service") ? decodeURIComponent(params.get("service")) : "",
      amount: params.get("amount") || "",
      date: params.get("appt_date") || "",
      time: params.get("appt_time") || "",
      staff: params.get("appt_staff") ? decodeURIComponent(params.get("appt_staff")) : "",
      customer: params.get("appt_customer") ? decodeURIComponent(params.get("appt_customer")) : "",
    };
    setTimeout(() => {
      chat.setChatConfirmedBooking(booking);
      chat.openChat("");
    }, 400);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // "Services" is a nav pill pointing at "/#services" rather than its own
  // route — scroll to it whenever that hash is the current location,
  // including clicking the pill again while already on this page.
  useEffect(() => {
    if (hash === "#services") {
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);

  if (screen) return screen;

  const canonicalSlug = window.location.hostname.split(".")[0];
  const locationStr = [profile.area, profile.city].filter(Boolean).join(", ");
  const typeLabel = TYPE_LABELS[profile.businessType] ?? "Beauty Salon";
  const metaTitle = `${profile.businessName} | ${typeLabel} in ${locationStr || "Zambia"} | Book Online`;
  const metaDesc = `Book appointments at ${profile.businessName}, a ${typeLabel.toLowerCase()} in ${locationStr || "Zambia"}. Online booking, instant confirmation.`;
  const salonUrl = `https://${canonicalSlug}.kimawa.pro`;

  const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: profile.businessName,
    url: salonUrl,
    telephone: profile.phone,
    priceRange: "ZMW",
    address: {
      "@type": "PostalAddress",
      streetAddress: profile.address || undefined,
      addressLocality: profile.area || profile.city,
      addressRegion: profile.city,
      addressCountry: "ZM",
    },
    ...(profile.coverImageUrl ? { image: profile.coverImageUrl } : {}),
    openingHoursSpecification: profile.openingHours
      ?.filter((h) => !h.isClosed && h.opensAt && h.closesAt)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${SCHEMA_DAYS[h.dayOfWeek]}`,
        opens: h.opensAt,
        closes: h.closesAt,
      })),
    makesOffer: profile.services
      ?.filter((s) => s.isActive)
      .map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name },
        priceCurrency: "ZMW",
        price: s.priceZmw,
      })),
  };

  return (
    <div style={{ backgroundColor: "#fff" }}>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="local.business" />
        <meta property="og:url" content={salonUrl} />
        {profile.coverImageUrl && <meta property="og:image" content={profile.coverImageUrl} />}
        <link rel="canonical" href={salonUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <style>{`
        ${CHROME_STYLE}
        .salon-home-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding-top: 56px; }
        @media (max-width: 640px) {
          .salon-home-grid { grid-template-columns: 1fr !important; gap: 16px !important; padding-top: 32px !important; }
        }
      `}</style>

      <PageBanner profile={profile} tall eyebrow={TYPE_LABELS[profile.businessType] ?? profile.businessType} title={profile.businessName} subtitle="Browse real results and book your next appointment in seconds.">
        <HeroExtras profile={profile} onChatOpen={chat.openChat} />
      </PageBanner>

      <ServicesSection
        services={profile.services.filter((s) => s.isActive)}
        portfolioImages={profile.portfolioImages}
        businessType={profile.businessType}
        onBook={chat.openChat}
      />

      <div className="salon-home-grid salon-container salon-fab-clear">
        <HoursCard hours={profile.openingHours} />
        <LocationCard profile={profile} />
      </div>

      <SalonFooter profile={profile} />
      <ChatFab chat={chat} salonName={profile.businessName} />
    </div>
  );
}
