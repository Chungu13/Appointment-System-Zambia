import { BarChart2 } from 'lucide-react'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'

const serif = "'Cormorant Garamond', Georgia, serif"
const PRIMARY = '#6B2737'
const MUTED = '#6B4A50'
const BORDER = '#E8D8DC'

export default function Analytics() {
  return (
    <PageWrapper>
      <PageHeader title="Analytics" subtitle="Business performance at a glance" />

      <div
        style={{
          backgroundColor: '#fff',
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: '64px 32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#FDF0F2',
            border: `1px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <BarChart2 size={22} color={PRIMARY} />
        </div>

        <h2
          style={{
            fontFamily: serif,
            fontSize: 24,
            fontWeight: 400,
            color: '#1A0A0D',
            margin: '0 0 10px',
          }}
        >
          Detailed analytics coming soon
        </h2>

        <p style={{ fontSize: 14, color: MUTED, margin: '0 auto', maxWidth: 340, lineHeight: 1.6 }}>
          Revenue trends, booking patterns, and peak-hour insights — powered by the Insights Agent.
          Check your weekly digest in the dashboard for now.
        </p>
      </div>
    </PageWrapper>
  )
}
