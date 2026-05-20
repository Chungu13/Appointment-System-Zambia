import { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY   = '#6B2737'
const DARK_CARD = '#4A1A25'
const TEXT      = '#1A0A0D'
const MUTED     = '#6B4A50'
const CREAM     = '#FDF5F6'
const CHIP      = '#E8C4CC'
const BORDER    = '#D4B0B8'

const INCLUDED = [
  'Your own booking page',
  'AI booking assistant',
  'Unlimited bookings',
  'Business dashboard',
  'Staff portal',
  'Customer management',
]

const FAQS = [
  {
    q: 'When will paid plans launch?',
    a: "We'll give all founding businesses at least 30 days notice before any charges begin. You'll never wake up to a surprise bill.",
  },
  {
    q: "Will I lose my data if I don't upgrade?",
    a: 'Never. Your bookings, customers, and history are always yours — regardless of what plan you are on.',
  },
  {
    q: 'What payment methods will you accept?',
    a: 'Airtel Money, MTN MoMo, and card payments. We are building for Zambia — local payments are a priority.',
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${BORDER}`, backgroundColor: '#ffffff' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-semibold text-sm pr-4" style={{ color: TEXT }}>{q}</span>
        {open
          ? <ChevronUp size={16} style={{ color: MUTED, flexShrink: 0 }} />
          : <ChevronDown size={16} style={{ color: MUTED, flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{a}</p>
        </div>
      )}
    </div>
  )
}

export default function Pricing() {
  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ backgroundColor: CREAM }} className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h1
            className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4"
            style={{ color: TEXT }}
          >
            Simple, Fair Pricing
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: MUTED }}>
            We're launching in Zambia and want to get it right.
          </p>
        </div>
      </section>

      {/* Main card */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-md mx-auto">
          <div
            className="rounded-3xl p-10 text-center"
            style={{
              backgroundColor: DARK_CARD,
              boxShadow: '0 16px 60px rgba(74,26,37,0.28)',
            }}
          >
            <p className="font-display text-7xl font-bold text-white mb-3">Free</p>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Free to list your business while we launch.<br />No credit card. No hidden fees.
            </p>

            <div className="text-left mb-8 space-y-3">
              {INCLUDED.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: CHIP }}
                  >
                    <Check size={11} style={{ color: PRIMARY }} strokeWidth={3} />
                  </div>
                  <span className="text-sm text-white">{item}</span>
                </div>
              ))}
            </div>

            <a
              href="/signup"
              className="block w-full py-4 rounded-full font-bold text-base transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY, color: '#ffffff' }}
            >
              List Your Business Free
            </a>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: MUTED }}>
            Paid plans coming soon. Founding businesses lock in a special rate.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: CREAM }} className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2
            className="font-display text-2xl md:text-3xl font-bold text-center mb-10"
            style={{ color: TEXT }}
          >
            Questions &amp; answers
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
