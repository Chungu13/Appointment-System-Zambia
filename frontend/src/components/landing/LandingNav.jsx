import { getCanonicalAppUrl } from "../../router/TenantRoute";
import { PRIMARY, CREAM, BORDER, DARK, serif, sans, LAYOUT_CSS } from "../../pages/public/salon/theme";

export default function LandingNav() {
  const loginHref = getCanonicalAppUrl("/login") ?? "/login";
  const signupHref = getCanonicalAppUrl("/signup") ?? "/signup";

  return (
    <nav
      style={{
        backgroundColor: CREAM,
        borderBottom: `0.5px solid ${BORDER}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <style>{`
        ${LAYOUT_CSS}
        .landing-nav-row { padding-top: 16px; padding-bottom: 16px; gap: 16px; }
        .landing-nav-logo { height: 40px; }
        .landing-nav-wordmark { font-size: 18px; }
        .landing-nav-actions { gap: 20px; }
        .landing-nav-cta { padding: 10px 20px; font-size: 12px; }
        @media (max-width: 480px) {
          .landing-nav-row { padding-top: 10px !important; padding-bottom: 10px !important; gap: 8px !important; }
          .landing-nav-logo { height: 26px !important; }
          .landing-nav-wordmark { font-size: 14px !important; }
          .landing-nav-actions { gap: 8px !important; }
          .landing-nav-cta { padding: 8px 12px !important; font-size: 10.5px !important; }
        }
      `}</style>
      <div
        className="salon-container landing-nav-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a
          href={getCanonicalAppUrl("/") ?? "/"}
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
        >
          <img src="/kimawalogo.svg" alt="Kimawa" className="landing-nav-logo" style={{ flexShrink: 0 }} />
          <span className="landing-nav-wordmark" style={{ fontFamily: serif, fontWeight: 400, color: DARK, letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>
            Kimawa
          </span>
        </a>

        <div className="landing-nav-actions" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <a
            href={loginHref}
            style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: "#5c4c3d", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Login
          </a>
          <a
            href={signupHref}
            className="landing-nav-cta"
            style={{
              fontFamily: sans,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "#fff",
              backgroundColor: PRIMARY,
              borderRadius: 10,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            List Your Business
          </a>
        </div>
      </div>
    </nav>
  );
}
