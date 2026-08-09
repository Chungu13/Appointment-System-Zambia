import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@apollo/client/react";
import {
  MapPin,
  Phone,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { SALON_PROFILE } from "../../graphql/queries/salons";
import ChatWindow from "../../components/chat/ChatWindow";
import { PageSpinner, ErrorMessage } from "../../components/ui/Spinner";
import { formatZMW } from "../../lib/utils";
import { playPopSound } from "../../lib/sounds";

// ── Palette ───────────────────────────────────────────────────────────────────
// Warm espresso/cream theme — replaces the old maroon palette everywhere,
// since every usage below reads from these tokens instead of hardcoded hex.
const PRIMARY = "#3B2A1E"; // deep coffee — buttons, pills, accents
const PRIMARY_RGB = "59,42,30";
const DARK = "#241812"; // near-black espresso — hero overlay, footer, dark cards
const BORDER = "#EDE3D6"; // warm sand border
const CREAM = "#FBF7F1"; // warm off-white section background
const GOLD = "#B4895A"; // warm accent for tags / small caps
const serif = "'Cormorant Garamond', Georgia, serif";
const sans = "Inter, sans-serif";

const TYPE_LABELS = {
  salon: "Salon",
  barbershop: "Barbershop",
  nail_tech: "Nail Tech",
  spa: "Spa",
  lash_studio: "Lash Studio",
  makeup_artist: "Makeup Artist",
};

const DEFAULT_BANNERS = {
  salon:
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=80",
  nail_tech:
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1400&q=80",
  barbershop:
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1400&q=80",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1400&q=80",
  lash_studio:
    "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=1400&q=80",
  _fallback:
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1400&q=80",
};

function bannerFor(profile) {
  if (profile.coverImageUrl) return profile.coverImageUrl;
  if (profile.portfolioPreviewUrl) return profile.portfolioPreviewUrl;
  return DEFAULT_BANNERS[profile.businessType] ?? DEFAULT_BANNERS._fallback;
}

// A service's own uploaded photo wins; otherwise fall back to the same
// business-type stock photo already used for the hero banner.
function imageForService(svc, portfolioImages, businessType) {
  const match = portfolioImages.find(
    (img) => img.serviceName && img.serviceName.toLowerCase() === svc.name.toLowerCase(),
  );
  if (match) return match.imageUrl;
  return DEFAULT_BANNERS[businessType] ?? DEFAULT_BANNERS._fallback;
}

function formatTime(timeStr) {
  if (!timeStr) return "-";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function checkOpenNow(hours) {
  const now = new Date();
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const row = hours?.find((h) => h.dayOfWeek === todayIdx);
  if (!row || row.isClosed || !row.opensAt || !row.closesAt) return false;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = row.opensAt.split(":").map(Number);
  const [ch, cm] = row.closesAt.split(":").map(Number);
  return nowMins >= oh * 60 + om && nowMins < ch * 60 + cm;
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontFamily: serif,
          fontSize: 30,
          fontWeight: 400,
          color: DARK,
          margin: "0 0 6px",
          letterSpacing: "-0.5px",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "#7a6a5a", margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function SalonNav({ onBook }) {
  const [open, setOpen] = useState(false);
  const homeUrl = import.meta.env.VITE_TENANT_APP_DOMAIN
    ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}`
    : "/";
  const discoverUrl = import.meta.env.VITE_TENANT_APP_DOMAIN
    ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}/discover`
    : "/discover";

  const sectionLinks = [
    { label: "Services", href: "#services" },
    { label: "Gallery", href: "#gallery" },
    { label: "Stylists", href: "#stylists" },
    { label: "Policies", href: "#policies" },
  ];

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: CREAM,
        borderBottom: `0.5px solid ${BORDER}`,
      }}
    >
      {/* Desktop bar */}
      <div
        className="hidden sm:flex"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 64px",
          height: 64,
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <a
          href={homeUrl}
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: 42 }} />
          <span
            style={{
              fontFamily: serif,
              fontSize: 17,
              fontWeight: 400,
              color: DARK,
              letterSpacing: "-0.3px",
            }}
          >
            Kimawa
          </span>
        </a>
        <div className="nav-pill-row" style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
          {sectionLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 500,
                color: "#5c4c3d",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 20,
                border: `0.5px solid ${BORDER}`,
                whiteSpace: "nowrap",
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href={discoverUrl}
            style={{
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 400,
              color: "#8a7a6a",
              textDecoration: "none",
              padding: "8px 14px",
              whiteSpace: "nowrap",
            }}
          >
            Discover
          </a>
        </div>
        <button
          onClick={onBook}
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: PRIMARY,
            border: "none",
            padding: "10px 20px",
            borderRadius: 22,
            cursor: "pointer",
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Book Now
        </button>
      </div>

      {/* Mobile bar */}
      <div
        className="flex sm:hidden"
        style={{
          padding: "0 20px",
          height: 56,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a
          href={homeUrl}
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: 22 }} />
          <span
            style={{
              fontFamily: serif,
              fontSize: 16,
              fontWeight: 400,
              color: DARK,
            }}
          >
            Kimawa
          </span>
        </a>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 12,
            color: DARK,
          }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          style={{
            borderTop: `0.5px solid ${BORDER}`,
            backgroundColor: CREAM,
            padding: "8px 4px",
          }}
        >
          {sectionLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                fontSize: 14,
                color: "#3a2f26",
                textDecoration: "none",
                padding: "12px 16px",
                display: "block",
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href={discoverUrl}
            onClick={() => setOpen(false)}
            style={{
              fontSize: 14,
              color: "#8a7a6a",
              textDecoration: "none",
              padding: "12px 16px",
              display: "block",
            }}
          >
            Discover other salons
          </a>
          <div style={{ padding: "6px 16px 12px" }}>
            <button
              onClick={() => {
                setOpen(false);
                onBook();
              }}
              style={{
                width: "100%",
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                backgroundColor: PRIMARY,
                border: "none",
                padding: "12px 0",
                borderRadius: 22,
                cursor: "pointer",
              }}
            >
              Book Now
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ profile, onChatOpen }) {
  const bannerUrl = bannerFor(profile);
  const isOpen = checkOpenNow(profile.openingHours);
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayRow = profile.openingHours.find((h) => h.dayOfWeek === todayIdx);
  const typeLabel = TYPE_LABELS[profile.businessType] ?? profile.businessType;

  return (
    <header
      id="home"
      className="salon-hero"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Background — image at full opacity, dark overlay on top */}
      <img
        src={bannerUrl}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: DARK,
          opacity: 0.6,
        }}
      />
      {/* Bottom gradient */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 160,
          background: `linear-gradient(to top, rgba(${PRIMARY_RGB},0.95), transparent)`,
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          paddingBottom: 40,
          maxWidth: 1200,
          margin: "0 auto",
        }}
        className="px-16 max-sm:px-5 max-sm:pb-8"
      >
        {/* Business type badge */}
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
          {typeLabel}
        </span>

        <h1
          className="salon-hero-name"
          style={{
            fontFamily: serif,
            fontWeight: 300,
            letterSpacing: "-1px",
            color: "#fff",
            margin: "0 0 10px",
            lineHeight: 1.05,
          }}
        >
          {profile.businessName}
        </h1>

        <p
          className="salon-hero-subtitle"
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 300,
            color: "rgba(255,255,255,0.8)",
            margin: "0 0 22px",
            maxWidth: 480,
            lineHeight: 1.6,
          }}
        >
          Browse real results and book your next appointment in seconds.
        </p>

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
            borderRadius: 26,
            cursor: "pointer",
            letterSpacing: "0.02em",
            marginBottom: 22,
          }}
        >
          Book Now
        </button>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            alignItems: "center",
          }}
        >
          {profile.city && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 300,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              <MapPin size={13} />
              {[profile.city, profile.area, profile.address]
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 300,
                color: "rgba(255,255,255,0.75)",
                textDecoration: "none",
              }}
            >
              <Phone size={13} />
              {profile.phone}
            </a>
          )}
          {todayRow && !todayRow.isClosed && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 300,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: isOpen ? "#4ade80" : "#f87171",
                  display: "inline-block",
                }}
              />
              {isOpen
                ? `Open now · closes ${formatTime(todayRow.closesAt)}`
                : `Closed · opens ${formatTime(todayRow.opensAt)}`}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ profile, onOpenChat }) {
  const minPrice = profile.services.length
    ? Math.min(
        ...profile.services
          .filter((s) => s.priceZmw > 0)
          .map((s) => s.priceZmw),
      )
    : null;

  const stats = [
    { label: "Services", value: profile.services.length },
    { label: "Team members", value: profile.staffCount },
    ...(minPrice
      ? [{ label: "Starting from", value: formatZMW(minPrice) }]
      : []),
  ];

  return (
    <section
      style={{
        backgroundColor: CREAM,
        borderBottom: `0.5px solid ${BORDER}`,
      }}
    >
      <div
        className="salon-stats-bar"
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <div style={{ display: "flex", gap: 0 }}>
          {stats.map(({ label, value }, i) => (
            <div
              key={label}
              style={{
                paddingRight: 28,
                paddingLeft: i > 0 ? 28 : 0,
                borderLeft: i > 0 ? `0.5px solid ${BORDER}` : "none",
              }}
            >
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 20,
                  fontWeight: 500,
                  color: DARK,
                  margin: "0 0 2px",
                }}
              >
                {value}
              </p>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#7a6a5a",
                  margin: 0,
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a
            href="#policies"
            style={{
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 500,
              color: PRIMARY,
              border: `1.5px solid ${PRIMARY}`,
              padding: "9px 18px",
              borderRadius: 22,
              background: "transparent",
              cursor: "pointer",
              letterSpacing: "0.04em",
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            Policies
          </a>
          <button
            onClick={() => onOpenChat("")}
            style={{
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 500,
              color: "#fff",
              border: "none",
              padding: "9px 20px",
              borderRadius: 22,
              background: PRIMARY,
              cursor: "pointer",
              letterSpacing: "0.04em",
              minHeight: 44,
              display: "flex",
              alignItems: "center",
            }}
          >
            Ask or Book
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Service price — "From ZMW X", expands to show the range when a design-
// dependent ceiling (priceMaxZmw) is set. ──────────────────────────────────────
function ServicePrice({ min, max }) {
  const [expanded, setExpanded] = useState(false);

  if (max == null) {
    return (
      <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: DARK, margin: 0 }}>
        {formatZMW(min)}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        fontFamily: sans,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: DARK, whiteSpace: "nowrap" }}>
        {expanded ? `${formatZMW(min)} – ${formatZMW(max)}` : `From ${formatZMW(min)}`}
      </span>
      <ChevronDown
        size={12}
        style={{
          color: "#999",
          transition: "transform 0.18s",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          flexShrink: 0,
        }}
      />
    </button>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────
function ServiceCard({ svc, imageUrl, onBook }) {
  return (
    <div
      className="visual-service-card"
      style={{
        border: `0.5px solid ${BORDER}`,
        borderRadius: 10,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
      }}
    >
      <div style={{ aspectRatio: "4 / 3", overflow: "hidden" }}>
        <img
          src={imageUrl}
          alt={svc.name}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: DARK, margin: 0 }}>
          {svc.name}
        </p>
        {svc.description && (
          <p
            style={{
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 300,
              color: "#888",
              margin: 0,
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            {svc.description}
          </p>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: 8,
          }}
        >
          <div>
            <ServicePrice min={svc.priceZmw} max={svc.priceMaxZmw} />
            <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: "#999", margin: "2px 0 0" }}>
              {svc.durationMinutes} min
            </p>
          </div>
          <button
            onClick={() => {
              const label = svc.category ? `${svc.category}, ${svc.name}` : svc.name;
              onBook(`I want to book ${label} [service_id:${svc.id}]`, false, svc);
            }}
            style={{
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
              background: PRIMARY,
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: 20,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}

function ServicesSection({ services, portfolioImages, businessType, onBook }) {
  const categories = ["All", ...Array.from(new Set(services.map((s) => s.category || "Services")))];
  const [active, setActive] = useState("All");

  if (services.length === 0) return null;

  const filtered = active === "All" ? services : services.filter((s) => (s.category || "Services") === active);

  return (
    <section id="services">
      <SectionHeading title="Our Services" subtitle="Browse our full menu and book directly online." />
      <div className="pill-row" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 24, paddingBottom: 4 }}>
        {categories.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: "nowrap",
                padding: "9px 18px",
                borderRadius: 24,
                cursor: "pointer",
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
          <ServiceCard
            key={svc.id}
            svc={svc}
            imageUrl={imageForService(svc, portfolioImages, businessType)}
            onBook={onBook}
          />
        ))}
      </div>
    </section>
  );
}

// ── Portfolio / Gallery ───────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const img = images[idx];

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setIdx((i) => Math.min(images.length - 1, i + 1));
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(0,0,0,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.1)",
          border: "none",
          color: "#fff",
          borderRadius: "50%",
          width: 40,
          height: 40,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={20} />
      </button>
      {idx > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i - 1);
          }}
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "#fff",
            borderRadius: "50%",
            width: 44,
            height: 44,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {idx < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i + 1);
          }}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "#fff",
            borderRadius: "50%",
            width: 44,
            height: 44,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight size={22} />
        </button>
      )}
      <div
        style={{ maxWidth: 800, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={img.imageUrl}
          alt={img.caption || ""}
          loading="lazy"
          style={{
            width: "100%",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: 8,
          }}
        />
        {img.serviceName && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: sans,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#fff",
                backgroundColor: `rgba(${PRIMARY_RGB},0.85)`,
                padding: "3px 10px",
                borderRadius: 3,
              }}
            >
              {img.serviceName}
            </span>
          </div>
        )}
        {img.caption && (
          <p
            style={{
              color: "#fff",
              textAlign: "center",
              fontFamily: sans,
              fontSize: 13,
              marginTop: 8,
            }}
          >
            {img.caption}
          </p>
        )}
      </div>
    </div>
  );
}

