import { Bot, CheckCircle, XCircle, Clock } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../ui/Card'
import { PageSpinner, ErrorMessage } from '../ui/Spinner'
import { formatDateTime } from '../../lib/utils'
import { useQuery } from '@apollo/client/react'
import { AGENT_ACTIVITY } from '../../graphql/queries/bookings'

const OUTCOME_ICON = {
  success:       <CheckCircle size={14} className="text-secondary" />,
  failed:        <XCircle size={14} className="text-red-500" />,
  pending_human: <Clock size={14} className="text-yellow-600" />,
}

const AGENT_COLORS = {
  booking:     'bg-primary-container text-on-primary-container',
  scheduling:  'bg-secondary-container text-on-secondary-container',
  payment:     'bg-blue-100 text-blue-800',
  insights:    'bg-purple-100 text-purple-800',
}

export default function AgentFeed({ limit = 10 }) {
  const { data, loading, error } = useQuery(AGENT_ACTIVITY, { variables: { limit } })

  return (
    <Card padding={false}>
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-primary" />
          <CardTitle>Agent Activity</CardTitle>
        </div>
      </CardHeader>
      <div className="p-5">
        {loading && <PageSpinner />}
        {error && <ErrorMessage message={error.message} />}
        {!loading && !error && data?.agentActivity?.length === 0 && (
          <p className="text-sm text-on-surface-variant text-center py-4">No agent activity yet.</p>
        )}
        <div className="space-y-3">
          {data?.agentActivity?.map((log) => (
            <div key={log.id} className="flex items-start gap-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${AGENT_COLORS[log.agentType] ?? 'bg-surface-container text-on-surface-variant'}`}>
                {log.agentType}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface line-clamp-2">{log.action}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {OUTCOME_ICON[log.outcome]}
                  <span className="text-xs text-on-surface-variant">{formatDateTime(log.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
