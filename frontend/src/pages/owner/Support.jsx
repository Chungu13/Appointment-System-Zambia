import { Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'

const BURG   = '#3B2A1E'
const TEXT   = '#241812'
const MUTED  = '#8A7A6A'
const BORDER = '#EDE3D6'
const BLUSH  = '#FBF7F1'
const sans   = "'Inter', sans-serif"

const FAQS = [
  {
    q: 'How do customers book an appointment?',
    a: 'Customers use the step-by-step booking page: they pick a service, choose a stylist and time, and pay the deposit. A chat option is also available on your page if they have questions. No manual involvement needed from you.',
  },
  {
    q: 'What is the deposit and who receives it?',
    a: 'The deposit is a portion of the service price collected upfront to secure the booking. You receive the deposit amount in full. Kimawa charges a small service fee on top, which is paid by the customer.',
  },
  {
    q: 'What happens when a customer pays?',
    a: 'The customer receives a mobile money prompt on their phone. Once they approve it, the booking is confirmed and you will see it appear in your Calendar.',
  },
  {
    q: 'Can a customer reschedule their appointment?',
    a: 'Online rescheduling via the chat is not available yet. Customers are directed to contact your salon directly to arrange a new time.',
  },
  {
    q: 'How do I mark an appointment as completed?',
    a: 'Open the appointment in your Calendar and click the Complete button. This records the visit and updates the customer\'s visit history.',
  },
  {
    q: 'Can I add staff members and assign them to services?',
    a: 'Yes. Go to the Staff page to add staff, then edit each service to assign the staff members who can perform it. Only staff qualified and available for a service can be booked for it.',
  },
  {
    q: 'How do I update my business information or opening hours?',
    a: 'Go to Settings to update your business name, hours, and booking policies.',
  },
  {
    q: 'My question isn\'t answered here. How do I get help?',
    a: 'Email us at kimawa@gmail.com and we\'ll get back to you as soon as possible.',
  },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `0.5px solid ${BORDER}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
          padding: '16px 0', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: TEXT, lineHeight: 1.5 }}>{q}</span>
        {open
          ? <ChevronUp size={16} color={MUTED} style={{ flexShrink: 0 }} />
          : <ChevronDown size={16} color={MUTED} style={{ flexShrink: 0 }} />}
      </button>
      {open && (
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: TEXT, lineHeight: 1.8, margin: '0 0 16px' }}>
          {a}
        </p>
      )}
    </div>
  )
}

export default function Support() {
  return (
    <PageWrapper maxWidth="3xl">
      <PageHeader
        title="Support"
        subtitle="Get help with your Kimawa account"
      />

      {/* Contact card */}
      <div style={{ backgroundColor: BLUSH, border: `0.5px solid ${BORDER}`, borderRadius: 14, padding: '24px 28px', marginBottom: 32, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 36, height: 36, backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Mail size={16} color={BURG} />
        </div>
        <div>
          <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: BURG, margin: '0 0 6px' }}>
            Email support
          </p>
          <a
            href="mailto:kimawa@gmail.com"
            style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, color: TEXT, textDecoration: 'none' }}
          >
            kimawa@gmail.com
          </a>
          <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, margin: '4px 0 0', lineHeight: 1.6 }}>
            We aim to respond within 24 hours on business days.
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, borderRadius: 14, padding: '4px 24px 0' }}>
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: BURG, margin: '20px 0 4px' }}>
          Frequently asked questions
        </p>
        {FAQS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </PageWrapper>
  )
}
