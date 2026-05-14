import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import WalkInForm from '../../components/staff/WalkInForm'

export default function WalkIn() {
  return (
    <PageWrapper maxWidth="2xl">
      <PageHeader title="Walk-in Booking" subtitle="Book a customer who's here now" />
      <Card>
        <WalkInForm />
      </Card>
    </PageWrapper>
  )
}
