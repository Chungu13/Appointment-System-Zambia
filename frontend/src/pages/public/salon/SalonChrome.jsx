import { Link } from "react-router-dom";
import { MapPin, X, Sparkles } from "lucide-react";
import ChatWindow from "../../../components/chat/ChatWindow";
import { useSalonPaths } from "./useSalonPaths";
import {
  PRIMARY,
  PRIMARY_RGB,
  DARK,
  BORDER,
  CREAM,
  serif,
  sans,
  bannerFor,
  formatTime,
  checkOpenNow,
  LAYOUT_CSS,
} from "./theme";

// ── Pill navigation — overlaid on the banner photo, no hamburger. Each pill
// is a real route (Services/Gallery/Stylists/Policies each have their own
// page); Discover sits apart from the row since it leaves this business
// entirely. ──────────────────────────────────────────────────────────────────
function pillStyle(solid) {
  if (solid) {
    return {
      fontFamily: sans,
      fontSize: 12,
      fontWeight: 600,
      color: DARK,
      textDecoration: "none",
      padding: "8px 16px",
      borderRadius: 10,
      whiteSpace: "nowrap",
      backgroundColor: "#F5EFE6",
      border: "none",
      flexShrink: 0,
    };
  }
  return {
    fontFamily: sans,
    fontSize: 12,
    fontWeight: 500,
    color: "#fff",
    textDecoration: "none",
    padding: "8px 16px",
    borderRadius: 10,
    whiteSpace: "nowrap",
    backgroundColor: "rgba(255,255,255,0.14)",
    backdropFilter: "blur(6px)",
    border: "0.5px solid rgba(255,255,255,0.22)",
    flexShrink: 0,
  };
}

// Single horizontally-scrollable row: business name pill (solid, acts as
// Home), then each page pill, then Discover — all one line, no wrapping.
function SalonPillNav({ businessName }) {
  const paths = useSalonPaths();
  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN;
  const discoverUrl = appDomain ? `https://${appDomain}/discover` : "/discover";

  const links = [
    { label: "Services", to: paths.services },
    { label: "Gallery", to: paths.gallery },
    { label: "Stylists", to: paths.stylists },
    { label: "Policies", to: paths.policies },
  ];

  return (
    <div className="nav-pill-row" style={{ position: "relative", zIndex: 20, paddingTop: 18, display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
      <Link to={paths.home} style={{ ...pillStyle(true), maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
        {businessName}
      </Link>
      {links.map((l) => (
        <Link key={l.to} to={l.to} style={pillStyle(false)}>
          {l.label}
        </Link>
      ))}
      <a href={discoverUrl} style={pillStyle(false)}>
        Discover
      </a>
    </div>
  );
}

// ── Banner — full hero on Home (business name + meta + Book Now), compact
// on every other page (page title only). Same photo + pill nav skeleton
// either way. ─────────────────────────────────────────────────────────────
export function PageBanner({ profile, tall, eyebrow, title, subtitle, children }) {
  const bannerUrl = bannerFor(profile);

  return (
    <header
      className={tall ? "salon-hero" : "salon-page-banner"}
      style={{ position: "relative", overflow: "hidden" }}
    >
      <img
        src={bannerUrl}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, backgroundColor: DARK, opacity: 0.62 }} />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: `linear-gradient(to top, rgba(${PRIMARY_RGB},0.95), transparent)`,
          pointerEvents: "none",
        }}
      />
      <div
        className="salon-container"
        style={{
          position: "relative",
          zIndex: 10,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SalonPillNav businessName={profile.businessName} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: tall ? 40 : 28 }}>
          {eyebrow && (
            <span
              style={{
                display: "inline-block",
                alignSelf: "flex-start",
                fontFamily: sans,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.12em",
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                padding: "5px 12px",
                borderRadius: 20,
                marginBottom: 12,
              }}
            >
              {eyebrow}
            </span>
          )}
          <h1
            className={tall ? "salon-hero-name" : "salon-page-title"}
            style={{ fontFamily: serif, fontWeight: 300, letterSpacing: "-1px", color: "#fff", margin: "0 0 10px", lineHeight: 1.05 }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="salon-hero-subtitle"
              style={{ fontFamily: sans, fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.8)", margin: "0 0 22px", maxWidth: 480, lineHeight: 1.6 }}
            >
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </header>
  );
}

// ── Home-only hero content (Book Now CTA + location/phone/open meta row) ────
export function HeroExtras({ profile, onChatOpen }) {
  const isOpen = checkOpenNow(profile.openingHours);
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayRow = profile.openingHours.find((h) => h.dayOfWeek === todayIdx);

  return (
    <>
      <button
        onClick={() => onChatOpen("")}
        style={{
          alignSelf: "flex-start",
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 600,
          color: DARK,
          backgroundColor: "#F5EFE6",
          border: "none",
          padding: "13px 28px",
          borderRadius: 10,
          cursor: "pointer",
          letterSpacing: "0.02em",
          marginBottom: 22,
        }}
      >
        Book Now
      </button>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
        {profile.city && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.75)" }}>
            <MapPin size={13} />
            {[profile.city, profile.area, profile.address].filter(Boolean).join(", ")}
          </span>
        )}
        {todayRow && !todayRow.isClosed && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.75)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: isOpen ? "#4ade80" : "#f87171", display: "inline-block" }} />
            {isOpen ? `Open now · closes ${formatTime(todayRow.closesAt)}` : `Closed · opens ${formatTime(todayRow.opensAt)}`}
          </span>
        )}
      </div>
    </>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────
