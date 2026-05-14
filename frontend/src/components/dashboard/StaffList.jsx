import { useQuery } from '@apollo/client/react'
import { STAFF_LIST } from '../../graphql/queries/staff'
import Card, { CardHeader, CardTitle } from '../ui/Card'
import { PageSpinner, ErrorMessage } from '../ui/Spinner'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'

export default function StaffList() {
  const { data, loading, error } = useQuery(STAFF_LIST)

  return (
    <Card padding={false}>
      <CardHeader className="px-5 pt-5 pb-0">
        <CardTitle>Staff Members</CardTitle>
      </CardHeader>
      <div className="p-5">
        {loading && <PageSpinner />}
        {error && <ErrorMessage message={error.message} />}
        <div className="space-y-3">
          {data?.staffList?.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar name={member.fullName} src={member.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{member.fullName}</p>
                <p className="text-xs text-on-surface-variant">{member.phone || member.email}</p>
              </div>
              <Badge status={member.role?.toLowerCase()}>{member.role}</Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
