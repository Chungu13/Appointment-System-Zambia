import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import './tour.css'

const TOUR_KEY = 'kimawa_tour_done'

export const isTourDone = () => !!localStorage.getItem(TOUR_KEY)
export const resetTour  = () => localStorage.removeItem(TOUR_KEY)

const isMobile = () => window.innerWidth < 640

const DESKTOP_STEPS = [
  {
    element: '#tour-dashboard',
    popover: {
      title: 'Your dashboard',
      description: "This is your business home: today's revenue, bookings, and a live feed of everything your AI agents are doing.",
      side: 'right', align: 'start',
    },
  },
  {
    element: '#tour-checklist',
    popover: {
      title: 'Getting started',
      description: 'Complete these steps to go live. The checklist tracks your real setup. It checks off automatically as you add services, staff, and hours.',
      side: 'bottom', align: 'start',
    },
  },
  {
    element: '#tour-calendar',
    popover: {
      title: 'Your calendar',
      description: 'Every booking appears here. You can view by week or day, mark appointments as done, and see your full schedule at a glance.',
      side: 'right', align: 'start',
    },
  },
  {
    element: '#tour-activity',
    popover: {
      title: 'AI activity',
      description: 'A live log of every action your AI agents take: bookings made, deposits chased, slots recovered, and weekly insights.',
      side: 'right', align: 'start',
    },
  },
  {
    element: '#tour-services',
    popover: {
      title: 'Your services',
      description: 'Add every service you offer with a name, price in ZMW, duration, and deposit amount. Customers see this on your public page.',
      side: 'right', align: 'start',
    },
  },
  {
    element: '#tour-portfolio',
    popover: {
      title: 'Your portfolio',
      description: 'Upload photos of your work. Your portfolio shows on your public booking page and helps customers decide to book.',
      side: 'right', align: 'start',
    },
  },
  {
    element: '#tour-staff',
    popover: {
      title: 'Your team',
      description: 'Add your staff, assign which services each person does, and set their working hours. Without this, no booking slots are available.',
      side: 'right', align: 'start',
    },
  },
  {
    element: '#tour-customers',
    popover: {
      title: 'Your customers',
      description: "Everyone who has booked with you. The system automatically tracks visit history and no-shows so your AI can serve them better.",
      side: 'right', align: 'start',
    },
  },
  {
    element: '#tour-settings',
    popover: {
      title: 'Settings',
      description: 'Update your location, cover photo, staff access key, and business policies. Your policies are loaded into your AI agent so it gives accurate answers.',
      side: 'right', align: 'start',
    },
  },
]

const MOBILE_STEPS = [
  {
    element: '#tour-dashboard-m',
    popover: {
      title: 'Your dashboard',
      description: "Your business home: today's revenue, bookings, and a live feed of everything your AI agents are doing.",
      side: 'top', align: 'center',
    },
  },
  {
    element: '#tour-checklist',
    popover: {
      title: 'Getting started',
      description: 'Complete these steps to go live. It checks off automatically as you add services, staff, and hours.',
      side: 'bottom', align: 'start',
    },
  },
  {
    element: '#tour-calendar-m',
    popover: {
      title: 'Your calendar',
      description: 'Every booking appears here. View by week or day, mark appointments as done, and see your full schedule.',
      side: 'top', align: 'center',
    },
  },
  {
    popover: {
      title: 'AI activity',
      description: "Tap More → Activity to see a live log of every action your AI agents take: bookings made, deposits chased, and weekly insights.",
    },
  },
  {
    element: '#tour-services-m',
    popover: {
      title: 'Your services',
      description: 'Add every service you offer with a name, price in ZMW, duration, and deposit amount. Customers see this on your public page.',
      side: 'top', align: 'center',
    },
  },
  {
    popover: {
      title: 'Your portfolio',
      description: "Tap More → Portfolio to upload photos of your work. Your portfolio shows on your public booking page and helps customers decide to book.",
    },
  },
  {
    popover: {
      title: 'Your team',
      description: "Tap More → Staff to add your staff, assign services, and set working hours. Without this, no booking slots are available.",
    },
  },
  {
    element: '#tour-customers-m',
    popover: {
      title: 'Your customers',
      description: "Everyone who has booked with you. The system automatically tracks visit history and no-shows so your AI can serve them better.",
      side: 'top', align: 'center',
    },
  },
  {
    popover: {
      title: 'Settings',
      description: "Tap More → Settings to update your location, cover photo, staff access key, and business policies.",
    },
  },
]

export function startTour() {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayClickBehavior: 'close',
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    onDestroyed: () => {
      localStorage.setItem(TOUR_KEY, '1')
    },
    steps: isMobile() ? MOBILE_STEPS : DESKTOP_STEPS,
  })

  driverObj.drive()
  return driverObj
}