export function SectionHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 400, color: DARK, margin: "0 0 6px", letterSpacing: "-0.5px" }}>{title}</h2>
      {subtitle && <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "#7a6a5a", margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

// ── Hours ─────────────────────────────────────────────────────────────────────
export function HoursCard({ hours }) {
  const todayIdx = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();
  const isOpenNow = checkOpenNow(hours);

  return (
    <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: DARK, margin: 0 }}>Opening hours</p>
        {isOpenNow && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: sans, fontSize: 11, fontWeight: 500, color: "#16a34a" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80", display: "inline-block" }} />
            Open now
          </span>
        )}
      </div>
      <div>
        {hours.map((h) => {
          const isToday = h.dayOfWeek === todayIdx;
          return (
            <div
              key={h.dayOfWeek}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px", backgroundColor: isToday ? CREAM : "transparent", borderBottom: `0.5px solid ${BORDER}` }}
            >
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: isToday ? 500 : 400, color: isToday ? DARK : "#555" }}>{h.dayName}</span>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: h.isClosed ? "#999" : DARK }}>
                {h.isClosed ? "Closed" : `${formatTime(h.opensAt)} – ${formatTime(h.closesAt)}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Location ──────────────────────────────────────────────────────────────────
export function LocationCard({ profile }) {
  const parts = [profile.address, profile.area, profile.city].filter(Boolean);
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent([profile.businessName, ...parts].join(", "))}`;

  return (
    <div style={{ borderRadius: 10, overflow: "hidden", backgroundColor: DARK }}>
      <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          <MapPin size={16} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 5px" }}>
            Where to find us
          </p>
          <p style={{ fontFamily: serif, fontSize: 19, fontWeight: 400, color: "#fff", margin: 0, lineHeight: 1.15, letterSpacing: "-0.2px" }}>
            {profile.businessName}
          </p>
        </div>
      </div>
      <div style={{ height: "0.5px", backgroundColor: "rgba(255,255,255,0.08)", margin: "0 20px" }} />
      <div style={{ padding: "14px 20px 18px" }}>
        {parts.map((part, i) => (
          <p key={i} style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.6)", margin: "0 0 3px", lineHeight: 1.6 }}>
            {part}
          </p>
        ))}
      </div>
      <div style={{ padding: "0 20px 20px" }}>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: "0.05em", color: "#fff", backgroundColor: PRIMARY, padding: "9px 18px", borderRadius: 10, textDecoration: "none" }}
        >
          <MapPin size={12} /> Get directions
        </a>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
