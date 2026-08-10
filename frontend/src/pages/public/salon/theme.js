// Shared design tokens + pure helpers for the tenant storefront pages
// (Home, Services, Gallery, Stylists, Policies). Kept here so every page
// re-themes together instead of drifting.
export const PRIMARY = "#3B2A1E"; // deep coffee — buttons, pills, accents
export const PRIMARY_RGB = "59,42,30";
export const DARK = "#241812"; // near-black espresso — banner overlay, footer, dark cards
export const BORDER = "#EDE3D6"; // warm sand border
export const CREAM = "#FBF7F1"; // warm off-white section background
export const GOLD = "#B4895A"; // warm accent for tags / small caps
export const sans = "Inter, sans-serif";
// Kept as an alias (rather than removing every `serif` import) — every
// storefront/marketing heading should render in the sans stack, no serif.
export const serif = sans;

// Single shared horizontal-container definition — every page's heading,
// filter pills, card grid, and footer use this ONE class instead of a mix
// of Tailwind's "px-16 max-sm:px-5" (whose "max-sm:" variant doesn't
// compile in this project's build, see index.css) and ad-hoc inline
// padding, which is what caused headings/pills to sit flush while cards
// picked up stray extra padding elsewhere. Fix here once, not per-page.
export const LAYOUT_CSS = `
  .salon-container { max-width: 1200px; margin: 0 auto; box-sizing: border-box; padding-left: 64px; padding-right: 64px; }
  .salon-fab-clear { padding-bottom: 40px; }
  @media (max-width: 640px) {
    .salon-container { padding-left: 20px !important; padding-right: 20px !important; }
    .salon-fab-clear { padding-bottom: 96px !important; }
  }
`;

export const TYPE_LABELS = {
  salon: "Salon",
  barbershop: "Barbershop",
  nail_tech: "Nail Tech",
  spa: "Spa",
  lash_studio: "Lash Studio",
  makeup_artist: "Makeup Artist",
};

export const DEFAULT_BANNERS = {
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

export function bannerFor(profile) {
  if (profile.coverImageUrl) return profile.coverImageUrl;
  if (profile.portfolioPreviewUrl) return profile.portfolioPreviewUrl;
  return DEFAULT_BANNERS[profile.businessType] ?? DEFAULT_BANNERS._fallback;
}

// A service's own uploaded photo wins; otherwise fall back to the same
// business-type stock photo already used for the banner.
export function imageForService(svc, portfolioImages, businessType) {
  const match = portfolioImages.find(
    (img) => img.serviceName && img.serviceName.toLowerCase() === svc.name.toLowerCase(),
  );
  if (match) return match.imageUrl;
  return DEFAULT_BANNERS[businessType] ?? DEFAULT_BANNERS._fallback;
}

export function formatTime(timeStr) {
  if (!timeStr) return "-";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function checkOpenNow(hours) {
  const now = new Date();
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const row = hours?.find((h) => h.dayOfWeek === todayIdx);
  if (!row || row.isClosed || !row.opensAt || !row.closesAt) return false;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = row.opensAt.split(":").map(Number);
  const [ch, cm] = row.closesAt.split(":").map(Number);
  return nowMins >= oh * 60 + om && nowMins < ch * 60 + cm;
}
