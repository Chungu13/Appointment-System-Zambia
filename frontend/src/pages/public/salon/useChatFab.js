import { useState } from "react";
import { playPopSound } from "../../../lib/sounds";

// Booking happens in the same in-page panel from every storefront page
// (Home/Services/Gallery/Stylists/Policies). The panel runs the deterministic
// wizard — no AI is involved in booking.
//
// The signature keeps the old (message, skipIntake, service) shape so the
// storefront call sites did not all have to change; only the service is used.
export function useChatFab() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingKey, setBookingKey] = useState(0);
  const [bookingService, setBookingService] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  function openChat(_msg = "", _skipIntake = false, service = null) {
    setBookingKey((k) => k + 1);   // remount so a second booking starts clean
    setBookingService(service);
    setConfirmedBooking(null);
    playPopSound();
    setBookingOpen(true);
  }

  // Deposit bookings leave the site to pay, then land back here. Reopen the
  // panel straight onto the confirmation so the customer can see the booking
  // actually went through.
  function showConfirmedBooking(booking) {
    setBookingKey((k) => k + 1);
    setBookingService(null);
    setConfirmedBooking(booking);
    playPopSound();
    setBookingOpen(true);
  }

  return {
    bookingOpen,
    setBookingOpen,
    bookingKey,
    bookingService,
    confirmedBooking,
    openChat,
    showConfirmedBooking,
    closeBooking: () => setBookingOpen(false),
  };
}