function PortfolioSection({ images }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [showAll, setShowAll] = useState(false);

  if (!images || images.length === 0) {
    return (
      <section id="gallery">
        <SectionHeading title="Gallery" subtitle="A look at our recent work." />
        <div
          style={{
            border: `0.5px solid ${BORDER}`,
            borderRadius: 8,
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "#666", margin: 0 }}>
            No portfolio photos yet.
          </p>
        </div>
      </section>
    );
  }

  const PREVIEW_COUNT = 5;
  const visible = showAll ? images : images.slice(0, PREVIEW_COUNT);
  const hasMore = !showAll && images.length > PREVIEW_COUNT;

  return (
    <section id="gallery">
      <SectionHeading title="Gallery" subtitle="A look at our recent work." />
      {/* 2-col on mobile, 3-col on desktop; first image spans 2 rows on desktop only */}
      <div className="salon-portfolio-grid">
        {visible.map((img, i) => (
          <div
            key={img.id}
            onClick={() => setLightboxIdx(i)}
            className={
              i === 0 ? "h-40 sm:h-[288px] sm:row-span-2" : "h-36 sm:h-[140px]"
            }
            style={{ borderRadius: 6, overflow: "hidden", cursor: "pointer", position: "relative" }}
          >
            <img
              src={img.imageUrl}
              alt={img.caption || "Portfolio"}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            />
            {(img.caption || img.serviceName) && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: "16px 8px 6px",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
                  pointerEvents: "none",
                }}
              >
                {img.serviceName && (
                  <span
                    style={{
                      display: "inline-block",
                      fontFamily: sans,
                      fontSize: 9,
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "#fff",
                      backgroundColor: `rgba(${PRIMARY_RGB},0.85)`,
                      padding: "2px 6px",
                      borderRadius: 3,
                      marginBottom: 3,
                    }}
                  >
                    {img.serviceName}
                  </span>
                )}
                {img.caption && (
                  <p
                    style={{
                      fontFamily: sans,
                      fontSize: 11,
                      fontWeight: 400,
                      color: "#fff",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {img.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            display: "block", margin: "14px auto 0",
            background: "none", border: `0.5px solid ${BORDER}`,
            padding: "10px 24px", cursor: "pointer",
            fontFamily: sans, fontSize: 12, fontWeight: 300, color: PRIMARY,
            letterSpacing: "0.06em", borderRadius: 20,
          }}
        >
          See all photos ({images.length})
        </button>
      )}

      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </section>
  );
}

// ── Stylists ──────────────────────────────────────────────────────────────────
function StylistCard({ member, onBook }) {
  const [expanded, setExpanded] = useState(false);
  const hasBio = !!member.bio?.trim();
  const tags = (member.serviceNames || []).slice(0, 4);

  return (
    <div
      style={{
        border: `0.5px solid ${BORDER}`,
        borderRadius: 12,
        padding: 20,
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        flexWrap: "wrap",
        backgroundColor: "#fff",
      }}
    >
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.fullName}
          loading="lazy"
          width={72}
          height={72}
          style={{
            width: 72,
            height: 72,
            borderRadius: 12,
            objectFit: "cover",
            flexShrink: 0,
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 12,
            backgroundColor: CREAM,
            border: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: sans,
              fontSize: 22,
              fontWeight: 500,
              color: PRIMARY,
              lineHeight: 1,
            }}
          >
            {initials(member.fullName)}
          </span>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 180 }}>
        <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: DARK, margin: "0 0 6px" }}>
          {member.fullName}
        </p>
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: hasBio ? 8 : 0 }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: sans,
                  fontSize: 10,
                  fontWeight: 500,
                  color: GOLD,
                  border: `0.5px solid ${BORDER}`,
                  borderRadius: 20,
                  padding: "3px 10px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {hasBio && (
          <p
            onClick={() => setExpanded((v) => !v)}
            style={{
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 300,
              color: "#777",
              lineHeight: 1.6,
              margin: 0,
              cursor: "pointer",
              maxHeight: expanded ? 200 : 16,
              overflow: "hidden",
              transition: "max-height 0.18s ease",
            }}
          >
            {member.bio}
          </p>
        )}
      </div>

      <button
        onClick={() => onBook(`I want to book with ${member.fullName}`, false, null)}
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 600,
          color: "#fff",
          background: PRIMARY,
          border: "none",
          cursor: "pointer",
          padding: "9px 18px",
          borderRadius: 20,
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Book {member.fullName.split(" ")[0]}
      </button>
    </div>
  );
}

