import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY    = '#6B2737'
const DARK_CARD  = '#4A1A25'
const TEXT       = '#1A0A0D'
const MUTED      = '#6B4A50'
const CREAM      = '#FDF5F6'
const CREAM_ALT  = '#FAF0F2'
const CHIP       = '#E8C4CC'
const BORDER     = '#D4B0B8'

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
    body: 'Get reminders automatically. Show up and enjoy your appointment.',
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
    body: 'Our AI handles bookings, reminders, cancellations and insights automatically while you focus on your craft.',
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
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ backgroundColor: CREAM }} className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1
            className="font-display text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: TEXT }}
          >
            How Kimawa Works
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: MUTED }}>
            Getting started takes minutes, whether you're booking an appointment or listing your business.
          </p>
        </div>
      </section>

      {/* For Customers */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: PRIMARY }}
            >
              For Customers
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: TEXT }}>
              Book in 3 easy steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {CUSTOMER_STEPS.map((step) => (
              <StepCard key={step.n} step={step} dark={false} />
            ))}
          </div>
        </div>
      </section>

      {/* For Business Owners */}
      <section style={{ backgroundColor: CREAM_ALT }} className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: PRIMARY }}
            >
              For Business Owners
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: TEXT }}>
              Go live in 3 steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {OWNER_STEPS.map((step) => (
              <StepCard key={step.n} step={step} dark />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3" style={{ color: TEXT }}>
            Ready to get started?
          </h2>
          <p className="text-base mb-8" style={{ color: MUTED }}>
            Be among the first beauty professionals in Zambia on Kimawa.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold text-base shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            List Your Business Free →
          </a>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
