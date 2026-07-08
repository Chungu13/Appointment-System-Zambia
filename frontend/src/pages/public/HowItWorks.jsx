import { Helmet } from 'react-helmet-async'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY    = '#6B2737'
const DARK_CARD  = '#6B2737'
const TEXT       = '#1a0a0d'
const MUTED      = '#b09090'
const CREAM      = '#faf7f7'
const CREAM_ALT  = '#fdf8f8'
const CHIP       = '#b07888'
const BORDER     = '#d4b8be'
const LIGHT_CARD = '#f5e4e8'
const CARD_BODY  = '#5a2d36'

const sans = 'Inter, ui-sans-serif, system-ui, sans-serif'

const CUSTOMER_STEPS = [
  {
    n: '01',
    title: 'Find',
    body: 'Browse beauty professionals near you by category, location or name.',
  },
  {
    n: '02',
    title: 'Book',
    body: 'Pick your service and time, or simply chat with our AI assistant. Just type what you want, like "I want braids Saturday", and it handles everything for you.',
  },
  {
    n: '03',
    title: 'Relax',
    body: 'Show up and enjoy your appointment.',
  },
]

const OWNER_STEPS = [
  {
    n: '01',
    title: 'Sign up',
    body: 'Create your Kimawa profile in minutes. No technical skills needed.',
  },
  {
    n: '02',
    title: 'Set up',
    body: 'Add your services, prices, staff, and working hours once.',
  },
  {
    n: '03',
    title: 'Let AI work',
    body: 'Our AI handles bookings, cancellations and insights automatically while you focus on your craft.',
  },
]

function StepCard({ step, dark }) {
  return (
    <div
      className="rounded-2xl p-8 flex flex-col"
      style={{ backgroundColor: dark ? DARK_CARD : '#ffffff', border: dark ? 'none' : `1px solid ${BORDER}` }}
    >
      <p
        className="font-display text-5xl font-bold mb-5 leading-none"
        style={{ color: dark ? 'rgba(255,255,255,0.25)' : CHIP }}
      >
        {step.n}
      </p>
      <h3
        className="font-display text-xl font-bold mb-3"
        style={{ color: dark ? '#ffffff' : TEXT }}
      >
        {step.title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: dark ? 'rgba(255,255,255,0.75)' : MUTED }}
      >
        {step.body}
      </p>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <div style={{ fontFamily: sans }}>
      <Helmet>
        <title>How It Works | Kimawa Beauty Booking Zambia</title>
        <meta name="description" content="See how Kimawa works for customers and salon owners in Zambia. Find a salon and book in seconds, no account needed." />
        <link rel="canonical" href="https://kimawa.pro/how-it-works" />
      </Helmet>
      <LandingNav />

      {/* ── Hero ── */}
      <section style={{ backgroundColor: PRIMARY, padding: '96px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', margin: '0 0 28px' }}>
            Getting started
          </p>
          <h1 style={{ fontFamily: sans, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, color: '#fff', lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-0.5px' }}>
            How Kimawa Works
          </h1>
          <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.62)', lineHeight: 1.85, margin: 0 }}>
            Getting started takes minutes, whether you're booking an appointment or listing your business.
          </p>
        </div>
      </section>

      {/* ── Customer Steps ── */}
      <section style={{ backgroundColor: CREAM, padding: '96px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: PRIMARY, margin: '0 0 16px' }}>For Customers</p>
            <h2 style={{ fontFamily: sans, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: TEXT, margin: 0, letterSpacing: '-0.3px' }}>Book in 3 easy steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ border: `0.5px solid ${BORDER}` }}>
            {CUSTOMER_STEPS.map((step, i) => (
              <div
                key={step.n}
                style={{
                  backgroundColor: LIGHT_CARD,
                  padding: '44px 36px',
                  borderRight: i < 2 ? `0.5px solid ${BORDER}` : 'none',
                }}
              >
                <p style={{ fontFamily: sans, fontSize: 13, color: CHIP, margin: '0 0 20px' }}>{step.n}</p>
                <h3 style={{ fontFamily: sans, fontSize: 24, fontWeight: 400, color: TEXT, margin: '0 0 12px' }}>{step.title}</h3>
                <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: CARD_BODY, lineHeight: 1.75, margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Owner Steps ── */}
      <section style={{ backgroundColor: CREAM_ALT, padding: '96px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: PRIMARY, margin: '0 0 16px' }}>For Business Owners</p>
            <h2 style={{ fontFamily: sans, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: TEXT, margin: 0, letterSpacing: '-0.3px' }}>Go live in 3 steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ backgroundColor: PRIMARY }}>
            {OWNER_STEPS.map((step, i) => (
              <div
                key={step.n}
                style={{
                  padding: '44px 36px',
                  borderRight: i < 2 ? '0.5px solid rgba(255,255,255,0.1)' : 'none',
                }}
              >
                <p style={{ fontFamily: sans, fontSize: 13, color: 'rgba(255,255,255,0.22)', margin: '0 0 20px' }}>{step.n}</p>
                <h3 style={{ fontFamily: sans, fontSize: 24, fontWeight: 400, color: '#fff', margin: '0 0 12px' }}>{step.title}</h3>
                <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: '#fff', padding: '96px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 460, margin: '0 auto' }}>
          <h2 style={{ fontFamily: sans, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: TEXT, margin: '0 0 16px', letterSpacing: '-0.3px' }}>
            Ready to get started?
          </h2>
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: TEXT, margin: '0 0 40px', lineHeight: 1.85 }}>
            Be among the first beauty professionals in Zambia on Kimawa.
          </p>
          <a
            href="/signup"
            style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', backgroundColor: PRIMARY, padding: '16px 40px', textDecoration: 'none', display: 'inline-block' }}
          >
            List Your Business Free
          </a>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