function StylistsSection({ staff, onBook }) {
  const visible = (staff ?? []).filter((m) => m.displayOnPublicPage);
  if (visible.length === 0) return null;

  return (
    <section
      id="stylists"
      className="px-16 max-sm:px-5"
      style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 64px" }}
    >
      <SectionHeading title="Meet the Team" subtitle="The hands behind every appointment." />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {visible.map((member) => (
          <StylistCard key={member.id} member={member} onBook={onBook} />
        ))}
      </div>
    </section>
  );
}

// ── Policies ──────────────────────────────────────────────────────────────────
function PolicyAccordionItem({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: DARK }}>{title}</span>
        <ChevronDown
          size={16}
          style={{ color: "#999", transition: "transform 0.18s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

function PolicyList({ items }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((t, i) => (
        <li key={i} style={{ fontFamily: sans, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
          {t}
        </li>
      ))}
    </ul>
  );
}

function PoliciesSection({ profile }) {
  const p = profile.businessPolicies || {};

  const cancelItems = [
    p.cancellationPolicy && `Cancellations: ${p.cancellationPolicy}`,
    p.lateArrivalPolicy && `Late arrivals: ${p.lateArrivalPolicy}`,
    p.lateFee && `Late fee: ${p.lateFee}`,
    p.waitingTime && `We'll hold your slot for: ${p.waitingTime}`,
  ].filter(Boolean);

  const bookingItems = [
    p.depositPolicy && `Deposit: ${p.depositPolicy}`,
    p.balancePaymentMethod && `Balance payment: ${p.balancePaymentMethod}`,
    p.walkIns && `Walk-ins: ${p.walkIns}`,
    p.whatToBring?.length ? `What to bring: ${p.whatToBring.join(", ")}` : null,
  ].filter(Boolean);

  const refundItems = [p.refundPolicy].filter(Boolean);

  const contactItems = [
    p.howToFindUs && `Getting here: ${p.howToFindUs}`,
    p.contactPreference && `Preferred contact: ${p.contactPreference}`,
    p.additionalInfo,
  ].filter(Boolean);

  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN;
  const privacyUrl = appDomain ? `https://${appDomain}/privacy` : "/privacy";
  const termsUrl = appDomain ? `https://${appDomain}/business-terms` : "/business-terms";
  const waHref = profile.phone ? `https://wa.me/${profile.phone.replace(/\D/g, "")}` : null;

  const linkRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 18px",
    border: `0.5px solid ${BORDER}`,
    borderRadius: 8,
    backgroundColor: "#fff",
    fontFamily: sans,
    fontSize: 14,
    fontWeight: 500,
    color: DARK,
    textDecoration: "none",
  };

  return (
    <section
      id="policies"
      className="px-16 max-sm:px-5"
      style={{ maxWidth: 1200, margin: "0 auto", padding: "0 64px 64px" }}
    >
      <SectionHeading title="Good to Know" subtitle="Everything about booking, deposits, and cancellations — in plain language." />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 720 }}>
        {cancelItems.length > 0 && (
          <PolicyAccordionItem title="Cancellations & No-Shows" defaultOpen>
            <PolicyList items={cancelItems} />
          </PolicyAccordionItem>
        )}
        {bookingItems.length > 0 && (
          <PolicyAccordionItem title="Booking & Deposits">
            <PolicyList items={bookingItems} />
          </PolicyAccordionItem>
        )}
        {refundItems.length > 0 && (
          <PolicyAccordionItem title="Refunds">
            <p style={{ fontFamily: sans, fontSize: 13, color: "#555", lineHeight: 1.6, margin: 0 }}>
              {p.refundPolicy}
            </p>
          </PolicyAccordionItem>
        )}
        {contactItems.length > 0 && (
          <PolicyAccordionItem title="Getting Here & Contact">
            <PolicyList items={contactItems} />
          </PolicyAccordionItem>
        )}
        <a href={privacyUrl} target="_blank" rel="noopener noreferrer" style={linkRowStyle}>
          Privacy Policy
        </a>
        <a href={termsUrl} target="_blank" rel="noopener noreferrer" style={linkRowStyle}>
          Terms of Service
        </a>
      </div>

      {waHref && (
        <div
          style={{
            marginTop: 24,
            padding: "20px 24px",
            border: `0.5px solid ${BORDER}`,
            borderRadius: 10,
            backgroundColor: CREAM,
            maxWidth: 720,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: DARK, margin: "0 0 3px" }}>
              Still have a question?
            </p>
            <p style={{ fontFamily: sans, fontSize: 12, color: "#7a6a5a", margin: 0 }}>
              We're happy to help clear anything up.
            </p>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              backgroundColor: PRIMARY,
              padding: "10px 20px",
              borderRadius: 24,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Message us on WhatsApp
          </a>
        </div>
      )}
    </section>
  );
}