export function SalonFooter({ profile }) {
  const paths = useSalonPaths();
  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN;
  const homeUrl = appDomain ? `https://${appDomain}` : "/";
  const privacyUrl = appDomain ? `https://${appDomain}/privacy` : "/privacy";
  const termsUrl = appDomain ? `https://${appDomain}/business-terms` : "/business-terms";

  const explore = [
    { label: "Home", to: paths.home },
    { label: "Services", to: paths.services },
    { label: "Gallery", to: paths.gallery },
    { label: "Stylists", to: paths.stylists },
  ];
  const policies = [
    { label: "Cancellations & Deposits", to: paths.policies },
    { label: "Privacy Policy", href: privacyUrl },
    { label: "Terms of Service", href: termsUrl },
  ];

  return (
    <footer style={{ backgroundColor: DARK, paddingTop: 48, paddingBottom: 24 }}>
      <div className="salon-footer-grid salon-container" style={{ paddingBottom: 32 }}>
        <div>
          <p style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", margin: 0 }}>
            {profile.businessName}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B4895A", margin: "0 0 12px" }}>Explore</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {explore.map((l) => (
              <Link key={l.label} to={l.to} style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B4895A", margin: "0 0 12px" }}>Policies</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {policies.map((l) =>
              l.to ? (
                <Link key={l.label} to={l.to} style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
                  {l.label}
                </Link>
              ) : (
                <a key={l.label} href={l.href} style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
                  {l.label}
                </a>
              ),
            )}
          </div>
        </div>
      </div>
      <div style={{ height: "0.5px", backgroundColor: "rgba(255,255,255,0.08)" }} />
      <p
        className="salon-container"
        style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,0.45)", margin: 0, paddingTop: 20, textAlign: "center" }}
      >
        &copy; {new Date().getFullYear()} {profile.businessName} &middot; Powered by{" "}
        <a href={homeUrl} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
          Kimawa
        </a>
      </p>
    </footer>
  );
}

// ── Chat FAB + window ─────────────────────────────────────────────────────────
export function ChatFab({ chat, salonName }) {
  return (
    <>
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 40 }}>
        <button
          onClick={() => (chat.chatOpen ? chat.setChatOpen(false) : chat.openChat(""))}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: chat.chatOpen ? "11px 18px" : "11px 22px",
            backgroundColor: DARK, border: "0.5px solid rgba(255,255,255,0.14)",
            borderRadius: 14, color: "#fff", cursor: "pointer",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)", fontFamily: sans,
            fontSize: 13, fontWeight: 500, letterSpacing: "0.02em", transition: "padding 0.15s",
          }}
        >
          {chat.chatOpen ? (
            <>
              <X size={15} style={{ opacity: 0.7 }} />
              <span>Close</span>
            </>
          ) : (
            <>
              <Sparkles size={14} style={{ color: "#B4895A" }} />
              <span>Ask or Book</span>
            </>
          )}
        </button>
      </div>
      {chat.chatOpen && (
        <ChatWindow
          key={chat.chatKey}
          salonName={salonName}
          initialMessage={chat.chatInitMsg}
          confirmedBooking={chat.chatConfirmedBooking}
          skipIntake={chat.chatSkipIntake}
          referenceService={chat.chatReferenceService}
          onClose={() => chat.setChatOpen(false)}
        />
      )}
    </>
  );
}

// ── Shared page chrome CSS ────────────────────────────────────────────────────
export const CHROME_STYLE = `
  ${LAYOUT_CSS}
  html { scroll-behavior: smooth; }
  .salon-hero { height: 460px; }
  .salon-page-banner { height: 260px; }
  .salon-hero-name { font-size: 52px; }
  .salon-page-title { font-size: 34px; }
  .salon-hero-subtitle { font-size: 15px; }
  .salon-gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .salon-footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 32px; padding-top: 8px; }
  .visual-services-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .service-card-image { aspect-ratio: 4 / 5; }
  .visual-service-card img { transition: transform 0.25s ease; }
  .visual-service-card:hover img { transform: scale(1.05); }
  .nav-pill-row::-webkit-scrollbar, .pill-row::-webkit-scrollbar { display: none; }
  @media (max-width: 640px) {
    .salon-hero { height: 340px !important; }
    .salon-page-banner { height: 220px !important; }
    .salon-hero-name { font-size: 30px !important; }
    .salon-page-title { font-size: 24px !important; }
    .salon-hero-subtitle { font-size: 13px !important; }
    .salon-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
    .salon-footer-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
    .visual-services-grid { grid-template-columns: 1fr !important; }
  }
`;
