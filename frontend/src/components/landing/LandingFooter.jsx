import { Link } from "react-router-dom";
import { DARK, serif, sans } from "../../pages/public/salon/theme";

const LINKS = [
  { label: "How it Works", to: "/how-it-works" },
  { label: "For Businesses", to: "/for-businesses" },
  { label: "Find Beauty Services", to: "/discover" },
];

export default function LandingFooter() {
  return (
    <footer
      style={{
        backgroundColor: DARK,
        paddingTop: 24,
        paddingBottom: 24,
      }}
      className="px-16 max-sm:px-5"
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
        className="max-sm:flex-col max-sm:items-start max-sm:gap-4"
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: 26 }} />
          <span
            style={{
              fontFamily: serif,
              fontSize: 14,
              fontWeight: 400,
              color: "#fff",
              letterSpacing: "-0.3px",
            }}
          >
            Kimawa
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 400,
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            color: "rgba(255,255,255,0.45)",
            margin: 0,
          }}
        >
          &copy; {new Date().getFullYear()} Kimawa &middot; Zambia
        </p>
      </div>
    </footer>
  );
}
