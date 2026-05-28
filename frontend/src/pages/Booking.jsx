import { Scissors, Calendar, Clock } from 'lucide-react'

export default function Booking() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-violet-700 mb-1">Book an Appointment</h1>
        <p className="text-gray-500">Choose a service and we'll find the perfect slot for you.</p>
      </div>

      <div className="grid gap-4">
        {[
          { icon: Scissors, label: 'Hair & Braids', desc: 'Weaves, box braids, cuts & more', color: 'violet' },
          { icon: Calendar, label: 'Nails', desc: 'Gel sets, manicures & nail art', color: 'pink' },
          { icon: Clock,    label: 'Lashes & Colour', desc: 'Extensions, tints & colouring', color: 'rose' },
        ].map(({ icon: Icon, label, desc, color }) => (
          <button
            key={label}
            className={`flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-${color}-400 hover:shadow-md transition-all text-left`}
          >
            <span className={`p-3 rounded-xl bg-${color}-100 text-${color}-600`}>
              <Icon size={22} />
            </span>
            <div>
              <p className="font-semibold text-gray-800">{label}</p>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-10 p-5 bg-violet-50 border border-violet-200 rounded-2xl text-center">
        <p className="text-sm text-violet-700 font-medium">
          💬 Chat with our booking assistant. Just type what you need!
        </p>
      </div>
    </main>
  )
}
