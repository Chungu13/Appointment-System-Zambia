import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Plus } from 'lucide-react'
import { SERVICES } from '../../graphql/queries/services'
import { CREATE_SERVICE, UPDATE_SERVICE, TOGGLE_SERVICE } from '../../graphql/mutations/services'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { CATEGORY_CHIPS, DURATIONS } from '../../lib/services'

const PRIMARY = '#6B2737'
const MUTED   = '#8B4A5A'
const BORDER  = '#D4B0B8'

function chipStyle(active) {
  return {
    border: `1px solid ${PRIMARY}`,
    borderRadius: 999,
    padding: '5px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.12s',
    backgroundColor: active ? PRIMARY : 'transparent',
    color: active ? '#fff' : PRIMARY,
    whiteSpace: 'nowrap',
    background: active ? PRIMARY : 'transparent',
  }
}

// ── Service row — inline editable ─────────────────────────────────────────────
function ServiceRow({ service, onSave, onToggle, toggling }) {
  const [name, setName] = useState(service.name)
  const [duration, setDuration] = useState(service.durationMinutes)
  const [price, setPrice] = useState(Number(service.priceZmw).toString())

  function save(overrides = {}) {
    onSave({
      id: service.id,
      name: (overrides.name ?? name).trim() || service.name,
      durationMinutes: overrides.duration ?? duration,
      priceZmw: parseFloat(overrides.price ?? price) || 0,
      depositZmw: service.depositZmw,
    })
  }

  const inputBase = {
    border: 'none',
    borderBottom: '1px solid transparent',
    padding: '2px 4px',
    fontSize: 13,
    outline: 'none',
    background: 'transparent',
    color: '#1a1a1a',
    transition: 'border-color 0.1s',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
      borderBottom: `0.5px solid ${BORDER}44`,
      opacity: service.isActive ? 1 : 0.45,
    }}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onFocus={e => (e.target.style.borderBottomColor = BORDER)}
        onBlur={e => { e.target.style.borderBottomColor = 'transparent'; save({ name: e.target.value }) }}
        style={{ ...inputBase, flex: 1, minWidth: 80 }}
      />
      <select
        value={duration}
        onChange={e => { const v = Number(e.target.value); setDuration(v); save({ duration: v }) }}
        style={{ ...inputBase, fontSize: 12, color: MUTED, cursor: 'pointer' }}
      >
        {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: MUTED }}>ZMW</span>
        <input
          type="number"
          min="0"
          value={price}
          onChange={e => setPrice(e.target.value)}
          onFocus={e => (e.target.style.borderBottomColor = BORDER)}
          onBlur={e => { e.target.style.borderBottomColor = 'transparent'; save({ price: e.target.value }) }}
          style={{ ...inputBase, width: 60, textAlign: 'right' }}
        />
      </div>
      <button
        type="button"
        title={service.isActive ? 'Deactivate' : 'Restore'}
        onClick={() => onToggle(service.id)}
        disabled={toggling}
        style={{
          fontSize: 14, lineHeight: 1, padding: '2px 6px', border: 'none',
          background: 'none', cursor: 'pointer', borderRadius: 4, flexShrink: 0,
          color: service.isActive ? '#dc2626' : '#16a34a',
        }}
      >
        {service.isActive ? '×' : '↺'}
      </button>
    </div>
  )
}

