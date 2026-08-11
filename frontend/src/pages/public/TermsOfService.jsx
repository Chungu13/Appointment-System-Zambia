import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'

const BURG   = '#3B2A1E'
const TEXT   = '#241812'
const MUTED  = '#6b6b6b'
const BORDER = '#EDE3D6'
const sans   = 'Inter, ui-sans-serif, system-ui, sans-serif'

const sections = [
  {
    heading: '1. About Kimawa',
    body: [
      { type: 'p', text: 'Kimawa is an AI-powered beauty and wellness booking platform operated by Kimawa Innovations, a registered business in Zambia (PACRA BN No.: 320261071866).' },
      { type: 'p', text: 'Kimawa connects customers with beauty and wellness businesses ("Salons") in Zambia. We provide the technology that allows you to discover salons, book appointments, and pay deposits online.' },
    ],
  },
  {
    heading: '2. Who These Terms Apply To',
    body: [
      { type: 'p', text: 'These Terms of Service apply to you as a customer: anyone who uses Kimawa to browse salons, make bookings, or pay deposits.' },
      { type: 'p', text: 'If you are a salon owner, please refer to the Salon Terms of Service.' },
    ],
  },
  {
    heading: '3. Using Kimawa',
    body: [
      { type: 'p', text: 'By using Kimawa you agree to:' },
      {
        type: 'ul',
        items: [
          'Provide accurate and honest information when booking',
          'Use a valid Zambian mobile money number (MTN, Airtel, or Zamtel) for deposit payments',
          'Only make bookings you intend to keep',
          'Not use Kimawa for any unlawful purpose',
        ],
      },
      { type: 'p', text: 'You must be at least 18 years old to use Kimawa.' },
    ],
  },
  {
    heading: '4. Bookings and Deposits',
    body: [
      { type: 'subheading', text: 'How bookings work' },
      { type: 'p', text: "Kimawa's AI assistant helps you find available times and book appointments at salons listed on our platform. A booking is confirmed once your deposit payment is successfully processed." },
      { type: 'subheading', text: 'Deposits' },
      { type: 'p', text: 'Some services require a deposit to secure your booking. The deposit amount is shown clearly before you confirm. The deposit is collected by Kimawa on behalf of the salon using Lipila, our payment processor.' },
      { type: 'p', text: 'The deposit is part of your total service price. It is deducted from the amount you pay at the salon on the day of your appointment.' },
      { type: 'subheading', text: "Kimawa's role" },
      { type: 'p', text: 'Kimawa acts as a payment intermediary only. We collect your deposit and pass it to the salon. We are not a party to the service agreement between you and the salon.' },
    ],
  },
  {
    heading: '5. Cancellations and Refunds',
    body: [
      { type: 'subheading', text: 'Cancellation policy' },
      { type: 'p', text: "Each salon sets its own cancellation policy. Before booking, you can view the salon's cancellation terms. By confirming a booking you agree to that salon's cancellation policy." },
      { type: 'subheading', text: 'Refunds' },
      { type: 'p', text: 'If you cancel a booking, any refund of your deposit is handled entirely by the salon, not by Kimawa. Kimawa does not process refunds and is not responsible for refund disputes between you and a salon.' },
      { type: 'p', text: 'If you believe a salon has treated you unfairly, contact us at hello@kimawa.pro and we will do our best to help resolve the issue.' },
    ],
  },
  {
    heading: '6. Failed Payments and Network Errors',
    body: [
      { type: 'p', text: 'Mobile money payments in Zambia rely on MTN, Airtel, and Zamtel networks. Occasionally these networks experience downtime or processing delays.' },
      { type: 'p', text: 'Kimawa is not responsible for:' },
      {
        type: 'ul',
        items: [
          'Failed USSD prompts due to network outages',
          'Delays in payment confirmation caused by the mobile money provider',
          'Booking slots lost due to payment processing failures outside our control',
        ],
      },
      { type: 'p', text: "If your payment fails, Kimawa's AI assistant will offer you the option to retry. If you experience persistent issues, contact us at hello@kimawa.pro." },
    ],
  },
  {
    heading: '7. Salon Services',
    body: [
      { type: 'p', text: 'Kimawa lists salons and their services on our platform. However:' },
      {
        type: 'ul',
        items: [
          'Kimawa does not employ the stylists or technicians at listed salons',
          'Kimawa is not responsible for the quality of services provided by salons',
          'Any dispute about the service itself must be resolved directly with the salon',
        ],
      },
    ],
  },
  {
    heading: '8. Your Data',
    body: [
      { type: 'p', text: 'We collect and use your personal data as described in our Privacy Policy at kimawa.pro/privacy.' },
    ],
  },
  {
    heading: '9. Limitation of Liability',
    body: [
      { type: 'p', text: "To the maximum extent permitted by Zambian law, Kimawa's liability to you is limited to the amount of the deposit you paid for the relevant booking." },
      { type: 'p', text: 'We are not liable for indirect losses, including lost time, inconvenience, or lost income.' },
    ],
  },
  {
    heading: '10. Changes to These Terms',
    body: [
      { type: 'p', text: 'We may update these Terms from time to time. We will notify you of significant changes by email. Continued use of Kimawa after changes means you accept the updated Terms.' },
    ],
  },
  {
    heading: '11. Governing Law',
    body: [
      { type: 'p', text: 'These Terms are governed by the laws of the Republic of Zambia.' },
    ],
  },
  {
    heading: '12. Contact Us',
    body: [
      { type: 'p', text: 'Kimawa Innovations' },
      { type: 'p', text: 'Lusaka, Zambia' },
      { type: 'p', text: 'hello@kimawa.pro' },
      { type: 'p', text: 'kimawa.pro' },
    ],
  },
]

function renderBody(items) {
  return items.map((item, i) => {
    if (item.type === 'p') {
      return (
        <p key={i} style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.8, margin: '0 0 12px' }}>
          {item.text}
        </p>
      )
    }
    if (item.type === 'subheading') {
      return (
        <p key={i} style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: TEXT, margin: '16px 0 6px' }}>
          {item.text}
        </p>
      )
    }
    if (item.type === 'ul') {
      return (
        <ul key={i} style={{ margin: '0 0 12px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {item.items.map((li, j) => (
            <li key={j} style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.7 }}>
              {li}
            </li>
          ))}
        </ul>
      )
    }
    return null
  })
}

export default function TermsOfService() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', fontFamily: sans }}>
      <Helmet>
        <title>Terms of Service | Kimawa</title>
      </Helmet>
      <LandingNav />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 24px 96px' }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: BURG, margin: '0 0 12px' }}>
          Legal
        </p>
        <h1 style={{ fontFamily: sans, fontSize: 32, fontWeight: 400, color: TEXT, margin: '0 0 8px', lineHeight: 1.2 }}>
          Terms of Service
        </h1>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '0 0 48px' }}>
          Last updated: June 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {sections.map((section) => (
            <div key={section.heading} style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 28 }}>
              <h2 style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: TEXT, margin: '0 0 14px' }}>
                {section.heading}
              </h2>
              {renderBody(section.body)}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 56, borderTop: `0.5px solid ${BORDER}`, paddingTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link to="/privacy" style={{ fontFamily: sans, fontSize: 12, color: BURG, textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/business-terms" style={{ fontFamily: sans, fontSize: 12, color: BURG, textDecoration: 'none' }}>Business Terms</Link>
          <Link to="/" style={{ fontFamily: sans, fontSize: 12, color: MUTED, textDecoration: 'none' }}>Back to Kimawa</Link>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
