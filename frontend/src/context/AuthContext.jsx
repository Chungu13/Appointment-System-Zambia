import { createContext, useContext, useState, useCallback } from 'react'
import { useQuery } from '@apollo/client/react'
import { setTokens, clearToken, getToken, isTokenExpired, getRoleFromToken, saveRole, getStoredRole } from '../lib/auth'
import { MY_PROFILE } from '../graphql/queries/staff'

const AuthContext = createContext(null)

/** Best-effort role from token or localStorage — available synchronously on page load. */
function getInitialRole() {
  const t = getToken()
  if (!t || isTokenExpired(t)) return null
  return getRoleFromToken(t) || getStoredRole() || null
}

/**
 * Fetches MY_PROFILE eagerly when we have a valid token but couldn't determine
 * the role synchronously (old token issued before role was embedded in the JWT).
 */
function ProfileLoader({ onProfile }) {
  useQuery(MY_PROFILE, {
    fetchPolicy: 'network-only',
    onCompleted: (d) => { if (d?.myProfile) onProfile(d.myProfile) },
    onError: () => {},
  })
  return null
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    // Consume ?t= and ?r= URL params — handles cross-origin handoff (onboarding → owner dashboard).
    // Must run before ProtectedRoute evaluates isAuthenticated.
    const params = new URLSearchParams(window.location.search)
    const urlT = params.get('t')
    const urlR = params.get('r')
    if (urlT && urlR && !isTokenExpired(urlT)) {
      setTokens(urlT, urlR)
      params.delete('t')
      params.delete('r')
      const remaining = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (remaining ? '?' + remaining : ''))
      return urlT
    }
    const t = getToken()
    return t && !isTokenExpired(t) ? t : null
  })

  // Role resolved in priority order: JWT payload → localStorage → ProfileLoader fetch
  const [role, setRole] = useState(getInitialRole)
  const [profile, _setProfile] = useState(null)

  const setProfile = useCallback((p) => {
    _setProfile(p)
    if (p?.role) {
      saveRole(p.role)
      setRole(p.role)
    }
  }, [])

  const login = useCallback((accessToken, refreshToken, userData) => {
    setTokens(accessToken, refreshToken)
    setToken(accessToken)
    _setProfile(userData ?? null)
    if (userData?.role) {
      saveRole(userData.role)
      setRole(userData.role)
    } else {
      // Fallback: role embedded in the new token
      const r = getRoleFromToken(accessToken)
      if (r) { saveRole(r); setRole(r) }
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setToken(null)
    _setProfile(null)
    setRole(null)
  }, [])

  const isAuthenticated = !!token && !isTokenExpired(token)
  const isOwner = role === 'OWNER' || role === 'owner'
  const isStaff = role === 'STAFF' || role === 'staff'
  const isAlsoStaff = !!(profile?.isAlsoStaff)
  // True only while we have a token but haven't resolved the role yet
  const authLoading = isAuthenticated && role === null

  return (
    <AuthContext.Provider
      value={{ token, profile, setProfile, login, logout, isAuthenticated, isOwner, isStaff, isAlsoStaff, authLoading }}
    >
      {/* Eagerly resolve role for sessions with old tokens (no role in JWT, none in localStorage) */}
      {authLoading && <ProfileLoader onProfile={setProfile} />}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
