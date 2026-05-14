import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { ApolloClient, InMemoryCache, ApolloLink, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getToken } from '../lib/auth'

// Extract subdomain from hostname: "glow.localhost" → "glow", "localhost" → null
export function getSubdomain() {
  const parts = window.location.hostname.split('.')
  if (parts.length > 1 && parts[parts.length - 1] === 'localhost') {
    return parts[0]
  }
  return null
}

function useTenantClient(slug) {
  return useMemo(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'localhost:8000'
    const uri = `http://${slug}.${baseUrl}/graphql/`
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
