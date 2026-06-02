import { useState, useMemo } from 'react'
import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink, gql } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const PRIMARY = '#6B2737'
const sans    = 'Inter, ui-sans-serif, system-ui, sans-serif'

const CONFIRM_DUMMY_PAYMENT = gql`
  mutation ConfirmDummyPayment($paymentRef: String!) {
    confirmDummyPayment(paymentRef: $paymentRef) {
      success
      appointmentId
      serviceName
      startsAt
      staffName
    }
  }
`

function usePayParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    ref:     p.get('ref')     || '',
    amount:  p.get('amount')  || '',
    service: p.get('service') || '',
    salon:   p.get('salon')   || '',
    slug:    p.get('slug')    || '',
  }
}

function useTenantClient(slug) {
  return useMemo(() => {
    if (!slug) return null
    const apiDomain = import.meta.env.VITE_TENANT_API_DOMAIN
    const uri = apiDomain
      ? `https://${slug}.${apiDomain}/graphql/`
      : `http://${slug}.localhost:8000/graphql/`
    return new ApolloClient({
      link: ApolloLink.from([
        setContext((_, { headers }) => ({ headers })),
        createHttpLink({ uri }),
      ]),
      cache: new InMemoryCache(),
    })
  }, [slug])
}

export default function DummyPayment() {
  const { ref, amount, service, salon, slug } = usePayParams()
  const tenantClient = useTenantClient(slug)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  async function handleConfirm() {
    if (!tenantClient || !ref) return
    setStatus('loading')
    try {
      const { data } = await tenantClient.mutate({
        mutation: CONFIRM_DUMMY_PAYMENT,
        variables: { paymentRef: ref },
      })
      if (data?.confirmDummyPayment?.success) {
        const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN
        const port = window.location.port || '3000'
        const tenantBase = appDomain
          ? `https://${slug}.${appDomain}`
          : `http://${slug}.localhost:${port}`
        const dest = new URL(tenantBase)
        dest.searchParams.set('payment_success', ref)
        dest.searchParams.set('service', service)
        window.location.href = dest.toString()
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err?.graphQLErrors?.[0]?.message || err?.message || 'Something went wrong.')
    }
  }

  const missing = !ref || !slug

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: sans, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '20px 32px', borderBottom: '0.5px solid #e0dbd6' }}>
        <span style={{ fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>Kimawa</span>
      </header>

      {/* Centered card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: PRIMARY, marginBottom: 12 }}>
            Booking payment
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 500, color: '#1a1a1a', margin: '0 0 24px', lineHeight: 1.2 }}>
            Complete your booking
          </h1>

          {/* Service summary */}
          <div style={{ border: '0.5px solid #e0dbd6', borderRadius: 8, padding: '20px 20px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', margin: '0 0 4px' }}>
              {service || 'Service'}
            </p>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>{salon || 'Salon'}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 500, color: '#1a1a1a' }}>ZMW {amount}</span>
              <span style={{ fontSize: 12, color: '#999' }}>deposit</span>
            </div>
          </div>

          {/* Test mode banner */}
          <div style={{ backgroundColor: '#fef9c3', border: '0.5px solid #fde68a', borderRadius: 6, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#92400e' }}>TEST MODE — No real payment will be charged</span>
          </div>

          {missing && (
            <div style={{ border: '0.5px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
              Missing payment details. Please return to the booking chat.
            </div>
          )}

          {status === 'error' && (
            <div style={{ border: '0.5px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={missing || status === 'loading'}
            style={{
              width: '100%', padding: '14px', backgroundColor: PRIMARY, color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500,
              cursor: missing || status === 'loading' ? 'default' : 'pointer',
              opacity: missing || status === 'loading' ? 0.7 : 1,
              fontFamily: sans, marginBottom: 12,
            }}
          >
            {status === 'loading' ? 'Confirming…' : `Confirm Payment — ZMW ${amount}`}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#999' }}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.history.back() }}
              style={{ color: '#999', textDecoration: 'none' }}
            >
              Cancel and go back
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
