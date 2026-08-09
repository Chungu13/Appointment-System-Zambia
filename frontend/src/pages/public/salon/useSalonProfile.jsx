import { useQuery } from "@apollo/client/react";
import { SALON_PROFILE } from "../../../graphql/queries/salons";
import { PageSpinner, ErrorMessage } from "../../../components/ui/Spinner";
import { PRIMARY, DARK, serif, sans } from "./theme";

function NotApprovedScreen() {
  const discoverUrl = import.meta.env.VITE_TENANT_APP_DOMAIN
    ? `https://${import.meta.env.VITE_TENANT_APP_DOMAIN}/discover`
    : "/discover";
  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: PRIMARY, margin: "0 0 20px" }}>
        Coming soon
      </p>
      <h1 style={{ fontFamily: serif, fontSize: 42, fontWeight: 400, letterSpacing: "-1px", color: DARK, margin: "0 0 16px", lineHeight: 1.1 }}>
        This salon isn&apos;t open yet.
      </h1>
      <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, color: "#555", margin: "0 0 40px", maxWidth: 380, lineHeight: 1.7 }}>
        We&apos;re reviewing this business before it goes live. Check back soon.
      </p>
      <a
        href={discoverUrl}
        style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", color: "#fff", backgroundColor: PRIMARY, padding: "13px 28px", borderRadius: 24, textDecoration: "none" }}
      >
        Explore other salons
      </a>
    </div>
  );
}

// Shared loading/error/not-approved handling for every storefront page.
// Returns `screen` (render this and stop) or `profile` (ready to render).
export function useSalonProfile() {
  const { data, loading, error } = useQuery(SALON_PROFILE);

  if (loading) return { profile: null, screen: <PageSpinner /> };

  const isNotApproved = error?.graphQLErrors?.some((e) => e.message === "SALON_NOT_APPROVED");
  if (isNotApproved) return { profile: null, screen: <NotApprovedScreen /> };

  if (error) return { profile: null, screen: <ErrorMessage message={error.message} /> };

  const profile = data?.salonProfile;
  if (!profile) return { profile: null, screen: null };

  return { profile, screen: null };
}
