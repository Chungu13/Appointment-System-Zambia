import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { ApolloClient, InMemoryCache, ApolloLink, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getToken } from '../lib/auth'

// Subdomains that are infrastructure, not tenants.
// If the first segment matches one of these, treat the host as the public/apex site.
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'app', 'admin', 'mail', 'smtp', 'ftp', 'cdn'])

// Extract tenant slug from hostname.
// "glow.kimawa.pro"   → "glow"   (tenant)
// "glow.localhost"    → "glow"   (local dev tenant)
// "www.kimawa.pro"    → null     (reserved — public site)
// "api.kimawa.pro"    → null     (reserved — backend)
// "kimawa.pro"        → null     (apex — no subdomain)
// "localhost"         → null     (plain dev, no tenant)
export function getSubdomain() {
  const { hostname } = window.location
  const parts = hostname.split('.')
  // 3+ parts means sub.domain.tld — extract the subdomain
  // 2 parts ending in "localhost" is the local dev case (glow.localhost)
  const sub =
    parts.length >= 3 ? parts[0] :
    parts.length === 2 && parts[1] === 'localhost' ? parts[0] :
    null
  if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null
  return sub
}

function useTenantClient(slug) {
  return useMemo(() => {
    const apiDomain = import.meta.env.VITE_TENANT_API_DOMAIN
    const uri = apiDomain
      ? `https://${slug}.${apiDomain}/graphql/`
      : `http://${slug}.localhost:8000/graphql/`
    const authLink = setContext((_, { headers }) => {
      const token = getToken()
      return {
        headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      }
    })
    return new ApolloClient({
      link: ApolloLink.from([authLink, createHttpLink({ uri })]),
      cache: new InMemoryCache(),
    })
  }, [slug])
}

export default function TenantRoute({ children, slug: slugProp }) {
  const { salonSlug: pathSlug } = useParams()
  // Subdomain always wins; path param is fallback for plain localhost dev
  const slug = slugProp ?? getSubdomain() ?? pathSlug
  const client = useTenantClient(slug)
  return <ApolloProvider client={client}>{children}</ApolloProvider>
}
