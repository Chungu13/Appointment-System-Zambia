// Thin wrapper around gtag.js (loaded in index.html) so call sites don't
// need to guard against ad-blockers or a not-yet-loaded script tag.
export function trackEvent(name, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params)
  }
}
