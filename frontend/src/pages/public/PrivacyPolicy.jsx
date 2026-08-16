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
    heading: '1. Who We Are',
    body: [
      { type: 'p', text: 'Kimawa is operated by Kimawa Innovations, a registered business in Zambia (PACRA BN No.: 320261071866).' },
      { type: 'p', text: 'We are committed to protecting your privacy. This policy explains what data we collect, why we collect it, and how we use it.' },
      { type: 'p', text: 'For questions about your data, contact us at hello@kimawa.pro.' },
    ],
  },
  {
    heading: '2. What Data We Collect',
    body: [
      { type: 'subheading', text: 'From customers' },
      {
        type: 'ul',
        items: [
          'Full name',
          'Phone number (including mobile money number)',
          'WhatsApp number (if provided)',
          'Booking history (services booked, dates, times, salons visited)',
          'Payment information (deposit amounts, transaction references; we do not store card numbers)',
          'IP address (for security purposes)',
        ],
      },
      { type: 'subheading', text: 'From salon owners' },
      {
        type: 'ul',
        items: [
          'Full name',
          'Business name and registration details',
          'Email address',
          'Phone number and mobile money number',
          'Business address and location',
          'Service menu, pricing, and portfolio images',
          'Staff information',
        ],
      },
    ],
  },
  {
    heading: '3. Why We Collect Your Data',
    body: [
      { type: 'p', text: 'We use your data to:' },
      {
        type: 'ul',
        items: [
          'Process bookings and payments',
          'Send booking confirmations via SMS and WhatsApp',
          'Disburse deposits to salon owners',
          'Improve our platform and AI chat assistant',
          'Detect and prevent fraud and bot activity',
          'Comply with legal obligations under Zambian law',
        ],
      },
    ],
  },
  {
    heading: '4. Mobile Money Phone Numbers',
    body: [
      { type: 'p', text: 'Because Kimawa uses mobile money for payment processing, we collect and store your mobile money phone number. This number is used to:' },
      {
        type: 'ul',
        items: [
          'Initiate USSD payment prompts via Lipila',
          'Send booking confirmations via SMS and WhatsApp',
          'Process disbursements to salon owners',
        ],
      },
      { type: 'p', text: 'Your mobile money number is shared with Lipila (our payment processor) for the purpose of initiating and processing payments only.' },
    ],
  },
  {
    heading: '5. Third-Party Services We Use',
    body: [
      { type: 'p', text: 'We share data with the following third-party services to operate our platform:' },
      { type: 'subheading', text: 'Lipila (Hobbiton Technologies)' },
      { type: 'p', text: 'Our payment processor. Handles mobile money collection and disbursement. Your mobile money number and transaction details are processed by Lipila. Their privacy practices are governed by Lipila\'s own privacy policy.' },
      { type: 'subheading', text: 'WhatsApp (Meta)' },
      { type: 'p', text: 'Used to send booking confirmations to customers and salon owners. Messages are sent via the WhatsApp Business API.' },
      { type: 'subheading', text: "Africa's Talking" },
      { type: 'p', text: 'Used for SMS notifications as a fallback to WhatsApp.' },
      { type: 'subheading', text: 'Resend' },
      { type: 'p', text: 'Used to send transactional emails such as account verification and approval notifications.' },
      { type: 'subheading', text: 'OpenAI' },
      { type: 'p', text: "Our AI chat assistant is powered by OpenAI's GPT models. Conversation data from the in-app chat may be processed by OpenAI to generate responses. We do not send personally identifiable information to OpenAI beyond what is necessary to answer your questions." },
      { type: 'subheading', text: 'Cloudflare' },
      { type: 'p', text: 'Used for security, bot protection, and DNS. Cloudflare may process your IP address and browser information to protect our platform.' },
      { type: 'subheading', text: 'Railway and Vercel' },
      { type: 'p', text: 'Our hosting providers. Your data is stored on servers operated by Railway (Google Cloud infrastructure) in the United States.' },
    ],
  },
  {
    heading: '6. Data Retention',
    body: [
      { type: 'p', text: 'We retain your data for as long as your account is active or as required by Zambian law. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.' },
      { type: 'p', text: 'Booking records may be retained for up to 7 years for accounting and legal compliance purposes.' },
    ],
  },
  {
    heading: '7. Your Rights',
    body: [
      { type: 'p', text: 'Under the Zambia Data Protection Act, you have the right to:' },
      {
        type: 'ul',
        items: [
          'Access the personal data we hold about you',
          'Correct inaccurate data',
          'Request deletion of your data',
          'Object to how we use your data',
        ],
      },
      { type: 'p', text: 'To exercise any of these rights, contact us at hello@kimawa.pro.' },
    ],
  },
  {
    heading: '8. Security',
    body: [
      { type: 'p', text: 'We take reasonable technical and organisational measures to protect your data including:' },
      {
        type: 'ul',
        items: [
          'Encrypted connections (HTTPS/TLS) for all data in transit',
          'Secure, isolated database storage per salon (schema-level isolation)',
          'Rate limiting and bot protection on all public endpoints',
          'Access controls limiting who can view customer data',
        ],
      },
      { type: 'p', text: 'No system is completely secure. If you believe your data has been compromised, contact us immediately at hello@kimawa.pro.' },
    ],
  },
  {
    heading: '9. Children',
    body: [
      { type: 'p', text: 'Kimawa is not intended for use by anyone under the age of 18. We do not knowingly collect data from children.' },
    ],
  },
  {
    heading: '10. Changes to This Policy',
    body: [
      { type: 'p', text: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by email. Continued use of Kimawa after changes means you accept the updated policy.' },
    ],
  },
  {
    heading: '11. Contact Us',
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

export default function PrivacyPolicy() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', fontFamily: sans }}>
      <Helmet>
        <title>Privacy Policy | Kimawa</title>
      </Helmet>
      <LandingNav />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 24px 96px' }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: BURG, margin: '0 0 12px' }}>
          Legal
        </p>
        <h1 style={{ fontFamily: sans, fontSize: 32, fontWeight: 400, color: TEXT, margin: '0 0 8px', lineHeight: 1.2 }}>
          Privacy Policy
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
          <Link to="/business-terms" style={{ fontFamily: sans, fontSize: 12, color: BURG, textDecoration: 'none' }}>Business Terms</Link>
          <Link to="/" style={{ fontFamily: sans, fontSize: 12, color: MUTED, textDecoration: 'none' }}>Back to Kimawa</Link>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
