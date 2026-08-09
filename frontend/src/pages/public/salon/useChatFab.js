import { useState } from "react";
import { playPopSound } from "../../../lib/sounds";

// Booking always happens in the same in-page chat widget, regardless of
// which storefront page (Home/Services/Gallery/Stylists/Policies) it was
// opened from — there's no separate "booking page" to route to.
export function useChatFab() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [chatInitMsg, setChatInitMsg] = useState("");
  const [chatSkipIntake, setChatSkipIntake] = useState(false);
  const [chatConfirmedBooking, setChatConfirmedBooking] = useState(null);
  const [chatReferenceService, setChatReferenceService] = useState(null);

  function openChat(msg = "", skipIntake = false, referenceService = null) {
    setChatKey((k) => k + 1);
    setChatInitMsg(msg);
    setChatSkipIntake(skipIntake);
    setChatReferenceService(referenceService);
    playPopSound();
    setChatOpen(true);
  }

  return {
    chatOpen,
    setChatOpen,
    chatKey,
    chatInitMsg,
    chatSkipIntake,
    chatConfirmedBooking,
    setChatConfirmedBooking,
    chatReferenceService,
    openChat,
  };
}
