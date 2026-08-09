import { useParams } from "react-router-dom";
import { getSubdomain } from "../../../router/TenantRoute";

// Root-relative on a tenant subdomain ("/services"), slug-prefixed on the
// plain-localhost path fallback ("/glow-salon/services") — mirrors the
// existing "/book" vs "/:salonSlug/book" pattern.
export function useSalonPaths() {
  const { salonSlug } = useParams();
  const prefix = getSubdomain() ? "" : salonSlug ? `/${salonSlug}` : "";
  return {
    home: prefix || "/",
    services: `${prefix}/services`,
    gallery: `${prefix}/gallery`,
    stylists: `${prefix}/stylists`,
    policies: `${prefix}/policies`,
  };
}
