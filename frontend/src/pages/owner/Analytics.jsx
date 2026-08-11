import { BarChart2 } from 'lucide-react'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'

const BURG   = '#3B2A1E'
const MUTED  = '#5C4C3D'
const BORDER = '#EDE3D6'

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
            backgroundColor: '#FBF7F1',
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
            color: '#241812',
            margin: '0 0 12px',
          }}
        >
          Detailed analytics coming soon
        </h2>

        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 400, color: '#5C4C3D', margin: '0 auto', maxWidth: 340, lineHeight: 1.7 }}>
          Revenue trends, booking patterns, and peak-hour insights, powered by the Insights Agent.
          Check your weekly digest in the dashboard for now.
        </p>
      </div>
    </PageWrapper>
  )
}
