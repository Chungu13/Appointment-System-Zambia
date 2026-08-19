import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { PageBanner, HeroExtras, SectionHeading, HoursCard, LocationCard, SalonFooter, ChatFab, CHROME_STYLE } from "./salon/SalonChrome";
import StorefrontServiceCard from "./salon/StorefrontServiceCard";
import { useSalonProfile } from "./salon/useSalonProfile";
import { useChatFab } from "./salon/useChatFab";
import { PRIMARY, BORDER, TYPE_LABELS, sans, imageForService, hasRealImage } from "./salon/theme";

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
          <StorefrontServiceCard key={svc.id} svc={svc} imageUrl={imageForService(svc, portfolioImages, businessType)} onBook={onBook} />
        ))}
      </div>
    </section>
  );
}

export default function SalonLanding() {
  const { profile, screen } = useSalonProfile();
  const chat = useChatFab();
  const { hash } = useLocation();

  // Detect return from the payment page and reopen the booking panel on its
  // confirmation. Payment redirects always land back on the tenant's home page.
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
    setTimeout(() => chat.showConfirmedBooking(booking), 400);
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
        <HeroExtras profile={profile} />
      </PageBanner>

      <ServicesSection
        services={profile.services.filter((s) => s.isActive && hasRealImage(s, profile.portfolioImages))}
        portfolioImages={profile.portfolioImages}
        businessType={profile.businessType}
        onBook={chat.openChat}
      />

      <div className="salon-home-grid salon-container salon-fab-clear">
        <HoursCard hours={profile.openingHours} />
        <LocationCard profile={profile} />
      </div>

      <SalonFooter profile={profile} />
      <ChatFab chat={chat} profile={profile} />
    </div>
  );
}
