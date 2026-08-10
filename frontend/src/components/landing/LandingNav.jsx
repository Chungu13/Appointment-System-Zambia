import { getCanonicalAppUrl } from "../../router/TenantRoute";
import { PRIMARY, CREAM, BORDER, DARK, serif, sans } from "../../pages/public/salon/theme";

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
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 64px",
          gap: 16,
        }}
        className="max-sm:px-5 max-sm:py-3.5"
      >
        <a
          href={getCanonicalAppUrl("/") ?? "/"}
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
        >
          <img src="/kimawalogo.svg" alt="Kimawa" style={{ height: 40 }} className="max-sm:h-8" />
          <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 400, color: DARK, letterSpacing: "-0.3px" }} className="max-sm:text-base">
            Kimawa
          </span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a
            href={loginHref}
            style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: "#5c4c3d", textDecoration: "none" }}
          >
            Login
          </a>
          <a
            href={signupHref}
            style={{
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "#fff",
              backgroundColor: PRIMARY,
              padding: "10px 20px",
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