// ── Hours ─────────────────────────────────────────────────────────────────────
function HoursCard({ hours }) {
  const todayIdx = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();
  const isOpenNow = checkOpenNow(hours);

  return (
    <div
      style={{
        border: `0.5px solid ${BORDER}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `0.5px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 500,
            color: DARK,
            margin: 0,
          }}
        >
          Opening hours
        </p>
        {isOpenNow && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 500,
              color: "#16a34a",
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
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "9px 16px",
                backgroundColor: isToday ? CREAM : "transparent",
                borderBottom: `0.5px solid ${BORDER}`,
              }}
            >
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: isToday ? 500 : 400,
                  color: isToday ? DARK : "#555",
                }}
              >
                {h.dayName}
              </span>
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 400,
                  color: h.isClosed ? "#999" : DARK,
                }}
              >
                {h.isClosed
                  ? "Closed"
                  : `${formatTime(h.opensAt)} – ${formatTime(h.closesAt)}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Location ──────────────────────────────────────────────────────────────────
function LocationCard({ profile }) {
  const parts = [profile.address, profile.area, profile.city].filter(Boolean);
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent([profile.businessName, ...parts].join(", "))}`;

  return (
    <div
      style={{ borderRadius: 10, overflow: "hidden", backgroundColor: DARK }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            backgroundColor: PRIMARY,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <MapPin size={16} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <p
            style={{
              fontFamily: sans,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              margin: "0 0 5px",
            }}
          >
            Where to find us
          </p>
          <p
            style={{
              fontFamily: serif,
              fontSize: 19,
              fontWeight: 400,
              color: "#fff",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: "-0.2px",
            }}
          >
            {profile.businessName}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "0.5px",
          backgroundColor: "rgba(255,255,255,0.08)",
          margin: "0 20px",
        }}
      />

      {/* Address lines */}
      <div style={{ padding: "14px 20px 18px" }}>
        {parts.map((part, i) => (
          <p
            key={i}
            style={{
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 300,
              color: "rgba(255,255,255,0.6)",
              margin: "0 0 3px",
              lineHeight: 1.6,
            }}
          >
            {part}
          </p>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "0 20px 20px" }}>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.05em",
            color: "#fff",
            backgroundColor: PRIMARY,
            padding: "9px 18px",
            borderRadius: 20,
            textDecoration: "none",
          }}
        >
          <MapPin size={12} /> Get directions
        </a>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function SalonFooter({ profile }) {
  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN;
  const homeUrl = appDomain ? `https://${appDomain}` : "/";
  const privacyUrl = appDomain ? `https://${appDomain}/privacy` : "/privacy";
  const termsUrl = appDomain ? `https://${appDomain}/business-terms` : "/business-terms";

  const explore = [
    { label: "Home", href: "#home" },
    { label: "Services", href: "#services" },
    { label: "Gallery", href: "#gallery" },
    { label: "Stylists", href: "#stylists" },
  ];
  const policies = [
    { label: "Cancellations & Deposits", href: "#policies" },
    { label: "Privacy Policy", href: privacyUrl },
    { label: "Terms of Service", href: termsUrl },
  ];

  return (
    <footer style={{ backgroundColor: DARK, paddingTop: 48, paddingBottom: 24 }}>
      <div
        className="salon-footer-grid px-16 max-sm:px-5"
        style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 32 }}
      >
        <div>
          <p
            style={{
              fontFamily: serif,
              fontSize: 20,
              fontWeight: 400,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#fff",
              margin: 0,
            }}
          >
            {profile.businessName}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, margin: "0 0 12px" }}>
            Explore
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {explore.map((l) => (
              <a key={l.label} href={l.href} style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, margin: "0 0 12px" }}>
            Policies
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {policies.map((l) => (
              <a key={l.label} href={l.href} style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: "0.5px", backgroundColor: "rgba(255,255,255,0.08)" }} />
      <p
        className="px-16 max-sm:px-5"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 300,
          color: "rgba(255,255,255,0.45)",
          margin: 0,
          paddingTop: 20,
          maxWidth: 1200,
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "center",
        }}
      >
        &copy; {new Date().getFullYear()} {profile.businessName} &middot; Powered by{" "}
        <a href={homeUrl} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
          Kimawa
        </a>
      </p>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SalonLanding() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [chatInitMsg, setChatInitMsg] = useState("");
  const [chatSkipIntake, setChatSkipIntake] = useState(false);
  const [chatConfirmedBooking, setChatConfirmedBooking] = useState(null);
  const [chatReferenceService, setChatReferenceService] = useState(null);
  const { data, loading, error } = useQuery(SALON_PROFILE);

  // Detect return from payment page and auto-open chat with confirmation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successRef = params.get("payment_success");
    if (!successRef) return;
    window.history.replaceState({}, "", window.location.pathname);
    const booking = {
      ref: successRef,
      service: params.get("service")
        ? decodeURIComponent(params.get("service"))
        : "",
      amount: params.get("amount") || "",
      date: params.get("appt_date") || "",
      time: params.get("appt_time") || "",
      staff: params.get("appt_staff")
        ? decodeURIComponent(params.get("appt_staff"))
        : "",
      customer: params.get("appt_customer")
        ? decodeURIComponent(params.get("appt_customer"))
        : "",
    };
    setTimeout(() => {
      setChatConfirmedBooking(booking);
      setChatInitMsg("");
      playPopSound();
      setChatOpen(true);
    }, 400);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageSpinner />;

  const isNotApproved = error?.graphQLErrors?.some((e) => e.message === 'SALON_NOT_APPROVED')
  if (isNotApproved) {
    const discoverUrl = import.meta.env.VITE_TENANT_APP_DOMAIN
      ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}/discover`
      : '/discover'
    return (
      <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SalonNav onBook={() => {}} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: PRIMARY, margin: '0 0 20px' }}>
            Coming soon
          </p>
          <h1 style={{ fontFamily: serif, fontSize: 42, fontWeight: 400, letterSpacing: '-1px', color: DARK, margin: '0 0 16px', lineHeight: 1.1 }}>
            This salon isn&apos;t open yet.
          </h1>
          <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, color: '#555', margin: '0 0 40px', maxWidth: 380, lineHeight: 1.7 }}>
            We&apos;re reviewing this business before it goes live. Check back soon.
          </p>
          <a
            href={discoverUrl}
            style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, padding: '13px 28px', borderRadius: 24, textDecoration: 'none' }}
          >
            Explore other salons
          </a>
        </div>
      </div>
    )
  }

  if (error) return <ErrorMessage message={error.message} />;

  const profile = data?.salonProfile;
  if (!profile) return null;

  function openChat(msg = "", skipIntake = false, referenceService = null) {
    setChatKey((k) => k + 1);
    setChatInitMsg(msg);
    setChatSkipIntake(skipIntake);
    setChatReferenceService(referenceService);
    playPopSound();
    setChatOpen(true);
  }

  const canonicalSlug = window.location.hostname.split('.')[0]
  const locationStr = [profile.area, profile.city].filter(Boolean).join(', ')
  const typeLabel = TYPE_LABELS[profile.businessType] ?? 'Beauty Salon'
  const metaTitle = `${profile.businessName} | ${typeLabel} in ${locationStr || 'Zambia'} | Book Online`
  const metaDesc = `Book appointments at ${profile.businessName}, a ${typeLabel.toLowerCase()} in ${locationStr || 'Zambia'}. Online booking, instant confirmation.`
  const salonUrl = `https://${canonicalSlug}.kimawa.pro`

  const SCHEMA_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": profile.businessName,
    "url": salonUrl,
    "telephone": profile.phone,
    "priceRange": "ZMW",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": profile.address || undefined,
      "addressLocality": profile.area || profile.city,
      "addressRegion": profile.city,
      "addressCountry": "ZM"
    },
    ...(profile.coverImageUrl ? { "image": profile.coverImageUrl } : {}),
    "openingHoursSpecification": profile.openingHours
      ?.filter((h) => !h.isClosed && h.opensAt && h.closesAt)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": `https://schema.org/${SCHEMA_DAYS[h.dayOfWeek]}`,
        "opens": h.opensAt,
        "closes": h.closesAt,
      })),
    "makesOffer": profile.services
      ?.filter((s) => s.isActive)
      .map((s) => ({
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": s.name },
        "priceCurrency": "ZMW",
        "price": s.priceZmw,
      })),
  }

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
        html { scroll-behavior: smooth; }
        .salon-hero { height: 460px; }
        .salon-hero-name { font-size: 52px; }
        .salon-hero-subtitle { font-size: 15px; }
        .salon-stats-bar { padding: 18px 64px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .salon-content-grid { display: grid; grid-template-columns: 1fr 300px; gap: 56px; padding: 56px 64px; }
        .salon-portfolio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .salon-footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 32px; padding-top: 8px; }
        .visual-services-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .visual-service-card img { transition: transform 0.25s ease; }
        .visual-service-card:hover img { transform: scale(1.05); }
        .nav-pill-row::-webkit-scrollbar, .pill-row::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) {
          .salon-hero { height: 320px !important; }
          .salon-hero-name { font-size: 30px !important; }
          .salon-hero-subtitle { font-size: 13px !important; }
          .salon-stats-bar { padding: 12px 16px !important; }
          .salon-content-grid { grid-template-columns: 1fr !important; gap: 24px !important; padding: 16px !important; }
          .salon-portfolio-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; }
          .salon-footer-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .visual-services-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SalonNav onBook={() => openChat("")} />
      <Hero profile={profile} onChatOpen={openChat} />
      <StatsBar profile={profile} onOpenChat={openChat} />

      {/* Main content + sidebar */}
      <div
        className="salon-content-grid"
        style={{ maxWidth: 1200, margin: "0 auto", alignItems: "start" }}
      >
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          <ServicesSection
            services={profile.services.filter((s) => s.isActive)}
            portfolioImages={profile.portfolioImages}
            businessType={profile.businessType}
            onBook={openChat}
          />
          <PortfolioSection images={profile.portfolioImages} />
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <HoursCard hours={profile.openingHours} />
          <LocationCard profile={profile} />
        </div>
      </div>

      <StylistsSection staff={profile.staff} onBook={openChat} />
      <PoliciesSection profile={profile} />

      <SalonFooter profile={profile} />

      {/* Chat FAB */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 40 }}>
        <button
          onClick={() => {
            chatOpen ? setChatOpen(false) : openChat("");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: chatOpen ? "11px 18px" : "11px 22px",
            backgroundColor: DARK,
            border: "0.5px solid rgba(255,255,255,0.14)",
            borderRadius: 40,
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.02em",
            transition: "padding 0.15s",
          }}
        >
          {chatOpen ? (
            <>
              <X size={15} style={{ opacity: 0.7 }} />
              <span>Close</span>
            </>
          ) : (
            <>
              <Sparkles size={14} style={{ color: GOLD }} />
              <span>Ask or Book</span>
            </>
          )}
        </button>
      </div>

      {chatOpen && (
        <ChatWindow
          key={chatKey}
          salonName={profile.businessName}
          initialMessage={chatInitMsg}
          confirmedBooking={chatConfirmedBooking}
          skipIntake={chatSkipIntake}
          referenceService={chatReferenceService}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
