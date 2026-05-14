import { useQuery } from '@apollo/client/react'
import { STAFF_LIST } from '../../graphql/queries/staff'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'

export default function Staff() {
  const { data, loading, error } = useQuery(STAFF_LIST)

  return (
    <PageWrapper>
      <PageHeader title="Staff" subtitle="Your team members" />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.staffList?.map((member) => (
          <Card key={member.id} className="flex items-center gap-4">
            <Avatar name={member.fullName} src={member.avatarUrl} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-on-surface">{member.fullName}</p>
              <p className="text-sm text-on-surface-variant truncate">{member.email}</p>
              <p className="text-sm text-on-surface-variant">{member.phone}</p>
              <Badge status={member.role?.toLowerCase()} className="mt-2">{member.role}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </PageWrapper>
  )
}