// ── Category section ──────────────────────────────────────────────────────────
function CategorySection({ category, services, onSave, onToggle, toggling, onCreate, creating }) {
  const [showDraft, setShowDraft] = useState(false)
  const blank = { name: '', durationMinutes: 60, priceZmw: '', depositZmw: '' }
  const [draft, setDraft] = useState(blank)

  function setD(k, v) { setDraft(d => ({ ...d, [k]: v })) }

  function submitDraft() {
    if (!draft.name.trim() || !draft.priceZmw) return
    onCreate(
      {
        name: draft.name.trim(),
        category,
        durationMinutes: Number(draft.durationMinutes),
        priceZmw: parseFloat(draft.priceZmw),
        depositZmw: parseFloat(draft.depositZmw) || 0,
        description: '',
        bufferMinutes: 0,
      },
      () => { setDraft(blank); setShowDraft(false) },
    )
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', backgroundColor: '#FDF5F6', borderBottom: `0.5px solid ${BORDER}` }}>
        <p style={{ fontWeight: 500, fontSize: 14, color: PRIMARY, margin: 0 }}>
          {category || 'Uncategorised'}
        </p>
        <span style={{ fontSize: 11, color: MUTED }}>
          {services.length} service{services.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Existing rows */}
      {services.map(svc => (
        <ServiceRow key={svc.id} service={svc} onSave={onSave} onToggle={onToggle} toggling={toggling} />
      ))}

      {/* Draft / add-service row */}
      {showDraft ? (
        <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${BORDER}44`, backgroundColor: '#fdf5f688' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <input
              autoFocus
              placeholder="Service name"
              value={draft.name}
              onChange={e => setD('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitDraft()}
              style={{ flex: 1, minWidth: 130, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none' }}
            />
            <select
              value={draft.durationMinutes}
              onChange={e => setD('durationMinutes', Number(e.target.value))}
              style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', background: '#fff' }}
            >
              {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <input
              placeholder="Price ZMW"
              type="number"
              min="0"
              value={draft.priceZmw}
              onChange={e => setD('priceZmw', e.target.value)}
              style={{ width: 90, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none' }}
            />
            <input
              placeholder="Deposit"
              type="number"
              min="0"
              value={draft.depositZmw}
              onChange={e => setD('depositZmw', e.target.value)}
              style={{ width: 80, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={submitDraft}
              disabled={creating || !draft.name || !draft.priceZmw}
              style={{
                fontSize: 12, fontWeight: 500, color: '#fff', backgroundColor: PRIMARY,
                border: 'none', borderRadius: 6, padding: '5px 16px', cursor: 'pointer',
                opacity: (!draft.name || !draft.priceZmw) ? 0.5 : 1,
              }}
            >
              {creating ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setDraft(blank); setShowDraft(false) }}
              style={{ fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDraft(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            padding: '9px 16px', background: 'none', border: 'none',
            borderTop: `0.5px solid ${BORDER}44`,
            fontSize: 12, color: PRIMARY, cursor: 'pointer', fontWeight: 500,
          }}
        >
          <Plus size={12} /> Add service
        </button>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Services() {
  const { data, loading, error } = useQuery(SERVICES, { variables: { activeOnly: false } })
  const { data: settingsData } = useQuery(SALON_SETTINGS)
  const businessType = settingsData?.salonSettings?.businessType ?? 'other'
  const chips = CATEGORY_CHIPS[businessType] ?? CATEGORY_CHIPS.other

  // Categories: from server data + any user-added ones not yet backed by services
  const serverCategories = useMemo(() =>
    [...new Set((data?.services ?? []).map(s => s.category).filter(Boolean))].sort(),
    [data],
  )
  const [addedCategories, setAddedCategories] = useState([])
  const categories = useMemo(() => {
    const extra = addedCategories.filter(c => !serverCategories.includes(c))
    return [...serverCategories, ...extra]
  }, [serverCategories, addedCategories])

  const [showCustom, setShowCustom] = useState(false)
  const [customInput, setCustomInput] = useState('')

  function addCategory(name) {
    const trimmed = name.trim()
    if (!trimmed || categories.includes(trimmed)) return
    setAddedCategories(p => [...p, trimmed])
    setShowCustom(false)
    setCustomInput('')
  }

  const refetchOpts = [{ query: SERVICES, variables: { activeOnly: false } }]

  const [createService, { loading: creating }] = useMutation(CREATE_SERVICE, { refetchQueries: refetchOpts })
  const [updateService] = useMutation(UPDATE_SERVICE, { refetchQueries: refetchOpts })
  const [toggleService, { loading: toggling }] = useMutation(TOGGLE_SERVICE, { refetchQueries: refetchOpts })

  function handleSave(vars) { updateService({ variables: vars }) }
  function handleToggle(id) { toggleService({ variables: { id } }) }
  function handleCreate(vars, onDone) { createService({ variables: vars, onCompleted: onDone }) }

  const allServices = data?.services ?? []
  const uncategorised = allServices.filter(s => !s.category)

  return (
    <PageWrapper>
      <PageHeader title="Services" subtitle="Manage your service menu" />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {/* Category chip row */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: MUTED, marginBottom: 10 }}>
          Add a category to get started:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {chips.map(chip => (
            <button key={chip} type="button" onClick={() => addCategory(chip)} style={chipStyle(categories.includes(chip))}>
              {chip}
            </button>
          ))}

          {showCustom ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                autoFocus
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addCategory(customInput)
                  if (e.key === 'Escape') { setShowCustom(false); setCustomInput('') }
                }}
                placeholder="Category name…"
                style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, outline: 'none', width: 140 }}
              />
              <button onClick={() => addCategory(customInput)} type="button" style={{ fontSize: 12, fontWeight: 500, color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer' }}>
                Add
              </button>
              <button onClick={() => { setShowCustom(false); setCustomInput('') }} type="button" style={{ fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              style={{ ...chipStyle(false), border: `1px dashed ${PRIMARY}` }}
            >
              + Add your own
            </button>
          )}
        </div>
      </div>

      {/* Category sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {categories.map(cat => (
          <CategorySection
            key={cat}
            category={cat}
            services={allServices.filter(s => s.category === cat)}
            onSave={handleSave}
            onToggle={handleToggle}
            toggling={toggling}
            onCreate={handleCreate}
            creating={creating}
          />
        ))}

        {uncategorised.length > 0 && (
          <CategorySection
            key="__uncategorised"
            category=""
            services={uncategorised}
            onSave={handleSave}
            onToggle={handleToggle}
            toggling={toggling}
            onCreate={handleCreate}
            creating={creating}
          />
        )}
      </div>

      {!loading && categories.length === 0 && uncategorised.length === 0 && (
        <p style={{ textAlign: 'center', color: MUTED, fontSize: 14, padding: '32px 0' }}>
          Select a category above to start adding services.
        </p>
      )}
    </PageWrapper>
  )
}
