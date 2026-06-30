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
  ScrollText,
} from "lucide-react";
import { SALON_PROFILE } from "../../graphql/queries/salons";
import ChatWindow from "../../components/chat/ChatWindow";
import { PageSpinner, ErrorMessage } from "../../components/ui/Spinner";
import { formatZMW } from "../../lib/utils";
import { playPopSound } from "../../lib/sounds";

const PRIMARY = "#6B2737";
const DARK = "#1A0A0D";
const BORDER = "#f0ece8";
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

// ── Eyebrow ───────────────────────────────────────────────────────────────────
function Eyebrow({ children }) {
  return (
    <p
      style={{
        fontFamily: sans,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#555",
        margin: "0 0 16px",
      }}
    >
      {children}
    </p>
  );
}

// ─��� Navbar ──────────────────────────���────────────────────────────────��────────
function SalonNav() {
  const [open, setOpen] = useState(false);
  const homeUrl = import.meta.env.VITE_TENANT_APP_DOMAIN
    ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}`
    : "/";
  const discoverUrl = import.meta.env.VITE_TENANT_APP_DOMAIN
    ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}/discover`
    : "/discover";

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "#fff",
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
            gap: 8,
          }}
        >
          <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: 50 }} />
          <span
            style={{
              fontFamily: serif,
              fontSize: 18,
              fontWeight: 400,
              color: "#1a1a1a",
              letterSpacing: "-0.3px",
            }}
          >
            Kimawa
          </span>
        </a>
        <a
          href={discoverUrl}
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 400,
            color: "#555",
            textDecoration: "none",
          }}
        >
          Find Beauty Services
        </a>
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
              color: "#1a1a1a",
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
            color: "#1a1a1a",
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
            backgroundColor: "#fff",
            padding: "8px 4px",
          }}
        >
          <a
            href={discoverUrl}
            onClick={() => setOpen(false)}
            style={{
              fontSize: 14,
              color: "#333",
              textDecoration: "none",
              padding: "14px 16px",
              display: "block",
            }}
          >
            Find Beauty Services
          </a>
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

  return (
    <header
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
          opacity: 0.55,
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
          background: "linear-gradient(to top, rgba(10,3,5,0.9), transparent)",
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
            borderRadius: 3,
            marginBottom: 12,
          }}
        >
          {TYPE_LABELS[profile.businessType] ?? profile.businessType}
        </span>

        <h1
          className="salon-hero-name"
          style={{
            fontFamily: serif,
            fontWeight: 300,
            letterSpacing: "-1px",
            color: "#fff",
            margin: "0 0 14px",
            lineHeight: 1.05,
          }}
        >
          {profile.businessName}
        </h1>

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
function StatsBar({ profile, onOpenChat, onOpenPolicies }) {
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
        backgroundColor: "#faf8f6",
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
                  color: "#1a1a1a",
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
                  color: "#666",
                  margin: 0,
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onOpenPolicies}
            style={{
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 500,
              color: PRIMARY,
              border: `1.5px solid ${PRIMARY}`,
              padding: "9px 18px",
              borderRadius: 3,
              background: "transparent",
              cursor: "pointer",
              letterSpacing: "0.04em",
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ScrollText size={13} />
            Policies
          </button>
          <button
            onClick={() => onOpenChat("")}
            style={{
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 500,
              color: "#fff",
              border: "none",
              padding: "9px 20px",
              borderRadius: 3,
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

// ── Services ──────────────────────────────────────────────────────────────────
function ServicesSection({ services, onBook }) {
  const grouped = services.reduce((acc, s) => {
    const cat = s.category || "Services";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const [openCategories, setOpenCategories] = useState(() => {
    const cats = Object.keys(grouped);
    return new Set(cats.slice(0, 1));
  });

  function toggleCategory(cat) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  if (services.length === 0) return null;

  return (
    <section>
      <Eyebrow>Services</Eyebrow>
      <div
        style={{
          border: `0.5px solid ${BORDER}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {Object.entries(grouped).map(([cat, items], groupIdx) => {
          const isOpen = openCategories.has(cat);
          return (
            <div
              key={cat}
              style={{
                borderTop: groupIdx > 0 ? `0.5px solid ${BORDER}` : "none",
              }}
            >
              {/* Collapsible category header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 20px",
                  background: "#faf8f6",
                  borderBottom: isOpen ? `0.5px solid ${BORDER}` : "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontFamily: sans,
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#333",
                  }}
                >
                  {cat}
                </span>
                <ChevronDown
                  size={14}
                  style={{
                    color: "#999",
                    transition: "transform 0.18s",
                    transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                    flexShrink: 0,
                  }}
                />
              </button>

              {/* Service rows — shown when open */}
              {isOpen &&
                items.map((svc, i) => (
                  <div
                    key={svc.id}
                    className="service-item"
                    style={{
                      borderTop: i > 0 ? `0.5px solid ${BORDER}` : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: sans,
                          fontSize: 13,
                          fontWeight: 400,
                          color: "#1a1a1a",
                          margin: "0 0 3px",
                        }}
                      >
                        {svc.name}
                      </p>
                      <p
                        style={{
                          fontFamily: sans,
                          fontSize: 12,
                          fontWeight: 400,
                          color: "#666",
                          margin: 0,
                        }}
                      >
                        {svc.durationMinutes} min
                        {svc.depositZmw > 0 &&
                          ` · ${formatZMW(svc.depositZmw)} deposit`}
                      </p>
                    </div>
                    <div className="service-item-right">
                      <p
                        style={{
                          fontFamily: sans,
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#1a1a1a",
                          margin: 0,
                        }}
                      >
                        {formatZMW(svc.priceZmw)}
                      </p>
                      <button
                        onClick={() => {
                          const label = svc.category
                            ? `${svc.category} — ${svc.name}`
                            : svc.name;
                          onBook(
                            `I want to book ${label} [service_id:${svc.id}]`,
                          );
                        }}
                        style={{
                          fontFamily: sans,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#fff",
                          background: PRIMARY,
                          border: "none",
                          cursor: "pointer",
                          padding: "7px 16px",
                          borderRadius: 6,
                          letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Portfolio ─────────────────────────────────────────────────────────────────
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
        {img.caption && (
          <p
            style={{
              color: "#fff",
              textAlign: "center",
              fontFamily: sans,
              fontSize: 13,
              marginTop: 12,
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
      <section>
        <Eyebrow>Portfolio</Eyebrow>
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
    <section>
      <Eyebrow>Portfolio</Eyebrow>
      {/* 2-col on mobile, 3-col on desktop; first image spans 2 rows on desktop only */}
      <div className="salon-portfolio-grid">
        {visible.map((img, i) => (
          <div
            key={img.id}
            onClick={() => setLightboxIdx(i)}
            className={
              i === 0 ? "h-40 sm:h-[288px] sm:row-span-2" : "h-36 sm:h-[140px]"
            }
            style={{ borderRadius: 6, overflow: "hidden", cursor: "pointer" }}
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
            fontFamily: sans, fontSize: 12, fontWeight: 300, color: "#6B2737",
            letterSpacing: "0.06em",
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

// ── Team ──────────────────────────────────────────────────────────────────────
function TeamSection({ staff }) {
  const visible = (staff ?? []).filter((m) => m.displayOnPublicPage);
  if (visible.length === 0) return null;
  staff = visible;

  return (
    <section>
      <Eyebrow>Meet the team</Eyebrow>
      <div className="salon-team-grid">
        {staff.map((member) => (
          <div
            key={member.id}
            style={{
              border: `0.5px solid ${BORDER}`,
              borderRadius: 8,
              padding: 18,
              textAlign: "center",
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
                  borderRadius: "50%",
                  objectFit: "cover",
                  margin: "0 auto 12px",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  backgroundColor: "#f5eaec",
                  border: "1.5px solid #e8d0d5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
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
            <p
              style={{
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 500,
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              {member.fullName}
            </p>
          </div>
        ))}
      </div>
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
            color: "#1a1a1a",
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
                backgroundColor: isToday ? "#fdf8f8" : "transparent",
                borderBottom: `0.5px solid ${BORDER}`,
              }}
            >
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: isToday ? 500 : 400,
                  color: isToday ? "#1a1a1a" : "#555",
                }}
              >
                {h.dayName}
              </span>
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 400,
                  color: h.isClosed ? "#999" : "#1a1a1a",
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
            borderRadius: 5,
            textDecoration: "none",
          }}
        >
          <MapPin size={12} /> Get directions
        </a>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SalonLanding() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [chatInitMsg, setChatInitMsg] = useState("");
  const [chatSkipIntake, setChatSkipIntake] = useState(false);
  const [chatConfirmedBooking, setChatConfirmedBooking] = useState(null);
  const { data, loading, error } = useQuery(SALON_PROFILE);

  // Detect return from payment page and auto-open chat with confirmation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successRef = params.get("payment_success");
    const service = params.get("service");
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
        <SalonNav />
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
            style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', backgroundColor: PRIMARY, padding: '13px 28px', borderRadius: 3, textDecoration: 'none' }}
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

  function openChat(msg = "", skipIntake = false) {
    setChatKey((k) => k + 1);
    setChatInitMsg(msg);
    setChatSkipIntake(skipIntake);
    playPopSound();
    setChatOpen(true);
  }

  const canonicalSlug = window.location.hostname.split('.')[0]
  const locationStr = [profile.area, profile.city].filter(Boolean).join(', ')
  const typeLabel = TYPE_LABELS[profile.businessType] ?? 'Beauty Salon'
  const metaTitle = `${profile.businessName} — ${typeLabel} in ${locationStr || 'Zambia'} | Book Online`
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
        .salon-hero { height: 400px; }
        .salon-hero-name { font-size: 52px; }
        .salon-stats-bar { padding: 18px 64px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .salon-content-grid { display: grid; grid-template-columns: 1fr 300px; gap: 56px; padding: 56px 64px; }
        .salon-portfolio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .salon-team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .service-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; gap: 16px; }
        .service-item-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
        @media (max-width: 640px) {
          .salon-hero { height: 260px !important; }
          .salon-hero-name { font-size: 28px !important; }
          .salon-stats-bar { padding: 12px 16px !important; }
          .salon-content-grid { grid-template-columns: 1fr !important; gap: 24px !important; padding: 16px !important; }
          .salon-portfolio-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; }
          .salon-team-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .service-item { flex-wrap: wrap; gap: 8px !important; }
          .service-item-right { width: 100%; justify-content: space-between; }
        }
      `}</style>
      <SalonNav />
      <Hero profile={profile} onChatOpen={openChat} />
      <StatsBar
        profile={profile}
        onOpenChat={openChat}
        onOpenPolicies={() =>
          openChat(
            "What are your policies? (cancellations, late arrivals, deposits, etc.)",
            true,
          )
        }
      />

      {/* Main content + sidebar */}
      <div
        className="salon-content-grid"
        style={{ maxWidth: 1200, margin: "0 auto", alignItems: "start" }}
      >
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          <ServicesSection
            services={profile.services.filter((s) => s.isActive)}
            onBook={openChat}
          />
          <PortfolioSection images={profile.portfolioImages} />
          <TeamSection staff={profile.staff} />
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <HoursCard hours={profile.openingHours} />
          <LocationCard profile={profile} />
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: `0.5px solid ${BORDER}`,
          paddingTop: 20,
          paddingBottom: 20,
          textAlign: "center",
        }}
        className="px-16 max-sm:px-5"
      >
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 300,
            color: "#666",
            margin: 0,
          }}
        >
          {profile.businessName} &middot; Powered by{" "}
          <a
            href={
              import.meta.env.VITE_TENANT_APP_DOMAIN
                ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}`
                : "/"
            }
            style={{ color: PRIMARY, textDecoration: "none" }}
          >
            Kimawa
          </a>
        </p>
      </footer>

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
              <Sparkles size={14} style={{ color: PRIMARY }} />
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
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
