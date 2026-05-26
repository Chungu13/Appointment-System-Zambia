import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { ApolloClient, InMemoryCache, ApolloLink, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getToken } from '../lib/auth'

// Extract subdomain from hostname.
// "glow.localhost"    → "glow"   (local dev)
// "glow.kimawa.pro"   → "glow"   (production subdomain)
// "localhost"         → null
// "kimawa.pro"        → null     (apex — no tenant)
export function getSubdomain() {
  const { hostname } = window.location
  const parts = hostname.split('.')
  // Need at least 3 parts (sub.domain.tld) to have a meaningful subdomain.
  // "glow.localhost" is a special 2-part case handled separately.
  if (parts.length >= 3) return parts[0]
  if (parts.length === 2 && parts[1] === 'localhost') return parts[0]
  return null
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
