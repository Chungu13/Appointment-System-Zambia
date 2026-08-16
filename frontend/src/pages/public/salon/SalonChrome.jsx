import { Link } from "react-router-dom";
import { MapPin, X, ArrowLeft, Clock, CalendarCheck } from "lucide-react";
import BookingWizard from "../../../components/booking/BookingWizard";
import { useSalonPaths } from "./useSalonPaths";
import {
  PRIMARY,
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

// ── Pill navigation — sits on the white info sheet directly above the business
// name, not over the photo. Each pill is a real route (Services/Gallery/
// Stylists/Policies each have their own page); Discover sits apart from the
// row since it leaves this business entirely. ────────────────────────────────
function pillStyle(solid) {
  const base = {
    fontFamily: sans,
    fontSize: 12,
    textDecoration: "none",
    padding: "8px 16px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
  // Styled for a light surface — these used to be white-on-photo, which would
  // be invisible now that the row lives on the white sheet.
  return solid
    ? { ...base, fontWeight: 600, color: "#fff", backgroundColor: PRIMARY, border: "none" }
    : { ...base, fontWeight: 500, color: DARK, backgroundColor: CREAM, border: `0.5px solid ${BORDER}` };
}

// Single horizontally-scrollable row: business name pill (solid, acts as
// Home), then each page pill, then Discover — all one line, no wrapping.
function SalonPillNav({ businessName }) {
  const paths = useSalonPaths();
  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN;
  const discoverUrl = appDomain ? `https://${appDomain}/discover` : "/discover";

  const links = [
    { label: "Stylists", to: paths.stylists },
    { label: "Policies", to: paths.policies },
    { label: "Gallery", to: paths.gallery },
  ];

  return (
    <div className="nav-pill-row" style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", marginBottom: 18 }}>
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
  const paths = useSalonPaths();

  return (
    <header style={{ backgroundColor: "#fff" }}>
      {/* Photo — shown clean now that all the text sits on the sheet below it. */}
      <div className={tall ? "salon-hero" : "salon-page-banner"} style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={bannerUrl}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Soft top scrim so the back button stays legible on pale photos. */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 96,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.28), transparent)",
            pointerEvents: "none",
          }}
        />
        {/* Home is one tap away from every sub-page; on Home itself there is
            nowhere to go back to, so it is omitted there. */}
        {!tall && (
          <Link
            to={paths.home}
            aria-label="Back to home"
            style={{
              position: "absolute", top: 18, left: 20, zIndex: 10,
              width: 38, height: 38, borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.92)",
              display: "flex", alignItems: "center", justifyContent: "center",
              textDecoration: "none", boxShadow: "0 1px 6px rgba(0,0,0,0.18)",
            }}
          >
            <ArrowLeft size={18} color={DARK} />
          </Link>
        )}
      </div>

      {/* Info sheet — lifted over the photo's bottom edge. */}
      <div
        style={{
          position: "relative", zIndex: 5, marginTop: -26,
          backgroundColor: "#fff", borderRadius: "22px 22px 0 0",
        }}
      >
        <div className="salon-container" style={{ paddingTop: 22, paddingBottom: tall ? 26 : 20 }}>
          <SalonPillNav businessName={profile.businessName} />

          <h1
            className={tall ? "salon-hero-name" : "salon-page-title"}
            style={{ fontFamily: serif, fontWeight: 700, letterSpacing: "-1px", color: DARK, margin: 0, lineHeight: 1.1 }}
          >
            {title}
          </h1>
          {eyebrow && (
            <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 400, color: "#7a6a5a", margin: "6px 0 0" }}>
              {eyebrow}
            </p>
          )}
          {subtitle && (
            <p
              className="salon-hero-subtitle"
              style={{ fontFamily: sans, fontSize: 14, fontWeight: 300, color: "#7a6a5a", margin: "8px 0 0", maxWidth: 520, lineHeight: 1.6 }}
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

// ── Home-only hero content (open status + location) ──────────────────────────
export function HeroExtras({ profile }) {
  const isOpen = checkOpenNow(profile.openingHours);
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayRow = profile.openingHours.find((h) => h.dayOfWeek === todayIdx);
  const location = [profile.area, profile.city].filter(Boolean).join(", ");

  // Closed today entirely vs. closed right now but opening later — different
  // messages, since "opens 09:00" is misleading on a day they never open.
  let status = null;
  if (todayRow?.isClosed) {
    status = { text: "Closed today", color: "#b45309" };
  } else if (todayRow) {
    status = isOpen
      ? { text: `Open now · closes ${formatTime(todayRow.closesAt)}`, color: "#15803d" }
      : { text: `Closed · opens ${formatTime(todayRow.opensAt)}`, color: "#b45309" };
  }

  return (
    <>
      {status && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12 }}>
          <Clock size={15} color={status.color} />
          <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: status.color }}>{status.text}</span>
        </div>
      )}

      {location && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 9, marginTop: 16,
            backgroundColor: CREAM, border: `0.5px solid ${BORDER}`,
            borderRadius: 12, padding: "13px 15px",
          }}
        >
          <MapPin size={16} color={DARK} style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, color: DARK }}>{location}</span>
        </div>
      )}
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
                {h.isClosed ? "Closed" : `${formatTime(h.opensAt)} to ${formatTime(h.closesAt)}`}
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

