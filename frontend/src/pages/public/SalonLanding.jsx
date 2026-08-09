import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { PageBanner, HeroExtras, HoursCard, LocationCard, SalonFooter, ChatFab, CHROME_STYLE } from "./salon/SalonChrome";
import { useSalonProfile } from "./salon/useSalonProfile";
import { useChatFab } from "./salon/useChatFab";
import { TYPE_LABELS } from "./salon/theme";

export default function SalonLanding() {
  const { profile, screen } = useSalonProfile();
  const chat = useChatFab();

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
        .salon-home-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 1200px; margin: 0 auto; padding: 56px 64px; }
        @media (max-width: 640px) {
          .salon-home-grid { grid-template-columns: 1fr !important; gap: 16px !important; padding: 32px 16px !important; }
        }
      `}</style>

      <PageBanner profile={profile} tall eyebrow={TYPE_LABELS[profile.businessType] ?? profile.businessType} title={profile.businessName} subtitle="Browse real results and book your next appointment in seconds.">
        <HeroExtras profile={profile} onChatOpen={chat.openChat} />
      </PageBanner>

      <div className="salon-home-grid">
        <HoursCard hours={profile.openingHours} />
        <LocationCard profile={profile} />
      </div>

      <SalonFooter profile={profile} />
      <ChatFab chat={chat} salonName={profile.businessName} />
    </div>
  );
}
