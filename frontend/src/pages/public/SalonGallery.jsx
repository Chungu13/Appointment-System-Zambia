import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageBanner, SalonFooter, ChatFab, CHROME_STYLE } from "./salon/SalonChrome";
import { useSalonProfile } from "./salon/useSalonProfile";
import { useChatFab } from "./salon/useChatFab";
import { PRIMARY, PRIMARY_RGB, BORDER, sans } from "./salon/theme";

function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const img = images[idx];

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(images.length - 1, i + 1));
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <X size={20} />
      </button>
      {idx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
          style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {idx < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
          style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronRight size={22} />
        </button>
      )}
      <div style={{ maxWidth: 800, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <img src={img.imageUrl} alt={img.caption || ""} loading="lazy" style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 8 }} />
        {img.serviceName && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <span style={{ display: "inline-block", fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", backgroundColor: `rgba(${PRIMARY_RGB},0.85)`, padding: "3px 10px", borderRadius: 3 }}>
              {img.serviceName}
            </span>
          </div>
        )}
        {img.caption && <p style={{ color: "#fff", textAlign: "center", fontFamily: sans, fontSize: 13, marginTop: 8 }}>{img.caption}</p>}
      </div>
    </div>
  );
}

export default function SalonGallery() {
  const { profile, screen } = useSalonProfile();
  const chat = useChatFab();
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [showAll, setShowAll] = useState(false);

  if (screen) return screen;

  const images = profile.portfolioImages || [];
  const PREVIEW_COUNT = 12;
  const visible = showAll ? images : images.slice(0, PREVIEW_COUNT);
  const hasMore = !showAll && images.length > PREVIEW_COUNT;

  return (
    <div style={{ backgroundColor: "#fff" }}>
      <Helmet>
        <title>{`Gallery | ${profile.businessName}`}</title>
      </Helmet>
      <style>{CHROME_STYLE}</style>

      <PageBanner profile={profile} title="Gallery" subtitle="A look at our recent work." />

      <div className="px-16 max-sm:px-5" style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 64px" }}>
        {images.length === 0 ? (
          <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: "#666", margin: 0 }}>No portfolio photos yet.</p>
          </div>
        ) : (
          <>
            <div className="salon-gallery-grid">
              {visible.map((img, i) => (
                <div
                  key={img.id}
                  onClick={() => setLightboxIdx(i)}
                  style={{ borderRadius: 8, overflow: "hidden", cursor: "pointer", position: "relative", aspectRatio: "1 / 1" }}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.caption || "Portfolio"}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  />
                  {(img.caption || img.serviceName) && (
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px 8px 6px", background: "linear-gradient(transparent, rgba(0,0,0,0.65))", pointerEvents: "none" }}>
                      {img.serviceName && (
                        <span style={{ display: "inline-block", fontFamily: sans, fontSize: 9, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", color: "#fff", backgroundColor: `rgba(${PRIMARY_RGB},0.85)`, padding: "2px 6px", borderRadius: 3, marginBottom: 3 }}>
                          {img.serviceName}
                        </span>
                      )}
                      {img.caption && (
                        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {img.caption}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setShowAll(true)}
                style={{ display: "block", margin: "20px auto 0", background: "none", border: `0.5px solid ${BORDER}`, padding: "10px 24px", cursor: "pointer", fontFamily: sans, fontSize: 12, fontWeight: 300, color: PRIMARY, letterSpacing: "0.06em", borderRadius: 10 }}
              >
                See all photos ({images.length})
              </button>
            )}
          </>
        )}
      </div>

      {lightboxIdx !== null && <Lightbox images={visible} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}

      <SalonFooter profile={profile} />
      <ChatFab chat={chat} salonName={profile.businessName} />
    </div>
  );
}
