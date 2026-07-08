import { BarChart2 } from 'lucide-react'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'

const BURG   = '#6B2737'
const MUTED  = '#7a5060'
const BORDER = '#ede5e7'

const serif = "'Inter', sans-serif"
const sans  = "'Inter', sans-serif"

export default function Analytics() {
  return (
    <PageWrapper>
      <PageHeader title="Activity" subtitle="Business performance at a glance" />

      <div
        style={{
          backgroundColor: '#fff',
          border: `0.5px solid ${BORDER}`,
          padding: '60px 40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            backgroundColor: '#fdf8f8',
            border: `0.5px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <BarChart2 size={20} color="#d4a8b0" />
        </div>

        <h2
          style={{
            fontFamily: serif,
            fontSize: 24,
            fontWeight: 400,
            color: '#1a0a0d',
            margin: '0 0 12px',
          }}
        >
          Detailed analytics coming soon
        </h2>

        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#5c4848', margin: '0 auto', maxWidth: 340, lineHeight: 1.7 }}>
          Revenue trends, booking patterns, and peak-hour insights, powered by the Insights Agent.
          Check your weekly digest in the dashboard for now.
        </p>
      </div>
    </PageWrapper>
  )
}
