import { createContext, useContext, useState } from 'react'

const SignupContext = createContext(null)

export function SignupProvider({ children }) {
  const [step1, setStep1] = useState({
    fullName: '',
    email: '',
    password: '',
    agreedToTerms: false,
    isGoogle: false,
    googleToken: '',
    honeypot: '',
    turnstileToken: '',
  })

  return (
    <SignupContext.Provider value={{ step1, setStep1 }}>
      {children}
    </SignupContext.Provider>
  )
}

export function useSignup() {
  const ctx = useContext(SignupContext)
  if (!ctx) throw new Error('useSignup must be used inside SignupProvider')
  return ctx
}
