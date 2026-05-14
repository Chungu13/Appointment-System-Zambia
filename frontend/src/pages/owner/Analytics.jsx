import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'

export default function Analytics() {
  return (
    <PageWrapper>
      <PageHeader title="Analytics" subtitle="Business insights" />
      <Card>
        <p className="text-sm text-on-surface-variant text-center py-12">
          Detailed analytics powered by the InsightsAgent — coming soon.
        </p>
      </Card>
    </PageWrapper>
  )
}
