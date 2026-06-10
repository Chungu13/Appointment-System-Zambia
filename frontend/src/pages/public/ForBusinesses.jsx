import { Check, Phone, CalendarX, MessageSquare, Clock, Bot, CreditCard, CheckCircle2, Zap, Globe, BarChart2, Users, Calendar } from 'lucide-react'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY   = '#6B2737'
const DARK_CARD = '#6B2737'
const TEXT      = '#1a0a0d'
const MUTED     = '#b09090'
const CREAM     = '#faf7f7'
const CREAM_ALT = '#fdf8f8'
const CHIP      = '#d4a8b0'
const BORDER    = '#ede5e7'

const serif = "'Cormorant Garamond', Georgia, serif"
const sans  = 'Inter, ui-sans-serif, system-ui, sans-serif'

const PAIN_POINTS = [
  { Icon: Phone,         title: 'Missed calls = missed bookings',      body: "Clients call when you're hands-deep in a treatment. They don't leave a message. They book elsewhere." },
  { Icon: CalendarX,     title: 'No-shows cost you money',             body: 'Empty slots you could have filled. No warning. No compensation. Just lost revenue.' },
  { Icon: MessageSquare, title: "You're losing bookings to WhatsApp",  body: "Clients message to book, you forget to reply, they go elsewhere." },
  { Icon: Clock,         title: "You're too busy to do admin",         body: 'Running a business means bookings, reminders, records, and follow-ups, on top of the actual work.' },
]

const SOLUTIONS = [
  { Icon: Bot,          title: 'AI takes bookings 24/7',    body: 'Your booking page never sleeps. Clients book anytime: midnight, weekends, holidays, without calling you.' },
  { Icon: CreditCard,   title: 'Deposits lock in the slot', body: 'Require a deposit at booking via Airtel Money, MTN MoMo or card. No-shows drop dramatically.' },
  { Icon: CheckCircle2, title: 'Auto-collect at checkout',  body: 'Send automatic payment links after appointments. Get paid without the awkward conversation.' },
  { Icon: Zap,          title: 'Admin runs itself',         body: 'Confirmations, reminders, rescheduling, and cancellations are all handled automatically in the background.' },
]

const FEATURES = [
  { Icon: Globe,      title: 'Smart Booking Page',  body: '24/7 booking page your clients can use from any device. Share the link anywhere.' },
  { Icon: Bot,        title: 'AI Scheduling',       body: 'Automatically manage availability, prevent double-bookings, and fill gaps in your calendar.' },
  { Icon: CreditCard, title: 'Payment Collection',  body: 'Accept deposits and full payments via Airtel Money, MTN MoMo, Visa, and Mastercard.' },
  { Icon: BarChart2,  title: 'Business Insights',   body: 'Revenue, top services, and client trends, updated in real time in Zambian Kwacha.' },
  { Icon: Users,      title: 'Staff Management',    body: 'Assign services per staff, set working hours, and track individual performance easily.' },
]

const STATS = [
  { value: '24/7',   label: 'Bookings automated' },
  { value: '0%',     label: 'Commission taken'   },
  { value: '10 min', label: 'To go live'         },
]

function IconBadge({ Icon }) {
  return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: CHIP, flexShrink: 0 }}>
      <Icon size={17} style={{ color: PRIMARY }} />
    </div>
  )
}

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
            Kimawa automates your bookings, collects payments, and gives you insights, so you can focus on what you do best.
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
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ border: `0.5px solid ${BORDER}` }}>
            {PAIN_POINTS.map((p, i) => (
              <div
                key={p.title}
                style={{
                  padding: '44px 40px',
                  borderRight: i % 2 === 0 ? `0.5px solid ${BORDER}` : 'none',
                  borderBottom: i < 2 ? `0.5px solid ${BORDER}` : 'none',
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

      {/* ── Solution ── */}
      <section style={{ backgroundColor: CREAM_ALT, padding: '96px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: PRIMARY, margin: '0 0 16px' }}>The Solution</p>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: TEXT, margin: 0, letterSpacing: '-0.3px' }}>Kimawa has you covered</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ border: `0.5px solid ${BORDER}`, backgroundColor: '#fff' }}>
            {SOLUTIONS.map((s, i) => (
              <div
                key={s.title}
                style={{
                  padding: '44px 40px',
                  borderRight: i % 2 === 0 ? `0.5px solid ${BORDER}` : 'none',
                  borderBottom: i < 2 ? `0.5px solid ${BORDER}` : 'none',
                }}
              >
                <div style={{ width: 1, height: 28, backgroundColor: PRIMARY, opacity: 0.35, marginBottom: 24 }} />
                <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: TEXT, margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.75, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ backgroundColor: '#fff', padding: '96px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: TEXT, margin: '0 0 12px', letterSpacing: '-0.3px' }}>Everything in one platform</h2>
            <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, maxWidth: 480, margin: 0 }}>No juggling multiple apps. No manual spreadsheets. One dashboard, everything connected.</p>
          </div>
          <div style={{ border: `0.5px solid ${BORDER}` }}>
            {/* Top row: 3 items */}
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
              {FEATURES.slice(0, 3).map((f, i) => (
                <div key={f.title} style={{ padding: '44px 36px', borderRight: i < 2 ? `0.5px solid ${BORDER}` : 'none' }}>
                  <div style={{ width: 1, height: 28, backgroundColor: PRIMARY, opacity: 0.35, marginBottom: 24 }} />
                  <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: TEXT, margin: '0 0 10px' }}>{f.title}</h3>
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.75, margin: 0 }}>{f.body}</p>
                </div>
              ))}
            </div>
            {/* Bottom row: 2 items centred */}
            <div className="flex flex-col sm:flex-row sm:justify-center">
              {FEATURES.slice(3).map((f, i) => (
                <div key={f.title} className="sm:w-1/3" style={{ padding: '44px 36px', borderRight: i === 0 ? `0.5px solid ${BORDER}` : 'none' }}>
                  <div style={{ width: 1, height: 28, backgroundColor: PRIMARY, opacity: 0.35, marginBottom: 24 }} />
                  <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: TEXT, margin: '0 0 10px' }}>{f.title}</h3>
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.75, margin: 0 }}>{f.body}</p>
                </div>
              ))}
            </div>
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
