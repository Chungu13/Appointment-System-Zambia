import { createContext, useContext, useReducer } from 'react'

const BookingContext = createContext(null)

const initialState = {
  step: 1,          // 1=service, 2=datetime, 3=details, 4=payment
  salonSlug: null,
  service: null,    // { id, name, durationMinutes, priceZmw, depositZmw }
  slot: null,       // { startsAt, endsAt, staff: { id, fullName } }
  customer: {
    name: '',
    phone: '',
    notes: '',
  },
  appointment: null, // result from createBooking
  depositRequired: 0,
  payment: null,     // result from initiatePayment
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SALON':
      return { ...initialState, salonSlug: action.payload }
    case 'SELECT_SERVICE':
      return { ...state, step: 2, service: action.payload }
    case 'SELECT_SLOT':
      return { ...state, step: 3, slot: action.payload }
    case 'SET_CUSTOMER':
      return { ...state, customer: { ...state.customer, ...action.payload } }
    case 'SET_APPOINTMENT':
      return {
        ...state,
        step: 4,
        appointment: action.payload.appointment,
        depositRequired: action.payload.depositRequired,
      }
    case 'SET_PAYMENT':
      return { ...state, payment: action.payload }
    case 'PREV_STEP':
      return { ...state, step: Math.max(1, state.step - 1) }
    case 'RESET':
      return { ...initialState, salonSlug: state.salonSlug }
    default:
      return state
  }
}

export function BookingProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <BookingContext.Provider value={{ state, dispatch }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider')
  return ctx
}
