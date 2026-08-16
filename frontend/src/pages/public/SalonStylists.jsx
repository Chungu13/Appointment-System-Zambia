import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { PageBanner, SalonFooter, ChatFab, CHROME_STYLE } from "./salon/SalonChrome";
import { useSalonProfile } from "./salon/useSalonProfile";
import { useChatFab } from "./salon/useChatFab";
import { PRIMARY, CREAM, BORDER, GOLD, DARK, sans, initials } from "./salon/theme";

function StylistCard({ member, onBook }) {
  const [expanded, setExpanded] = useState(false);
  const hasBio = !!member.bio?.trim();
  const tags = (member.serviceNames || []).slice(0, 4);

  return (
    <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 20, display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", backgroundColor: "#fff" }}>
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.fullName}
          loading="lazy"
          width={72}
          height={72}
          style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0, display: "block" }}
        />
      ) : (
        <div style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: CREAM, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: sans, fontSize: 22, fontWeight: 500, color: PRIMARY, lineHeight: 1 }}>{initials(member.fullName)}</span>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 180 }}>
        <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: DARK, margin: "0 0 6px" }}>{member.fullName}</p>
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: hasBio ? 8 : 0 }}>
            {tags.map((t) => (
              <span key={t} style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, color: GOLD, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "3px 10px" }}>
                {t}
              </span>
            ))}
          </div>
        )}
        {hasBio && (
          <p
            onClick={() => setExpanded((v) => !v)}
            style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: "#777", lineHeight: 1.6, margin: 0, cursor: "pointer", maxHeight: expanded ? 200 : 16, overflow: "hidden", transition: "max-height 0.18s ease" }}
          >
            {member.bio}
          </p>
        )}
      </div>

      <button
        onClick={() => onBook(`I want to book with ${member.fullName}`, false, null)}
        style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: "#fff", background: PRIMARY, border: "none", cursor: "pointer", padding: "9px 18px", borderRadius: 10, letterSpacing: "0.04em", whiteSpace: "nowrap", flexShrink: 0 }}
      >
        Book {member.fullName.split(" ")[0]}
      </button>
    </div>
  );
}

export default function SalonStylists() {
  const { profile, screen } = useSalonProfile();
  const chat = useChatFab();

  if (screen) return screen;

  const visible = (profile.staff ?? []).filter((m) => m.displayOnPublicPage);

  return (
    <div style={{ backgroundColor: "#fff" }}>
      <Helmet>
        <title>{`Stylists | ${profile.businessName}`}</title>
      </Helmet>
      <style>{CHROME_STYLE}</style>

      <PageBanner profile={profile} title="Meet the Team" subtitle="The hands behind every appointment." />

      <div className="salon-container salon-fab-clear" style={{ paddingTop: 48 }}>
        {visible.length === 0 ? (
          <p style={{ fontFamily: sans, fontSize: 13, color: "#7a6a5a" }}>No team members listed yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {visible.map((member) => (
              <StylistCard key={member.id} member={member} onBook={chat.openChat} />
            ))}
          </div>
        )}
      </div>

      <SalonFooter profile={profile} />
      <ChatFab chat={chat} profile={profile} />
    </div>
  );
}
