import { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const PRIMARY   = '#3d5c40'
const DARK_CARD = '#4b6b4e'
const TEXT      = '#1a2e1c'
const MUTED     = '#6b7c6d'
const MINT      = '#f4faf4'
const MINT_ALT  = '#edf6ed'
const MINT_CHIP = '#d4ecd4'

const PLANS = [
  {
    name: 'Starter',
    price: '250',
    description: 'Perfect for solo practitioners just getting started.',
    features: [
      'Up to 2 staff members',
      'Up to 100 bookings / month',
      'Basic AI booking agent',
      'Customer booking page',
      'Email notifications',
    ],
  },
  {
    name: 'Growth',
    price: '450',
    description: 'The most popular choice for growing businesses.',
    featured: true,
    features: [
      'Up to 5 staff members',
      'Unlimited bookings',
      'Full AI agent suite',
      'Analytics dashboard',
      'Priority support',
    ],
  },
  {
    name: 'Pro',
    price: '750',
    description: 'Everything you need to run a large salon empire.',
    features: [
      'Unlimited staff',
      'Unlimited bookings',
      'All AI agents',
      'Custom branding',
      'Dedicated support',
      'WhatsApp notifications',
    ],
  },
]

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — 14 days completely free, no credit card required. You get full access to every feature during your trial.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. No contracts, no lock-in. Cancel from your dashboard with one click and you won\'t be charged again.',
  },
  {
    q: 'What payment methods do customers use?',
    a: 'Customers can pay deposits and balances via Airtel Money, MTN MoMo, Visa, and Mastercard — all integrated directly.',
  },
  {
    q: 'Do I need technical skills?',
    a: 'None at all. Setup takes under 10 minutes. Add your services, set your hours, and share your booking link — that\'s it.',
  },
]

function PricingCard({ plan }) {
  const { featured } = plan
  return (
    <div
      className="rounded-2xl p-8 flex flex-col relative"
      style={{
        backgroundColor: featured ? DARK_CARD : '#ffffff',
        border: featured ? 'none' : '1px solid #e8f0e8',
        boxShadow: featured ? '0 8px 40px rgba(61,92,64,0.25)' : '0 2px 12px rgba(0,0,0,0.05)',
      }}
    >
      {featured && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
          style={{ backgroundColor: MINT_CHIP, color: PRIMARY }}
        >
          Most Popular
        </div>
      )}

      <p
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: featured ? 'rgba(255,255,255,0.6)' : PRIMARY }}
      >
        {plan.name}
      </p>
      <div className="flex items-baseline gap-1 mb-2">
        <span
          className="font-display text-4xl font-bold"
          style={{ color: featured ? '#ffffff' : TEXT }}
        >
          ZMW {plan.price}
        </span>
        <span className="text-sm" style={{ color: featured ? 'rgba(255,255,255,0.6)' : MUTED }}>
          /month
        </span>
      </div>
      <p className="text-sm mb-6" style={{ color: featured ? 'rgba(255,255,255,0.7)' : MUTED }}>
        {plan.description}
      </p>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check
              size={15}
              className="shrink-0 mt-0.5"
              style={{ color: featured ? MINT_CHIP : PRIMARY }}
            />
            <span style={{ color: featured ? 'rgba(255,255,255,0.85)' : TEXT }}>{f}</span>
          </li>
        ))}
      </ul>

      <a
        href="/signup"
        className="block w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
        style={
          featured
            ? { backgroundColor: '#ffffff', color: DARK_CARD }
            : { backgroundColor: PRIMARY, color: '#ffffff' }
        }
      >
        Start free trial
      </a>
    </div>
  )
}

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
        {open ? (
          <ChevronUp size={16} style={{ color: MUTED, flexShrink: 0 }} />
        ) : (
          <ChevronDown size={16} style={{ color: MUTED, flexShrink: 0 }} />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            {a}
          </p>
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
            <span>Simple, transparent pricing</span>
          </div>
          <h1
            className="font-display text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: TEXT }}
          >
            Plans for every stage of growth
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: MUTED }}>
            Start free for 14 days. No credit card needed. Upgrade when you're ready.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 items-start pt-4">
            {PLANS.map((plan) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </div>
          <p className="text-center text-xs mt-8" style={{ color: MUTED }}>
            All prices in Zambian Kwacha (ZMW). Billed monthly. Switch plans or cancel anytime.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: MINT_ALT }} className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="font-display text-3xl font-bold text-center mb-10"
            style={{ color: TEXT }}
          >
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3" style={{ color: TEXT }}>
            Still have questions?
          </h2>
          <p className="text-base mb-8" style={{ color: MUTED }}>
            Chat with our team or start your free trial and see for yourself.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="px-8 py-4 rounded-full text-white font-semibold text-base shadow-lg transition-opacity hover:opacity-90 w-full sm:w-auto text-center"
              style={{ backgroundColor: PRIMARY }}
            >
              Start free trial
            </a>
            <a
              href="mailto:hello@beautybook.zm"
              className="px-8 py-4 rounded-full font-semibold text-base border-2 w-full sm:w-auto text-center transition-colors hover:bg-white"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
            >
              Contact us
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
