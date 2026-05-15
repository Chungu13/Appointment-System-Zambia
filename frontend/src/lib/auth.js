const TOKEN_KEY = 'bb_access_token'
const REFRESH_KEY = 'bb_refresh_token'
const ROLE_KEY = 'bb_user_role'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(accessToken, refreshToken) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function saveRole(role) {
  if (role) localStorage.setItem(ROLE_KEY, role)
  else localStorage.removeItem(ROLE_KEY)
}

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function isTokenExpired(token) {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  return Date.now() / 1000 > payload.exp
}

/** Extract role embedded in the JWT payload (tokens issued after the backend update). */
export function getRoleFromToken(token) {
  const payload = decodeToken(token)
  return payload?.role || null
}

export function isAuthenticated() {
  const token = getToken()
  return !!token && !isTokenExpired(token)
}
