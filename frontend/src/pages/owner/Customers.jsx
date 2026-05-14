import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'

export default function Customers() {
  return (
    <PageWrapper>
      <PageHeader title="Customers" subtitle="Customer management" />
      <Card>
        <p className="text-sm text-on-surface-variant text-center py-12">
          Customer list coming soon.
        </p>
      </Card>
    </PageWrapper>
  )
}
