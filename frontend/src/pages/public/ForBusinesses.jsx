import { Check, Phone, CalendarX, MessageSquare, Clock, Bot, CreditCard, CheckCircle2, Zap, Globe, BarChart2, Users, Calendar } from 'lucide-react'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY   = '#6B2737'
const DARK_CARD = '#4A1A25'
const TEXT      = '#1A0A0D'
const MUTED     = '#6B4A50'
const CREAM     = '#FDF5F6'
const CREAM_ALT = '#FAF0F2'
const CHIP      = '#E8C4CC'
const BORDER    = '#D4B0B8'

const PAIN_POINTS = [
  { Icon: Phone,       title: 'Missed calls = missed bookings',      body: "Clients call when you're hands-deep in a treatment. They don't leave a message. They book elsewhere." },
  { Icon: CalendarX,   title: 'No-shows cost you money',             body: 'Empty slots you could have filled. No warning. No compensation. Just lost revenue.' },
  { Icon: MessageSquare, title: "You're losing bookings to WhatsApp", body: "Clients message to book, you forget to reply, they go elsewhere." },
  { Icon: Clock,       title: "You're too busy to do admin",         body: 'Running a business means bookings, reminders, records, follow-ups — on top of the actual work.' },
]

const SOLUTIONS = [
  { Icon: Bot,          title: 'AI takes bookings 24/7',     body: 'Your booking page never sleeps. Clients book anytime — midnight, weekends, holidays — without calling you.' },
  { Icon: CreditCard,   title: 'Deposits lock in the slot',  body: 'Require a deposit at booking via Airtel Money, MTN MoMo or card. No-shows drop dramatically.' },
  { Icon: CheckCircle2, title: 'Auto-collect at checkout',   body: 'Send automatic payment links after appointments. Get paid without the awkward conversation.' },
  { Icon: Zap,          title: 'Admin runs itself',          body: 'Confirmations, reminders, rescheduling, cancellations — all handled automatically in the background.' },
]

const FEATURES = [
  { Icon: Globe,    title: 'Smart Booking Page',  body: '24/7 booking page your clients can use from any device. Share the link anywhere.' },
  { Icon: Bot,      title: 'AI Scheduling',       body: 'Automatically manage availability, prevent double-bookings, and fill gaps in your calendar.' },
  { Icon: CreditCard, title: 'Payment Collection', body: 'Accept deposits and full payments via Airtel Money, MTN MoMo, Visa, and Mastercard.' },
  { Icon: BarChart2, title: 'Business Insights',  body: 'Revenue, top services, and client trends — updated in real time, in Zambian Kwacha.' },
  { Icon: Users,    title: 'Staff Management',    body: 'Assign services per staff, set working hours, and track individual performance easily.' },
]

function IconBadge({ Icon }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: CHIP }}
    >
      <Icon size={17} style={{ color: PRIMARY }} />
    </div>
  )
}

export default function ForBusinesses() {
  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ backgroundColor: DARK_CARD }} className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6 text-white">
            Grow Your Beauty Business with AI.
          </h1>
          <p className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Kimawa automates your bookings, collects payments, and gives you insights —
            so you can focus on what you do best.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="px-8 py-4 rounded-full text-base font-semibold transition-opacity hover:opacity-90 w-full sm:w-auto text-center"
              style={{ backgroundColor: CHIP, color: PRIMARY }}
            >
              List Your Business Free
            </a>
            <a
              href="/how-it-works"
              className="px-8 py-4 rounded-full text-base font-semibold border-2 w-full sm:w-auto text-center transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff' }}
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: TEXT }}>
              Sound familiar?
            </h2>
            <p className="text-base" style={{ color: MUTED }}>
              Every beauty professional faces these problems. Kimawa solves all of them.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {PAIN_POINTS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl p-6 flex gap-4"
                style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
              >
                <IconBadge Icon={p.Icon} />
                <div>
                  <h3 className="font-semibold text-sm mb-1.5" style={{ color: TEXT }}>{p.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section style={{ backgroundColor: CREAM_ALT }} className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PRIMARY }}>
              The Solution
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: TEXT }}>
              Kimawa has you covered
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {SOLUTIONS.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl p-6 flex gap-4 bg-white"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <IconBadge Icon={s.Icon} />
                <div>
                  <h3 className="font-semibold text-sm mb-1.5" style={{ color: TEXT }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: TEXT }}>
              Everything in one platform
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: MUTED }}>
              No juggling multiple apps. No manual spreadsheets. One dashboard, everything connected.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6"
                style={{ backgroundColor: '#ffffff', border: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: CHIP }}
                >
                  <f.Icon size={17} style={{ color: PRIMARY }} />
                </div>
                <h3 className="font-display text-base font-bold mb-2" style={{ color: TEXT }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="signup"
        style={{ backgroundColor: DARK_CARD }}
        className="py-20 px-6 text-center"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Get Started for Free
          </h2>
          <p className="text-base mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Free to list your business while we launch. No credit card needed.
          </p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
            {['Setup in under 10 minutes', 'Full access from day one', 'Paid plans coming later'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm" style={{ color: CHIP }}>
                <Check size={14} />
                {item}
              </li>
            ))}
          </ul>
          <a
            href="/signup"
            className="inline-block px-10 py-4 rounded-full font-semibold text-base transition-opacity hover:opacity-90"
            style={{ backgroundColor: CHIP, color: PRIMARY }}
          >
            List Your Business Free
          </a>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
