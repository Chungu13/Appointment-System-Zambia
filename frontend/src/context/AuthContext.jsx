import { createContext, useContext, useState, useCallback } from 'react'
import { setTokens, clearToken, getToken, decodeToken, isTokenExpired } from '../lib/auth'

const AuthContext = createContext(null)

function userFromToken(token) {
  const payload = decodeToken(token)
  if (!payload) return null
  return { id: payload.user_id }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = getToken()
    return t && !isTokenExpired(t) ? t : null
  })
  const [user, setUser] = useState(() => {
    const t = getToken()
    return t && !isTokenExpired(t) ? userFromToken(t) : null
  })
  const [profile, setProfile] = useState(null)

  const login = useCallback((accessToken, refreshToken, userData) => {
    setTokens(accessToken, refreshToken)
    setToken(accessToken)
    setUser(userData ?? userFromToken(accessToken))
    setProfile(userData ?? null)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setToken(null)
    setUser(null)
    setProfile(null)
  }, [])

  const isAuthenticated = !!token && !isTokenExpired(token)
  const isOwner = profile?.role === 'OWNER' || profile?.role === 'owner'
  const isStaff = profile?.role === 'STAFF' || profile?.role === 'staff'

  return (
    <AuthContext.Provider
      value={{ token, user, profile, setProfile, login, logout, isAuthenticated, isOwner, isStaff }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
