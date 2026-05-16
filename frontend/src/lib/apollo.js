import { ApolloClient, InMemoryCache, ApolloLink, createHttpLink, Observable } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { getToken, getRefreshToken, setTokens, clearToken } from './auth'

const PUBLIC_API_URL =
  import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:8000/graphql/'

// Derive tenant API URL from the current hostname so any new tenant's
// subdomain (e.g. mynails.localhost:3000) hits the right backend schema.
const TENANT_API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  const { hostname } = window.location
  if (hostname === 'localhost') return 'http://localhost:8000/graphql/'
  if (import.meta.env.DEV) return `http://${hostname}:8000/graphql/`
  return `https://${hostname}/graphql/`
})()

// ── Silent refresh — raw fetch to avoid circular Apollo dependency ────────────
async function doRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('no refresh token')

  const resp = await fetch(TENANT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation RefreshToken($refreshToken: String!) {
        refreshToken(refreshToken: $refreshToken) {
          accessToken refreshToken
        }
      }`,
      variables: { refreshToken },
    }),
  })

  const json = await resp.json()
  const data = json?.data?.refreshToken
  if (!data?.accessToken) throw new Error('refresh failed')
  setTokens(data.accessToken, data.refreshToken)
}

// ── Auth link — adds Bearer token to every request ──────────────────────────
const authLink = setContext((_, { headers }) => {
  const token = getToken()
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
})

// ── Error link — silent refresh on 401, then retry, then redirect ────────────
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  const isAuthError =
    (networkError && networkError.statusCode === 401) ||
    graphQLErrors?.some((e) => e.message.toLowerCase().includes('not authenticated'))

  if (!isAuthError) return

  // Don't retry the refresh itself to avoid loops
  if (operation.operationName === 'RefreshToken') {
    clearToken()
    window.location.href = '/login'
    return
  }

  return new Observable((observer) => {
    doRefresh()
      .then(() => {
        const sub = forward(operation).subscribe({
          next: (v) => observer.next(v),
          error: (e) => observer.error(e),
          complete: () => observer.complete(),
        })
        return () => sub.unsubscribe()
      })
      .catch(() => {
        clearToken()
        window.location.href = '/login'
        observer.complete()
      })
  })
})

// ── Tenant client — for all business queries ─────────────────────────────────
const tenantHttpLink = createHttpLink({ uri: TENANT_API_URL })

export const tenantClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, tenantHttpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query: { errorPolicy: 'all' },
  },
})

// ── Public client — for salon directory (no auth) ────────────────────────────
const publicHttpLink = createHttpLink({ uri: PUBLIC_API_URL })

export const publicClient = new ApolloClient({
  link: publicHttpLink,
  cache: new InMemoryCache(),
})

export default tenantClient
