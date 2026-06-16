import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Plus } from 'lucide-react'
import { SERVICES } from '../../graphql/queries/services'
import { CREATE_SERVICE, UPDATE_SERVICE, TOGGLE_SERVICE } from '../../graphql/mutations/services'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { CATEGORY_CHIPS, DURATIONS } from '../../lib/services'

const BURG    = '#6B2737'
const TEXT    = '#1a0a0d'
const MUTED   = '#7a5060'
const HINT    = '#8a6268'
const BORDER  = '#ede5e7'

const sans = "'Inter', sans-serif"

function chipStyle(active) {
  return {
    border: `0.5px solid ${BURG}`,
    padding: '7px 16px',
    fontSize: 11,
    fontFamily: sans,
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    transition: 'all 0.1s',
    backgroundColor: active ? BURG : '#fff',
    color: active ? '#fff' : BURG,
    whiteSpace: 'nowrap',
  }
}

// ── Service row — inline editable ─────────────────────────────────────────────
function ServiceRow({ service, onSave, onToggle, toggling }) {
  const [name, setName] = useState(service.name)
  const [duration, setDuration] = useState(service.durationMinutes)
  const [price, setPrice] = useState(Number(service.priceZmw).toString())
  const [deposit, setDeposit] = useState(Number(service.depositZmw ?? 0).toString())
  const [customDur, setCustomDur] = useState(!DURATIONS.some((d) => d.value === service.durationMinutes))

  function save(overrides = {}) {
    onSave({
      id: service.id,
      name: (overrides.name ?? name).trim() || service.name,
      durationMinutes: overrides.duration ?? duration,
      priceZmw: parseFloat(overrides.price ?? price) || 0,
      depositZmw: parseFloat(overrides.deposit ?? deposit) || 0,
    })
  }

  const inputBase = {
    border: 'none',
    borderBottom: '0.5px solid transparent',
    padding: '2px 4px',
    fontFamily: sans,
    fontSize: 12,
    fontWeight: 400,
    outline: 'none',
    background: 'transparent',
    color: TEXT,
    transition: 'border-color 0.1s',
  }

  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: `0.5px solid ${BORDER}`,
      opacity: service.isActive ? 1 : 0.4,
    }}>
      {/* Row 1: Name */}
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onFocus={e => (e.target.style.borderBottomColor = BORDER)}
        onBlur={e => { e.target.style.borderBottomColor = 'transparent'; save({ name: e.target.value }) }}
        style={{ ...inputBase, width: '100%', marginBottom: 6 }}
      />
      {/* Row 2: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {customDur ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <input
              type="number"
              min="5"
              step="5"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              onFocus={e => (e.target.style.borderBottomColor = BORDER)}
              onBlur={e => { e.target.style.borderBottomColor = 'transparent'; save({ duration: Number(e.target.value) }) }}
              style={{ ...inputBase, width: 44, textAlign: 'center', fontSize: 11 }}
            />
            <span style={{ fontFamily: sans, fontSize: 10, color: MUTED }}>min</span>
            <button
              type="button"
              title="Back to presets"
              onClick={() => setCustomDur(false)}
              style={{ fontFamily: sans, fontSize: 10, color: HINT, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
            >↩</button>
          </div>
        ) : (
          <select
            value={duration}
            onChange={e => {
              if (e.target.value === 'custom') { setCustomDur(true); return }
              const v = Number(e.target.value); setDuration(v); save({ duration: v })
            }}
            style={{ ...inputBase, fontSize: 11, color: MUTED, cursor: 'pointer', flexShrink: 0 }}
          >
            {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            <option value="custom">Custom…</option>
          </select>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: MUTED }}>ZMW</span>
          <input
            type="number"
            min="0"
            value={price}
            onChange={e => setPrice(e.target.value)}
            onFocus={e => (e.target.style.borderBottomColor = BORDER)}
            onBlur={e => { e.target.style.borderBottomColor = 'transparent'; save({ price: e.target.value }) }}
            style={{ ...inputBase, width: 56, textAlign: 'right' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: MUTED }}>dep.</span>
          <input
            type="number"
            min="0"
            value={deposit}
            onChange={e => setDeposit(e.target.value)}
            onFocus={e => (e.target.style.borderBottomColor = BORDER)}
            onBlur={e => { e.target.style.borderBottomColor = 'transparent'; save({ deposit: e.target.value }) }}
            style={{ ...inputBase, width: 50, textAlign: 'right', color: MUTED }}
          />
        </div>

        <button
          type="button"
          title={service.isActive ? 'Deactivate' : 'Restore'}
          onClick={() => onToggle(service.id)}
          disabled={toggling}
          style={{
            fontSize: 16, lineHeight: 1, padding: '2px 4px', border: 'none',
            background: 'none', cursor: 'pointer', flexShrink: 0,
            color: service.isActive ? '#c0a0a8' : '#16a34a',
          }}
        >
          {service.isActive ? '×' : '↺'}
        </button>
      </div>
    </div>
  )
}

// ── Category section ──────────────────────────────────────────────────────────
function CategorySection({ category, services, onSave, onToggle, toggling, onCreate, creating }) {
  const [showDraft, setShowDraft] = useState(false)
  const blank = { name: '', durationMinutes: 60, priceZmw: '', depositZmw: '' }
  const [draft, setDraft] = useState(blank)
  const [customDraftDur, setCustomDraftDur] = useState(false)

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
      () => { setDraft(blank); setShowDraft(false); setCustomDraftDur(false) },
    )
  }

  const fieldStyle = {
    border: `0.5px solid ${BORDER}`,
    padding: '6px 10px',
    fontFamily: sans,
    fontSize: 12,
    fontWeight: 300,
    outline: 'none',
    background: '#fff',
    color: TEXT,
  }

  return (
    <div style={{ border: `0.5px solid ${BORDER}`, marginBottom: 12, backgroundColor: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `0.5px solid ${BORDER}` }}>
        <p style={{ fontFamily: sans, fontWeight: 400, fontSize: 12, color: TEXT, margin: 0 }}>
          {category || 'Uncategorised'}
        </p>
        <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED }}>
          {services.length} service{services.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Existing rows */}
      {services.map(svc => (
        <ServiceRow key={svc.id} service={svc} onSave={onSave} onToggle={onToggle} toggling={toggling} />
      ))}

      {/* Draft / add-service row */}
      {showDraft ? (
        <div style={{ padding: '12px 20px', borderTop: `0.5px solid ${BORDER}`, backgroundColor: '#fdf8f8' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <input
              autoFocus
              placeholder="Service name"
              value={draft.name}
              onChange={e => setD('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitDraft()}
              style={{ ...fieldStyle, flex: 1, minWidth: 130 }}
            />
            {customDraftDur ? (
              <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={draft.durationMinutes}
                  onChange={e => setD('durationMinutes', Number(e.target.value))}
                  style={{ width: 52, border: 'none', outline: 'none', fontFamily: sans, fontSize: 12, fontWeight: 300, color: TEXT, background: 'transparent' }}
                />
                <span style={{ fontFamily: sans, fontSize: 11, color: MUTED }}>min</span>
                <button
                  type="button"
                  title="Back to presets"
                  onClick={() => { setCustomDraftDur(false); setD('durationMinutes', 60) }}
                  style={{ fontFamily: sans, fontSize: 11, color: HINT, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >↩</button>
              </div>
            ) : (
              <select
                value={draft.durationMinutes}
                onChange={e => {
                  if (e.target.value === 'custom') { setCustomDraftDur(true); return }
                  setD('durationMinutes', Number(e.target.value))
                }}
                style={{ ...fieldStyle, cursor: 'pointer' }}
              >
                {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                <option value="custom">Custom…</option>
              </select>
            )}
            <input
              placeholder="Price ZMW"
              type="number"
              min="0"
              value={draft.priceZmw}
              onChange={e => setD('priceZmw', e.target.value)}
              style={{ ...fieldStyle, width: 90 }}
            />
            <input
              placeholder="Deposit"
              type="number"
              min="0"
              value={draft.depositZmw}
              onChange={e => setD('depositZmw', e.target.value)}
              style={{ ...fieldStyle, width: 80 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={submitDraft}
              disabled={creating || !draft.name || !draft.priceZmw}
              style={{
                fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#fff', backgroundColor: BURG,
                border: 'none', padding: '7px 18px', cursor: 'pointer',
                opacity: (!draft.name || !draft.priceZmw) ? 0.4 : 1,
              }}
            >
              {creating ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setDraft(blank); setShowDraft(false) }}
              style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}
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
            padding: '12px 20px', background: 'none', border: 'none',
            borderTop: `0.5px solid ${BORDER}`,
            fontFamily: sans, fontSize: 11, fontWeight: 300, color: BURG, cursor: 'pointer',
          }}
        >
          <Plus size={11} /> Add service
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
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>
          Add a category to get started
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
                style={{ border: `0.5px solid ${BORDER}`, padding: '7px 12px', fontFamily: sans, fontSize: 11, fontWeight: 300, outline: 'none', width: 140 }}
              />
              <button onClick={() => addCategory(customInput)} type="button" style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: BURG, background: 'none', border: 'none', cursor: 'pointer' }}>
                Add
              </button>
              <button onClick={() => { setShowCustom(false); setCustomInput('') }} type="button" style={{ fontFamily: sans, fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              style={{ ...chipStyle(false), border: `0.5px dashed ${BURG}` }}
            >
              + Add your own
            </button>
          )}
        </div>
      </div>

      {/* Category sections */}
      <div>
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
        <p style={{ textAlign: 'center', fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, padding: '40px 0' }}>
          Select a category above to start adding services.
        </p>
      )}
    </PageWrapper>
  )
}
