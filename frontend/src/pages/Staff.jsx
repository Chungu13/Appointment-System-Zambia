import { Clock, CheckCircle, XCircle } from 'lucide-react'

function AppointmentRow({ time, customer, service, status }) {
  const statusStyles = {
    confirmed:   'bg-green-100 text-green-700',
    pending:     'bg-yellow-100 text-yellow-700',
    cancelled:   'bg-red-100   text-red-700',
  }
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-14 shrink-0">{time}</span>
      <div className="flex-1">
        <p className="font-medium text-gray-800 text-sm">{customer}</p>
        <p className="text-xs text-gray-500">{service}</p>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[status] ?? ''}`}>
        {status}
      </span>
    </div>
  )
}

export default function Staff() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-violet-700 mb-1">Staff View</h1>
        <p className="text-gray-500">Today's schedule.</p>
      </div>

      <div className="flex gap-3 mb-6">
        {[
          { icon: Clock,        label: '0 upcoming', color: 'violet' },
          { icon: CheckCircle,  label: '0 completed', color: 'green'  },
          { icon: XCircle,      label: '0 cancelled', color: 'rose'   },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-${color}-50 text-${color}-700 text-sm font-medium`}>
            <Icon size={15} /> {label}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-3">Appointments</h2>
        <p className="text-sm text-gray-400 text-center py-6">No appointments scheduled.</p>
      </div>
    </main>
  )
}
