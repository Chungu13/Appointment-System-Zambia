import { Check, Phone, CalendarX, MessageSquare, Bot, CreditCard, Zap, Globe, Users, Calendar } from 'lucide-react'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY    = '#6B2737'
const TEXT       = '#1a0a0d'
const MUTED      = '#b09090'
const CREAM_ALT  = '#fdf8f8'
const CHIP       = '#d4a8b0'
const BORDER     = '#d4b8be'
const LIGHT_CARD = '#f5e4e8'

const serif = "'Cormorant Garamond', Georgia, serif"
const sans  = 'Inter, ui-sans-serif, system-ui, sans-serif'

const PAIN_POINTS = [
  { title: 'Missed calls = missed bookings',     body: "Clients call when you're hands-deep in a treatment. They don't leave a message. They book elsewhere." },
  { title: 'No-shows cost you money',            body: 'Empty slots you could have filled. No warning, no compensation. Just lost revenue.' },
  { title: "You're losing bookings to WhatsApp", body: "Clients message to book, you forget to reply, they go elsewhere." },
]

const SOLUTIONS = [
  { title: 'AI takes bookings 24/7',    body: 'Your booking page never sleeps. Clients book anytime — midnight, weekends, holidays — without calling you.' },
  { title: 'Deposits reduce no-shows',  body: 'Require a deposit at booking via Airtel Money or MTN MoMo. No-shows drop dramatically once a client has paid upfront.' },
  { title: 'Admin runs itself',         body: 'Confirmations, reminders, rescheduling, and cancellations are handled automatically so you stay focused on your work.' },
]

const FEATURES = [
  { title: 'Smart Booking Page',  body: 'A 24/7 booking page your clients can use from any device. Share the link on Instagram, WhatsApp, anywhere.' },
  { title: 'Mobile Money Payments', body: 'Accept deposits via Airtel Money and MTN MoMo directly at booking — no card terminal needed.' },
  { title: 'Staff & Scheduling',  body: 'Assign services per staff member, set working hours, and manage your whole team from one dashboard.' },
]

const STATS = [
  { value: '24/7',   label: 'Automated bookings' },
  { value: 'Free',   label: 'To get started'      },
  { value: '10 min', label: 'Setup time'           },
]

export default function ForBusinesses() {
  return (
    <div style={{ fontFamily: sans }}>
      <LandingNav />

      {/* ── Hero ── */}
      <section style={{ backgroundColor: PRIMARY }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '96px 40px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', margin: '0 0 28px' }}>
            For Business Owners
          </p>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, color: '#fff', lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-0.5px' }}>
            Grow Your Beauty Business with AI.
          </h1>
          <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.62)', lineHeight: 1.85, maxWidth: 520, margin: '0 auto 52px' }}>
            Kimawa automates your bookings, collects payments, and gives you insights — so you can focus on what you do best.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <a href="/signup" style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: PRIMARY, backgroundColor: '#fff', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }}>
              List Your Business Free
            </a>
            <a href="/how-it-works" style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', border: '0.5px solid rgba(255,255,255,0.32)', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }}>
              See how it works
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)', marginTop: 72, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 800, margin: '72px auto 0' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: '30px 0', borderLeft: i > 0 ? '0.5px solid rgba(255,255,255,0.1)' : 'none', textAlign: 'center' }}>
              <p style={{ fontFamily: serif, fontSize: 34, fontWeight: 300, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{s.value}</p>
              <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pain Points ── */}
      <section style={{ backgroundColor: '#fff', padding: '96px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: TEXT, margin: '0 0 12px', letterSpacing: '-0.3px' }}>Sound familiar?</h2>
            <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.6, margin: 0 }}>Every beauty professional faces these problems. Kimawa solves all of them.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ border: `0.5px solid ${BORDER}` }}>
            {PAIN_POINTS.map((p, i) => (
              <div
                key={p.title}
                style={{
                  backgroundColor: LIGHT_CARD,
                  padding: '44px 36px',
                  borderRight: i < 2 ? `0.5px solid ${BORDER}` : 'none',
                }}
              >
                <p style={{ fontFamily: serif, fontSize: 13, color: CHIP, margin: '0 0 20px' }}>0{i + 1}</p>
                <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: TEXT, margin: '0 0 10px' }}>{p.title}</h3>
                <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.75, margin: 0 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What You Get ── */}
      <section style={{ backgroundColor: CREAM_ALT, padding: '96px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: PRIMARY, margin: '0 0 16px' }}>How it works</p>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: TEXT, margin: 0, letterSpacing: '-0.3px' }}>Kimawa has you covered</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ border: `0.5px solid ${BORDER}` }}>
            {SOLUTIONS.map((s, i) => (
              <div
                key={s.title}
                style={{
                  backgroundColor: LIGHT_CARD,
                  padding: '44px 36px',
                  borderRight: i < 2 ? `0.5px solid ${BORDER}` : 'none',
                }}
              >
                <div style={{ width: 1, height: 28, backgroundColor: PRIMARY, opacity: 0.4, marginBottom: 24 }} />
                <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: TEXT, margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.75, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Features ── */}
      <section style={{ backgroundColor: '#fff', padding: '96px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: TEXT, margin: '0 0 12px', letterSpacing: '-0.3px' }}>Everything in one platform</h2>
            <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, maxWidth: 480, margin: 0 }}>No juggling multiple apps. One dashboard, everything connected.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ border: `0.5px solid ${BORDER}` }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                style={{
                  backgroundColor: LIGHT_CARD,
                  padding: '44px 36px',
                  borderRight: i < 2 ? `0.5px solid ${BORDER}` : 'none',
                }}
              >
                <div style={{ width: 1, height: 28, backgroundColor: PRIMARY, opacity: 0.4, marginBottom: 24 }} />
                <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: TEXT, margin: '0 0 10px' }}>{f.title}</h3>
                <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.75, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="signup" style={{ backgroundColor: PRIMARY, padding: '96px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <h2 style={{ fontFamily: serif, fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 300, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.4px' }}>
            Get Started for Free
          </h2>
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.62)', margin: '0 0 16px', lineHeight: 1.85 }}>
            Free to list your business while we launch. No credit card needed.
          </p>
          <ul style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 24px', margin: '0 0 48px', padding: 0, listStyle: 'none' }}>
            {['Setup in under 10 minutes', 'Full access from day one', 'Paid plans coming later'].map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: sans, fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.45)' }}>
                <Check size={12} />
                {item}
              </li>
            ))}
          </ul>
          <a
            href="/signup"
            style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: PRIMARY, backgroundColor: '#fff', padding: '16px 40px', textDecoration: 'none', display: 'inline-block' }}
          >
            List Your Business Free
          </a>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
