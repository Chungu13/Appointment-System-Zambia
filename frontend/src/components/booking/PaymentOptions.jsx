import { classNames, formatZMW } from '../../lib/utils'

const METHODS = [
  { value: 'AIRTEL_MONEY', label: 'Airtel Money', icon: '📱', hint: 'Pay via Airtel Money' },
  { value: 'MTN_MOMO',    label: 'MTN MoMo',    icon: '💛', hint: 'Pay via MTN Mobile Money' },
  { value: 'CARD',         label: 'Card',         icon: '💳', hint: 'Visa or Mastercard' },
  { value: 'CASH',         label: 'Cash',         icon: '💵', hint: 'Pay at the salon' },
]

export default function PaymentOptions({ selected, onSelect, amount }) {
  return (
    <div className="space-y-3">
      {amount != null && (
        <p className="text-sm text-on-surface-variant mb-4">
          Deposit to pay: <strong className="text-on-surface">{formatZMW(amount)}</strong>
        </p>
      )}
      {METHODS.map((method) => (
        <button
          key={method.value}
          onClick={() => onSelect(method.value)}
          className={classNames(
            'w-full flex items-center gap-4 rounded-2xl border p-4 transition-all text-left',
            selected === method.value
              ? 'border-primary bg-primary-container/30 ring-2 ring-primary/20'
              : 'border-outline-variant bg-surface-container-lowest hover:border-primary/40'
          )}
        >
          <span className="text-2xl">{method.icon}</span>
          <div>
            <p className="font-medium text-on-surface text-sm">{method.label}</p>
            <p className="text-xs text-on-surface-variant">{method.hint}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
