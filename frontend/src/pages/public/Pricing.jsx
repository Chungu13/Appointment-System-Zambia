import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY   = '#3d5c40'
const DARK_CARD = '#4b6b4e'
const TEXT      = '#1a2e1c'
const MUTED     = '#6b7c6d'
const MINT      = '#f4faf4'
const MINT_ALT  = '#edf6ed'
const MINT_CHIP = '#d4ecd4'

const INCLUDED = [
  'Your own booking page',
  'AI booking agent',
  'Unlimited bookings',
  'Customer reminders',
  'Staff portal',
  'Business analytics',
  'Payment collection',
  'Portfolio gallery',
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
      style={{ border: '1px solid #e8f0e8', backgroundColor: '#ffffff' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-semibold text-sm pr-4" style={{ color: TEXT }}>
          {q}
        </span>
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
      <section style={{ backgroundColor: MINT }} className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
            style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
          >
            <span>✦</span>
            <span>Simple, fair pricing</span>
          </div>
          <h1
            className="font-display text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: TEXT }}
          >
            Simple, Fair Pricing
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: MUTED }}>
            We're launching in Zambia and want to get it right.
          </p>
        </div>
      </section>

      {/* Main early access card */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-3xl p-10 text-center relative"
            style={{
              backgroundColor: DARK_CARD,
              boxShadow: '0 16px 60px rgba(61,92,64,0.3)',
            }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold"
              style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
            >
              <Sparkles size={14} />
              Early Access
            </div>

            <h2
              className="font-display text-3xl md:text-4xl font-bold text-white mb-5 leading-tight"
            >
              Free for Founding Businesses
            </h2>

            <p
              className="text-base leading-relaxed mb-10 max-w-lg mx-auto"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              Be one of the first beauty professionals on BeautyBook ZM. Early access is completely
              free — no credit card, no hidden fees. When paid plans launch, founding businesses lock
              in a special discounted rate forever.
            </p>

            <a
              href="/signup"
              className="inline-block px-10 py-4 rounded-full font-bold text-base transition-opacity hover:opacity-90 mb-5"
              style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
            >
              Join Free as a Founding Business
            </a>

            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Already 2 businesses on the platform
            </p>
          </div>

          {/* What's included */}
          <div className="mt-14">
            <h3
              className="font-display text-xl font-bold text-center mb-8"
              style={{ color: TEXT }}
            >
              Everything included during early access
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {INCLUDED.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: MINT, border: '1px solid #e8f0e8' }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: MINT_CHIP }}
                  >
                    <Check size={12} style={{ color: PRIMARY }} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: TEXT }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Coming soon plans */}
      <section style={{ backgroundColor: MINT_ALT }} className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: PRIMARY }}>
            Coming soon
          </p>
          <h2
            className="font-display text-2xl md:text-3xl font-bold mb-3"
            style={{ color: TEXT }}
          >
            Paid plans launching soon
          </h2>
          <p className="text-base mb-8" style={{ color: MUTED }}>
            Starter · Growth · Pro
          </p>

          <div
            className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl"
            style={{ backgroundColor: MINT_CHIP }}
          >
            <Sparkles size={18} style={{ color: PRIMARY }} />
            <p className="text-sm font-semibold" style={{ color: PRIMARY }}>
              Founding businesses get <span className="text-base font-bold">40% off</span> forever
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 px-6">
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

      {/* CTA */}
      <section style={{ backgroundColor: MINT }} className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3" style={{ color: TEXT }}>
            Ready to join?
          </h2>
          <p className="text-base mb-8" style={{ color: MUTED }}>
            Get your salon online in under 10 minutes — completely free.
          </p>
          <a
            href="/signup"
            className="inline-block px-10 py-4 rounded-full text-white font-semibold text-base shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            Join as a Founding Business →
          </a>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
