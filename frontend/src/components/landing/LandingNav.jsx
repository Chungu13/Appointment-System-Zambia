import { Link, useLocation } from "react-router-dom";

const PRIMARY = "#6B2737";
const TEXT = "#1A0A0D";
const MUTED = "#6B4A50";

const NAV_LINKS = [
  { label: "How it Works", to: "/how-it-works" },
  { label: "Pricing", to: "/pricing" },
  { label: "For Businesses", to: "/for-businesses" },
];

export default function LandingNav() {
  const { pathname } = useLocation();

  function isActive(to) {
    return pathname.startsWith(to);
  }

  return (
    <nav
      style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #D4B0B8" }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: '52px' }} />
          <span className="text-xl font-semibold" style={{ color: PRIMARY }}>Kimawa</span>
        </Link>

        {/* Nav links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium pb-0.5 transition-colors whitespace-nowrap"
              style={{
                color: TEXT,
                borderBottom: isActive(to)
                  ? `2px solid ${PRIMARY}`
                  : "2px solid transparent",
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side CTAs */}
        <div className="flex items-center gap-4 shrink-0">
          <Link
            to="/discover"
            className="text-sm font-medium hidden sm:block transition-opacity hover:opacity-70"
            style={{ color: MUTED }}
          >
            Find Beauty Services
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium hidden sm:block transition-opacity hover:opacity-70"
            style={{ color: PRIMARY }}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            List Your Business
          </Link>
        </div>
      </div>
    </nav>
  );
}
