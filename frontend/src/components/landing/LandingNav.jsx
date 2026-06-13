import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const PRIMARY = "#6B2737";
const BORDER = "#f0ece8";

const NAV_LINKS = [
  { label: "How it Works", to: "/how-it-works" },
  { label: "For Businesses", to: "/for-businesses" },
  { label: "Find Beauty Services", to: "/discover" },
];

export default function LandingNav({ variant = "public" }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav
      style={{
        backgroundColor: "#fff",
        borderBottom: `0.5px solid ${BORDER}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Desktop bar — hidden on mobile; lg:flex owns the display value */}
      <div
        className="hidden lg:flex"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 0",
          position: "relative",
        }}
      >
        {/* Section 1 — Left: logo + wordmark */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 0,
            flexShrink: 0,
          }}
        >
          <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: 50 }} />
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 18,
              fontWeight: 400,
              color: "#6B2737",
              letterSpacing: "-0.3px",
              marginLeft: -18,
            }}
          >
            Kimawa
          </span>
        </Link>

        {/* Section 2 — Center: nav links (absolutely centered) */}
        {variant === "public" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 32,
            }}
          >
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 400,
                  color: pathname.startsWith(to) ? PRIMARY : "#333",
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                  borderBottom: pathname.startsWith(to)
                    ? `1px solid ${PRIMARY}`
                    : "1px solid transparent",
                  paddingBottom: 1,
                  whiteSpace: "nowrap",
                  transition: "color 0.12s",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Section 3 — Right: Login + CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexShrink: 0,
          }}
        >
          <Link
            to="/login"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 400,
              color: "#333",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
          <Link
            to="/signup"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.06em",
              color: "#fff",
              backgroundColor: PRIMARY,
              padding: "10px 22px",
              borderRadius: 3,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            List Your Business
          </Link>
        </div>
      </div>

      {/* Mobile bar — hidden on desktop; flex owns the display value via Tailwind */}
      <div
        className="flex lg:hidden"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: 28 }} />
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              fontWeight: 400,
              color: "#6B2737",
              letterSpacing: "-0.3px",
            }}
          >
            Kimawa
          </span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            color: "#1a1a1a",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 12,
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
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              style={{
                fontSize: 14,
                color: "#333",
                textDecoration: "none",
                padding: "14px 16px",
                display: "block",
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            style={{
              fontSize: 14,
              color: "#333",
              textDecoration: "none",
              padding: "14px 16px",
              display: "block",
            }}
          >
            Login
          </Link>
          <div style={{ padding: "8px 16px" }}>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              style={{
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.06em",
                color: "#fff",
                backgroundColor: PRIMARY,
                padding: "14px 20px",
                borderRadius: 3,
                textDecoration: "none",
                textAlign: "center",
                display: "block",
              }}
            >
              List Your Business
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
