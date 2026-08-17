import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronDown } from "lucide-react";
import { PageBanner, SalonFooter, ChatFab, CHROME_STYLE } from "./salon/SalonChrome";
import { useSalonProfile } from "./salon/useSalonProfile";
import { useChatFab } from "./salon/useChatFab";
import { PRIMARY, DARK, BORDER, CREAM, sans } from "./salon/theme";

function PolicyAccordionItem({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", backgroundColor: "#fff" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "none", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: DARK }}>{title}</span>
        <ChevronDown size={16} style={{ color: "#999", transition: "transform 0.18s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

function PolicyList({ items }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((t, i) => (
        <li key={i} style={{ fontFamily: sans, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
          {t}
        </li>
      ))}
    </ul>
  );
}

export default function SalonPolicies() {
  const { profile, screen } = useSalonProfile();
  const chat = useChatFab();

  if (screen) return screen;

  const p = profile.businessPolicies || {};
  const joined = (v) => (Array.isArray(v) ? v.join(", ") : v || "");

  const cancelItems = [
    p.cancellationPolicy?.length && `Cancellations: ${joined(p.cancellationPolicy)}`,
    p.lateArrivalPolicy?.length && `Late arrivals: ${joined(p.lateArrivalPolicy)}`,
    p.lateFee?.length && `Late fee: ${joined(p.lateFee)}`,
    p.waitingTime?.length && `We'll hold your slot for: ${joined(p.waitingTime)}`,
  ].filter(Boolean);

  const bookingItems = [
    p.depositPolicy?.length && `Deposit: ${joined(p.depositPolicy)}`,
    p.balancePaymentMethod?.length && `Balance payment: ${joined(p.balancePaymentMethod)}`,
    p.walkIns?.length && `Walk-ins: ${joined(p.walkIns)}`,
    p.whatToBring?.length ? `What to bring: ${joined(p.whatToBring)}` : null,
  ].filter(Boolean);

  const refundItems = p.refundPolicy?.length ? [joined(p.refundPolicy)] : [];

  const contactItems = [
    p.howToFindUs && `Getting here: ${p.howToFindUs}`,
    p.contactPreference?.length && `Preferred contact: ${joined(p.contactPreference)}`,
    p.additionalInfo,
  ].filter(Boolean);

  const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN;
  const privacyUrl = appDomain ? `https://${appDomain}/privacy` : "/privacy";
  const termsUrl = appDomain ? `https://${appDomain}/business-terms` : "/business-terms";
  const waHref = profile.phone ? `https://wa.me/${profile.phone.replace(/\D/g, "")}` : null;

  const linkRowStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px",
    border: `0.5px solid ${BORDER}`, borderRadius: 10, backgroundColor: "#fff",
    fontFamily: sans, fontSize: 14, fontWeight: 500, color: DARK, textDecoration: "none",
  };

  return (
    <div style={{ backgroundColor: "#fff" }}>
      <Helmet>
        <title>{`Policies | ${profile.businessName}`}</title>
      </Helmet>
      <style>{CHROME_STYLE}</style>

      <PageBanner profile={profile} title="Good to Know" subtitle="Everything about booking, deposits, and cancellations, in plain language." />

      <div className="salon-container salon-fab-clear" style={{ paddingTop: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 720 }}>
          {cancelItems.length > 0 && (
            <PolicyAccordionItem title="Cancellations & No-Shows" defaultOpen>
              <PolicyList items={cancelItems} />
            </PolicyAccordionItem>
          )}
          {bookingItems.length > 0 && (
            <PolicyAccordionItem title="Booking & Deposits">
              <PolicyList items={bookingItems} />
            </PolicyAccordionItem>
          )}
          {refundItems.length > 0 && (
            <PolicyAccordionItem title="Refunds">
              <p style={{ fontFamily: sans, fontSize: 13, color: "#555", lineHeight: 1.6, margin: 0 }}>{p.refundPolicy}</p>
            </PolicyAccordionItem>
          )}
          {contactItems.length > 0 && (
            <PolicyAccordionItem title="Getting Here & Contact">
              <PolicyList items={contactItems} />
            </PolicyAccordionItem>
          )}
          <a href={privacyUrl} target="_blank" rel="noopener noreferrer" style={linkRowStyle}>
            Privacy Policy
          </a>
          <a href={termsUrl} target="_blank" rel="noopener noreferrer" style={linkRowStyle}>
            Terms of Service
          </a>
        </div>

        {waHref && (
          <div style={{ marginTop: 24, padding: "20px 24px", border: `0.5px solid ${BORDER}`, borderRadius: 10, backgroundColor: CREAM, maxWidth: 720, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: DARK, margin: "0 0 3px" }}>Still have a question?</p>
              <p style={{ fontFamily: sans, fontSize: 12, color: "#7a6a5a", margin: 0 }}>We're happy to help clear anything up.</p>
            </div>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: "#fff", backgroundColor: PRIMARY, padding: "10px 20px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Message us on WhatsApp
            </a>
          </div>
        )}
      </div>

      <SalonFooter profile={profile} />
      <ChatFab chat={chat} profile={profile} />
    </div>
  );
}
