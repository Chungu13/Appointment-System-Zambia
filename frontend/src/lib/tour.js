import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import './tour.css'

const TOUR_KEY = 'kimawa_tour_done'

export const isTourDone = () => !!localStorage.getItem(TOUR_KEY)
export const resetTour  = () => localStorage.removeItem(TOUR_KEY)

export function startTour() {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayClickBehavior: 'close',
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Done',
    onDestroyed: () => {
      localStorage.setItem(TOUR_KEY, '1')
    },
    steps: [
      {
        element: '#tour-services',
        popover: {
          title: 'Your Services',
          description: 'Add every service you offer — name, price, and duration. This is what customers can book.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-staff',
        popover: {
          title: 'Your Team',
          description: 'Add your staff and assign which services each person performs. Bookings need this to work.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-calendar',
        popover: {
          title: 'Your Calendar',
          description: 'All bookings appear here. Manage appointments, mark no-shows, and track your schedule.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-book-btn',
        popover: {
          title: 'Book an Appointment',
          description: 'Use this for walk-ins or phone bookings. Customers can also book themselves through your public booking page.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-settings',
        popover: {
          title: 'Settings',
          description: 'Your booking link lives here — share it with customers so they can book anytime. Also manage your business policies.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  })

  driverObj.drive()
  return driverObj
}
