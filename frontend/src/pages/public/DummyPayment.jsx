import { useState, useEffect, useMemo } from 'react'
import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink, gql } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const PRIMARY = '#6B2737'
const sans    = 'Inter, ui-sans-serif, system-ui, sans-serif'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const CHECK_PAYMENT_STATUS = gql`
  query CheckPaymentStatus($ref: String!) {
    checkPaymentStatus(ref: $ref) {
      status
      providerRef
    }
  }
`

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function usePayParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    ref:      p.get('ref')      || '',
    amount:   p.get('amount')   || '',
    service:  p.get('service')  || '',
    salon:    p.get('salon')    || '',
    slug:     p.get('slug')     || '',
    date:     p.get('date')     || '',
    time:     p.get('time')     || '',
    staff:    p.get('staff')    || '',
    customer: p.get('customer') || '',
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DummyPayment() {
  const { ref, amount, service, salon, slug, date, time, staff, customer } = usePayParams()
  const tenantClient = useTenantClient(slug)

  // 'checking' | 'redirecting' | 'mock' | 'polling' | 'error'
  const [phase, setPhase] = useState('checking')
  const [errorMsg, setErrorMsg] = useState('')

  // ── On mount: check if this is a Lipila payment ──────────────────────────
  useEffect(() => {
    if (!tenantClient || !ref) { setPhase('mock'); return }

    tenantClient.query({
      query: CHECK_PAYMENT_STATUS,
      variables: { ref },
      fetchPolicy: 'network-only',
    }).then(({ data }) => {
      const providerRef = data?.checkPaymentStatus?.providerRef || ''

      if (providerRef.startsWith('http')) {
        // Lipila checkout URL — redirect the customer there immediately
        setPhase('redirecting')
        window.location.href = providerRef
      } else {
        // No external checkout URL — show mock confirm UI
        setPhase('mock')
      }
    }).catch(() => {
      // Fall back to mock UI if query fails
      setPhase('mock')
    })
  }, [tenantClient, ref]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mock confirm ──────────────────────────────────────────────────────────
  async function handleMockConfirm() {
    if (!tenantClient || !ref) return
    setPhase('polling')
    try {
      const { data } = await tenantClient.mutate({
        mutation: CONFIRM_DUMMY_PAYMENT,
        variables: { paymentRef: ref },
      })
      if (data?.confirmDummyPayment?.success) {
        redirectToSalon()
      }
    } catch (err) {
      setPhase('error')
      setErrorMsg(err?.graphQLErrors?.[0]?.message || err?.message || 'Something went wrong.')
    }
  }

  function redirectToSalon() {
    const appDomain = import.meta.env.VITE_TENANT_APP_DOMAIN
    const port = window.location.port || '3000'
    const tenantBase = appDomain
      ? `https://${slug}.${appDomain}`
      : `http://${slug}.localhost:${port}`
    const dest = new URL(tenantBase)
    dest.searchParams.set('payment_success', ref)
    dest.searchParams.set('service', service)
    dest.searchParams.set('amount', amount)
    if (date)     dest.searchParams.set('appt_date', date)
    if (time)     dest.searchParams.set('appt_time', time)
    if (staff)    dest.searchParams.set('appt_staff', staff)
    if (customer) dest.searchParams.set('appt_customer', customer)
    window.location.href = dest.toString()
  }

  const missing = !ref || !slug

  // ── UI ────────────────────────────────────────────────────────────────────

  const card = (content) => (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: sans, display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px 32px', borderBottom: '0.5px solid #e0dbd6' }}>
        <span style={{ fontSize: 18, fontWeight: 500, color: '#1a1a1a' }}>Kimawa</span>
      </header>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>{content}</div>
      </div>
    </div>
  )

  // Checking / redirecting to Lipila
  if (phase === 'checking' || phase === 'redirecting') {
    return card(
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `3px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ fontSize: 14, color: '#555' }}>
          {phase === 'redirecting' ? 'Redirecting to payment page…' : 'Loading…'}
        </p>
      </div>
    )
  }

  // Mock confirm UI (TEST MODE)
  return card(
    <>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: PRIMARY, marginBottom: 12 }}>
        Booking payment
      </p>
      <h1 style={{ fontSize: 24, fontWeight: 500, color: '#1a1a1a', margin: '0 0 24px', lineHeight: 1.2 }}>
        Complete your booking
      </h1>

      {/* Service summary */}
      <div style={{ border: '0.5px solid #e0dbd6', borderRadius: 8, padding: '20px 20px 16px', marginBottom: 16 }}>
        <p style={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', margin: '0 0 4px' }}>{service || 'Service'}</p>
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

      {phase === 'error' && (
        <div style={{ border: '0.5px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
          {errorMsg}
        </div>
      )}

      <button
        onClick={handleMockConfirm}
        disabled={missing || phase === 'polling'}
        style={{
          width: '100%', padding: '14px', backgroundColor: PRIMARY, color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500,
          cursor: missing || phase === 'polling' ? 'default' : 'pointer',
          opacity: missing || phase === 'polling' ? 0.7 : 1,
          fontFamily: sans, marginBottom: 12,
        }}
      >
        {phase === 'polling' ? 'Confirming…' : `Confirm Payment — ZMW ${amount}`}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#999' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); window.history.back() }} style={{ color: '#999', textDecoration: 'none' }}>
          Cancel and go back
        </a>
      </p>
    </>
  )
}