// ── Booking FAB + wizard panel ────────────────────────────────────────────────
// The panel runs the step-by-step wizard. No AI takes part in booking.
export function ChatFab({ chat, profile }) {
  return (
    <>
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 40 }}>
        <button
          onClick={() => (chat.bookingOpen ? chat.closeBooking() : chat.openChat(""))}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: chat.bookingOpen ? "11px 18px" : "11px 22px",
            backgroundColor: DARK, border: "0.5px solid rgba(255,255,255,0.14)",
            borderRadius: 14, color: "#fff", cursor: "pointer",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)", fontFamily: sans,
            fontSize: 13, fontWeight: 500, letterSpacing: "0.02em", transition: "padding 0.15s",
          }}
        >
          {chat.bookingOpen ? (
            <>
              <X size={15} style={{ opacity: 0.7 }} />
              <span>Close</span>
            </>
          ) : (
            <>
              <CalendarCheck size={15} style={{ color: "#B4895A" }} />
              <span>Book now</span>
            </>
          )}
        </button>
      </div>
      {chat.bookingOpen && (
        <BookingWizard
          key={chat.bookingKey}
          service={chat.bookingService}
          confirmedBooking={chat.confirmedBooking}
          profile={profile}
          onClose={chat.closeBooking}
        />
      )}
    </>
  );
}

// ── Shared page chrome CSS ────────────────────────────────────────────────────
export const CHROME_STYLE = `
  ${LAYOUT_CSS}
  html { scroll-behavior: smooth; }
  .salon-hero { height: 400px; }
  .salon-page-banner { height: 240px; }
  .salon-hero-name { font-size: 42px; }
  .salon-page-title { font-size: 30px; }
  .salon-hero-subtitle { font-size: 15px; }
  .salon-gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .salon-footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 32px; padding-top: 8px; }
  .visual-services-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .service-card-image { aspect-ratio: 4 / 3; }
  .visual-service-card img { transition: transform 0.25s ease; }
  .visual-service-card:hover img { transform: scale(1.05); }
  .nav-pill-row::-webkit-scrollbar, .pill-row::-webkit-scrollbar { display: none; }
  @media (max-width: 640px) {
    .salon-hero { height: 300px !important; }
    .salon-page-banner { height: 200px !important; }
    .salon-hero-name { font-size: 32px !important; }
    .salon-page-title { font-size: 24px !important; }
    .salon-hero-subtitle { font-size: 13px !important; }
    .salon-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
    .salon-footer-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
    .visual-services-grid { grid-template-columns: 1fr !important; }
  }
`;
