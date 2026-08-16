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
    heading: '1. About This Agreement',
    body: [
      { type: 'p', text: 'These Business Terms of Service form a binding agreement between you as a business owner ("Business", "you") and Kimawa Innovations ("Kimawa", "we", "us").' },
      { type: 'p', text: 'Kimawa serves beauty and wellness businesses including salons, barbershops, spas, nail technicians, lash studios, makeup artists, and any other beauty or wellness service provider.' },
      { type: 'p', text: 'By registering your business on Kimawa you agree to these terms.' },
    ],
  },
  {
    heading: '2. What Kimawa Provides',
    body: [
      { type: 'p', text: 'Kimawa provides:' },
      {
        type: 'ul',
        items: [
          'A public listing on the Kimawa marketplace (kimawa.pro)',
          'A self-serve online booking page that takes customer bookings 24/7',
          'Deposit collection from customers via Lipila (mobile money and card)',
          'Automatic disbursement of collected deposits to your mobile money account',
          'A dashboard to manage your appointments, staff, services, and portfolio',
          'SMS and WhatsApp booking notifications to your customers',
        ],
      },
    ],
  },
  {
    heading: '3. Fees and Commission',
    body: [
      { type: 'subheading', text: 'Current model' },
      { type: 'p', text: 'Kimawa charges a service fee on each deposit collected. This fee is deducted before disbursement to you. The fee percentage is displayed in your dashboard and communicated to you at onboarding.' },
      { type: 'p', text: 'The customer pays the deposit plus Kimawa\'s service fee. You always receive the full deposit amount as advertised. Kimawa absorbs its own processing costs.' },
      { type: 'subheading', text: 'Future subscription model' },
      { type: 'p', text: 'Kimawa may introduce a monthly subscription fee in the future. You will be notified at least 30 days in advance of any change to the fee structure. You may cancel your account before the new model takes effect if you do not wish to continue.' },
    ],
  },
  {
    heading: '4. Deposit Collection and Disbursement',
    body: [
      { type: 'subheading', text: 'Collection' },
      { type: 'p', text: 'Customer deposits are collected by Kimawa on your behalf using Lipila (operated by Hobbiton Technologies). By listing on Kimawa you authorise us to collect deposits from customers in your name.' },
      { type: 'subheading', text: 'Disbursement' },
      { type: 'p', text: 'Collected deposits are automatically disbursed to your registered mobile money number as soon as a booking is confirmed. Disbursements are processed via Lipila\'s mobile money disbursement service.' },
      { type: 'subheading', text: 'Disbursement failures' },
      { type: 'p', text: 'If a disbursement fails due to network issues or an invalid mobile money number, Kimawa will retry automatically. If repeated failures occur, contact us at hello@kimawa.pro.' },
    ],
  },
  {
    heading: '5. Cancellation Policy',
    body: [
      { type: 'p', text: 'You are responsible for setting your own cancellation policy in your Kimawa dashboard. Your policy is shown to customers before they confirm a booking.' },
      { type: 'subheading', text: 'Refunds' },
      { type: 'p', text: 'You are solely responsible for refunding customers in accordance with your own cancellation policy. Kimawa does not process refunds on your behalf and is not a party to refund disputes between you and your customers.' },
      { type: 'p', text: 'If a customer has already been disbursed their deposit and you need to issue a refund, this must be handled directly between you and the customer.' },
    ],
  },
  {
    heading: '6. Your Responsibilities',
    body: [
      { type: 'p', text: 'As a listed business on Kimawa you agree to:' },
      {
        type: 'ul',
        items: [
          'Keep your services, prices, availability, and staff information up to date',
          'Honour all confirmed bookings made through Kimawa',
          'Set a fair and transparent cancellation policy',
          'Provide the services listed on your profile to the standard a customer would reasonably expect',
          'Treat customers professionally and respectfully',
          'Comply with all applicable Zambian laws including the Data Protection Act',
        ],
      },
    ],
  },
  {
    heading: '7. Account Approval',
    body: [
      { type: 'p', text: 'All business accounts are reviewed and approved by Kimawa before going live on the platform. We reserve the right to reject or suspend any account that does not meet our standards.' },
    ],
  },
  {
    heading: '8. Account Suspension and Termination',
    body: [
      { type: 'p', text: 'Kimawa may suspend or terminate your account if you:' },
      {
        type: 'ul',
        items: [
          'Repeatedly fail to honour confirmed bookings',
          'Receive consistent customer complaints',
          'Violate these Terms',
          'Engage in fraudulent or deceptive practices',
        ],
      },
      { type: 'p', text: 'You may cancel your account at any time by contacting hello@kimawa.pro.' },
    ],
  },
  {
    heading: '9. Your Data',
    body: [
      { type: 'p', text: 'We collect and process your business and personal data as described in our Privacy Policy at kimawa.pro/privacy.' },
    ],
  },
  {
    heading: '10. Intellectual Property',
    body: [
      { type: 'p', text: 'Your business name, logo, and portfolio images remain your property. By uploading them to Kimawa you grant us a licence to display them on our platform for the purpose of promoting your business.' },
    ],
  },
  {
    heading: '11. Limitation of Liability',
    body: [
      { type: 'p', text: "Kimawa's liability to you is limited to the total deposits disbursed to you in the 30 days preceding any claim. We are not liable for lost bookings, lost revenue, or reputational harm." },
    ],
  },
  {
    heading: '12. Changes to These Terms',
    body: [
      { type: 'p', text: 'We may update these Terms from time to time. We will notify you by email at least 14 days before significant changes take effect.' },
    ],
  },
  {
    heading: '13. Governing Law',
    body: [
      { type: 'p', text: 'These Terms are governed by the laws of the Republic of Zambia.' },
    ],
  },
  {
    heading: '14. Contact Us',
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

export default function BusinessTermsOfService() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', fontFamily: sans }}>
      <Helmet>
        <title>Business Terms of Service | Kimawa</title>
      </Helmet>
      <LandingNav />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 24px 96px' }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: BURG, margin: '0 0 12px' }}>
          Legal
        </p>
        <h1 style={{ fontFamily: sans, fontSize: 32, fontWeight: 400, color: TEXT, margin: '0 0 8px', lineHeight: 1.2 }}>
          Business Terms of Service
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
          <Link to="/terms" style={{ fontFamily: sans, fontSize: 12, color: BURG, textDecoration: 'none' }}>Customer Terms</Link>
          <Link to="/privacy" style={{ fontFamily: sans, fontSize: 12, color: BURG, textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/" style={{ fontFamily: sans, fontSize: 12, color: MUTED, textDecoration: 'none' }}>Back to Kimawa</Link>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
