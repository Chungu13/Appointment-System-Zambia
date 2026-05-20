import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { X, Pencil, Plus } from 'lucide-react'
import { SERVICES } from '../../graphql/queries/services'
import { CREATE_SERVICE, UPDATE_SERVICE, TOGGLE_SERVICE } from '../../graphql/mutations/services'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input, { Textarea } from '../../components/ui/Input'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { formatZMW } from '../../lib/utils'
import { Clock } from 'lucide-react'

const CATEGORIES = ['hair', 'nails', 'braids', 'colour', 'lashes', 'other']

const EMPTY_FORM = {
  name: '',
  category: 'hair',
  description: '',
  durationMinutes: 60,
  priceZmw: '',
  depositZmw: '',
  bufferMinutes: 0,
}

function ServiceModal({ service, onClose, onSaved }) {
  const isNew = !service
  const [form, setForm] = useState(
    isNew
      ? EMPTY_FORM
      : {
          name: service.name,
          category: service.category,
          description: service.description || '',
          durationMinutes: service.durationMinutes,
          priceZmw: service.priceZmw,
          depositZmw: service.depositZmw,
          bufferMinutes: service.bufferMinutes || 0,
        },
  )

  const [createService, { loading: creating }] = useMutation(CREATE_SERVICE, {
    refetchQueries: [{ query: SERVICES, variables: { activeOnly: false } }],
    onCompleted: () => { onSaved(); onClose() },
  })
  const [updateService, { loading: updating }] = useMutation(UPDATE_SERVICE, {
    refetchQueries: [{ query: SERVICES, variables: { activeOnly: false } }],
    onCompleted: () => { onSaved(); onClose() },
  })

  const loading = creating || updating

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function submit(e) {
    e.preventDefault()
    const vars = {
      name: form.name,
      category: form.category,
      description: form.description,
      durationMinutes: Number(form.durationMinutes),
      priceZmw: Number(form.priceZmw),
      depositZmw: Number(form.depositZmw) || 0,
      bufferMinutes: Number(form.bufferMinutes) || 0,
    }
    if (isNew) {
      createService({ variables: vars })
    } else {
      updateService({ variables: { id: service.id, ...vars } })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h2 className="font-display text-lg font-semibold text-on-surface">
            {isNew ? 'New service' : 'Edit service'}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <Input
            label="Service name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Box Braids"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-on-surface-variant">Category</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full rounded-xl border border-outline-variant px-3 py-2.5 text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Brief description…"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (min)"
              type="number"
              min={5}
              step={5}
              value={form.durationMinutes}
              onChange={(e) => set('durationMinutes', e.target.value)}
              required
            />
            <Input
              label="Buffer (min)"
              type="number"
              min={0}
              step={5}
              value={form.bufferMinutes}
              onChange={(e) => set('bufferMinutes', e.target.value)}
            />
            <Input
              label="Price (ZMW)"
              type="number"
              min={0}
              step={0.01}
              value={form.priceZmw}
              onChange={(e) => set('priceZmw', e.target.value)}
              required
            />
            <div className="flex flex-col gap-1">
              <Input
                label="Deposit (ZMW)"
                type="number"
                min={0}
                step={0.01}
                value={form.depositZmw}
                onChange={(e) => set('depositZmw', e.target.value)}
              />
              <p className="text-xs text-on-surface-variant">
                Set to 0 for pay-at-salon — customers book instantly with no upfront payment
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={!form.name || !form.priceZmw}
              className="flex-1"
            >
              {isNew ? 'Create' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Services() {
  const { data, loading, error } = useQuery(SERVICES, { variables: { activeOnly: false } })
  const [modal, setModal] = useState(null) // null | 'new' | service object

  const [toggleService, { loading: toggling }] = useMutation(TOGGLE_SERVICE, {
    refetchQueries: [{ query: SERVICES, variables: { activeOnly: false } }],
  })

  return (
    <PageWrapper>
      <PageHeader
        title="Services"
        subtitle="Manage your service menu"
        action={
          <Button size="sm" onClick={() => setModal('new')}>
            <Plus size={16} />
            New service
          </Button>
        }
      />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.services?.map((service) => (
          <Card key={service.id} className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-on-surface text-sm">{service.name}</span>
                <Badge color={service.isActive ? 'green' : 'gray'}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {service.description && (
                <p className="text-xs text-on-surface-variant mb-2 line-clamp-2">{service.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-3">
                <span className="flex items-center gap-1"><Clock size={11} />{service.durationMinutes} min</span>
                <span className="font-semibold text-on-surface">{formatZMW(service.priceZmw)}</span>
                <span>Deposit: {formatZMW(service.depositZmw)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModal(service)}
                  className="flex items-center gap-1"
                >
                  <Pencil size={13} /> Edit
                </Button>
                <Button
                  variant={service.isActive ? 'outline' : 'secondary'}
                  size="sm"
                  loading={toggling}
                  onClick={() => toggleService({ variables: { id: service.id } })}
                >
                  {service.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
            <Badge color="primary">{service.category}</Badge>
          </Card>
        ))}
      </div>

      {modal && (
        <ServiceModal
          service={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {}}
        />
      )}
    </PageWrapper>
  )
}
