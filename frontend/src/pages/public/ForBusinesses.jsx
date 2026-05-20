import { Check } from 'lucide-react'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY   = '#6B2737'
const DARK_CARD = '#4b6b4e'
const TEXT      = '#1a2e1c'
const MUTED     = '#6b7c6d'
const MINT      = '#f4faf4'
const MINT_ALT  = '#edf6ed'
const MINT_CHIP = '#d4ecd4'

const PAIN_POINTS = [
  { icon: '📵', title: 'Missed calls = missed bookings', body: 'Clients call when you\'re hands-deep in a treatment. They don\'t leave a message. They book elsewhere.' },
  { icon: '💸', title: 'No-shows cost you money', body: 'Empty slots you could have filled. No warning. No compensation. Just lost revenue.' },
  { icon: '😤', title: 'Chasing payments is exhausting', body: 'You finished the job. Now you\'re awkwardly reminding someone to pay. It shouldn\'t be this hard.' },
  { icon: '⏰', title: "You're too busy to do admin", body: 'Running a business means bookings, reminders, records, follow-ups — on top of the actual work.' },
]

const SOLUTIONS = [
  { icon: '🤖', title: 'AI takes bookings 24/7', body: 'Your booking page never sleeps. Clients book anytime — midnight, weekends, holidays — without calling you.' },
  { icon: '💳', title: 'Deposits lock in the slot', body: 'Require a deposit at booking via Airtel Money, MTN MoMo or card. No-shows drop dramatically.' },
  { icon: '✅', title: 'Auto-collect at checkout', body: 'Send automatic payment links after appointments. Get paid without the awkward conversation.' },
  { icon: '⚡', title: 'Admin runs itself', body: 'Confirmations, reminders, rescheduling, cancellations — all handled automatically in the background.' },
]

const FEATURES = [
  { icon: '📅', title: 'Smart Booking Page', body: '24/7 booking page your clients can use from any device. Share the link anywhere.' },
  { icon: '🤖', title: 'AI Scheduling', body: 'Automatically manage availability, prevent double-bookings, and fill gaps in your calendar.' },
  { icon: '💳', title: 'Payment Collection', body: 'Accept deposits and full payments via Airtel Money, MTN MoMo, Visa, and Mastercard.' },
  { icon: '📊', title: 'Business Insights', body: 'Revenue, top services, and client trends — updated in real time, in Zambian Kwacha.' },
  { icon: '👥', title: 'Staff Management', body: 'Assign services per staff, set working hours, and track individual performance easily.' },
  { icon: '🔔', title: 'Client Reminders', body: 'Automatic SMS and email reminders before every appointment. Fewer no-shows, happier clients.' },
]

const TESTIMONIAL_PLACEHOLDERS = [
  {
    name: 'Thandiwe M.',
    role: 'Nail Technician, Lusaka',
    body: '"Before BeautyBook ZM I was managing everything on WhatsApp. Now my clients book online, I get deposits automatically, and I haven\'t had a no-show in weeks."',
    initials: 'TM',
  },
  {
    name: 'Chanda B.',
    role: 'Owner, Chanda\'s Barber & Beauty, Ndola',
    body: '"Setup took less than an hour. Within the first week I had new bookings from clients who found me on the directory. This is exactly what Zambian businesses needed."',
    initials: 'CB',
  },
  {
    name: 'Mwansa K.',
    role: 'Spa Manager, Livingstone',
    body: '"The analytics show me which services make the most money. I\'ve already adjusted my pricing and my revenue is up 30% in the first month."',
    initials: 'MK',
  },
]

function FeatureCard({ feature }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: '#ffffff', border: '1px solid #e8f0e8' }}
    >
      <span className="text-3xl mb-4 block">{feature.icon}</span>
      <h3 className="font-display text-base font-bold mb-2" style={{ color: TEXT }}>
        {feature.title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
        {feature.body}
      </p>
    </div>
  )
}

function TestimonialCard({ t }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: '#ffffff', border: '1px solid #e8f0e8' }}
    >
      <p className="text-sm leading-relaxed mb-5 italic" style={{ color: TEXT }}>
        {t.body}
      </p>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: PRIMARY }}
        >
          {t.initials}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: TEXT }}>
            {t.name}
          </p>
          <p className="text-xs" style={{ color: MUTED }}>
            {t.role}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ForBusinesses() {
  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <LandingNav />

      {/* Hero — dark green */}
      <section style={{ backgroundColor: DARK_CARD }} className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{ backgroundColor: 'rgba(212,236,212,0.2)', color: MINT_CHIP }}
          >
            <span>✦</span>
            <span>For Salon Owners · Barbers · Nail Techs · Spas</span>
          </div>
          <h1
            className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6 text-white"
          >
            Grow Your Beauty Business with AI.
          </h1>
          <p className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.75)' }}>
            BeautyBook ZM automates your bookings, collects payments, and gives you insights —
            so you can focus on what you do best.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="px-8 py-4 rounded-full text-base font-semibold transition-opacity hover:opacity-90 w-full sm:w-auto text-center"
              style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
            >
              Start free trial — no card needed
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
              Every beauty professional faces these problems. BeautyBook ZM solves all of them.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {PAIN_POINTS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl p-6 flex gap-4"
                style={{ backgroundColor: MINT, border: '1px solid #e8f0e8' }}
              >
                <span className="text-2xl shrink-0">{p.icon}</span>
                <div>
                  <h3 className="font-semibold text-sm mb-1.5" style={{ color: TEXT }}>
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section style={{ backgroundColor: MINT_ALT }} className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PRIMARY }}>
              The Solution
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: TEXT }}>
              BeautyBook ZM has you covered
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {SOLUTIONS.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl p-6 flex gap-4 bg-white"
                style={{ border: '1px solid #e8f0e8' }}
              >
                <span className="text-2xl shrink-0">{s.icon}</span>
                <div>
                  <h3 className="font-semibold text-sm mb-1.5" style={{ color: TEXT }}>
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                    {s.body}
                  </p>
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
              <FeatureCard key={f.title} feature={f} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ backgroundColor: MINT_ALT }} className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3" style={{ color: TEXT }}>
              Trusted by Zambian beauty professionals
            </h2>
            <p className="text-sm" style={{ color: MUTED }}>
              Real businesses, real results.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIAL_PLACEHOLDERS.map((t) => (
              <TestimonialCard key={t.name} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA — with anchor for #signup */}
      <section
        id="signup"
        style={{ backgroundColor: DARK_CARD }}
        className="py-20 px-6 text-center"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Start your 14-day free trial
          </h2>
          <p className="text-base mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
            No credit card needed. Full access from day one.
          </p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
            {['Setup in under 10 minutes', 'No contracts', 'Cancel anytime'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm" style={{ color: MINT_CHIP }}>
                <Check size={14} />
                {item}
              </li>
            ))}
          </ul>
          <a
            href="/login"
            className="inline-block px-10 py-4 rounded-full font-semibold text-base transition-opacity hover:opacity-90"
            style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
          >
            List Your Business Free
          </a>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
