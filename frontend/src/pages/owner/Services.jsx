import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Camera, X, ChevronDown, Trash2, Eye, EyeOff, Pencil } from 'lucide-react'
import { SERVICES } from '../../graphql/queries/services'
import { CREATE_SERVICE, UPDATE_SERVICE, TOGGLE_SERVICE, DELETE_SERVICE } from '../../graphql/mutations/services'
import { SALON_SETTINGS } from '../../graphql/queries/tenant'
import PageWrapper from '../../components/layout/PageWrapper'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'
import { CATEGORY_CHIPS, DURATIONS, formatDuration } from '../../lib/services'

const BURG   = '#3B2A1E'
const TEXT   = '#241812'
const MUTED  = '#5C4C3D'
const HINT   = '#8A7A6A'
const BORDER = '#EDE3D6'
const BLUSH  = '#FBF7F1'
const PAGE   = '#F7F2EC'

const sans = "'Inter', sans-serif"

const LABEL = {
  fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: 8,
}

const FIELD = {
  width: '100%', boxSizing: 'border-box', backgroundColor: '#fff',
  border: '1.5px solid #C9B49C', borderRadius: 12, padding: '13px 14px',
  fontFamily: sans, fontSize: 14, fontWeight: 400, color: TEXT, outline: 'none',
}

function pillStyle(active) {
  return {
    fontFamily: sans, fontSize: 13, fontWeight: 500,
    padding: '11px 20px', borderRadius: 999, cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.1s',
    backgroundColor: active ? BURG : '#fff',
    color: active ? '#fff' : TEXT,
    border: active ? 'none' : `0.5px solid ${BORDER}`,
  }
}

// Read an image file as a base64 data URL for the mutation to store.
function readImage(file, onDone, onError) {
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    onError('Use a JPG, PNG or WEBP image.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    onError('Image must be under 5 MB.')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => onDone(e.target.result)
  reader.readAsDataURL(file)
}

function priceLabel(service) {
  const from = Number(service.priceZmw)
  const to = service.priceMaxZmw != null ? Number(service.priceMaxZmw) : null
  return to != null && to !== from ? `${from} to ${to}` : `${from}`
}

// ── One boxed figure under a service (duration / price / deposit) ─────────────
function StatBox({ label, value, unit, onClick, caret }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, minWidth: 0, backgroundColor: BLUSH, borderRadius: 12,
        padding: '10px 12px', cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={{ ...LABEL, fontSize: 9, marginBottom: 4 }}>{label}</span>
      <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 500, color: TEXT, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        {unit && <span style={{ fontSize: 11, fontWeight: 400, color: MUTED }}>{unit}</span>}
        {caret && <ChevronDown size={13} color={MUTED} style={{ flexShrink: 0 }} />}
      </span>
    </div>
  )
}

// ── Service card ──────────────────────────────────────────────────────────────
function ServiceCard({ service, onSave, onToggle, onDelete, onEdit }) {
  const [name, setName] = useState(service.name)
  const [description, setDescription] = useState(service.description || '')
  const [imgError, setImgError] = useState('')
  const fileRef = useRef(null)

  // Server is the source of truth — resync when a refetch brings new values.
  useEffect(() => { setName(service.name) }, [service.name])
  useEffect(() => { setDescription(service.description || '') }, [service.description])

  function save(patch) {
    onSave({ id: service.id, ...patch })
  }

  function pickImage(file) {
    setImgError('')
    readImage(file, (dataUrl) => save({ imageUrl: dataUrl }), setImgError)
  }

  const inlineInput = {
    border: 'none', borderBottom: '0.5px solid transparent', background: 'transparent',
    fontFamily: sans, outline: 'none', color: TEXT, padding: '1px 0', width: '100%',
  }

  return (
    <div
      style={{
        backgroundColor: '#fff', borderRadius: 16, padding: 14,
        marginBottom: 12, opacity: service.isActive ? 1 : 0.55,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Photo */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title={service.imageUrl ? 'Change photo' : 'Add a photo'}
          style={{
            width: 76, height: 76, borderRadius: 14, flexShrink: 0, cursor: 'pointer',
            border: 'none', padding: 0, overflow: 'hidden',
            backgroundColor: service.imageUrl ? BORDER : '#F6E9EA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {service.imageUrl
            ? <img src={service.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <Camera size={22} color={HINT} />}
        </button>

        {/* Name + description */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => (e.target.style.borderBottomColor = BORDER)}
            onBlur={(e) => {
              e.target.style.borderBottomColor = 'transparent'
              const next = e.target.value.trim()
              if (next && next !== service.name) save({ name: next })
              else setName(service.name)
            }}
            style={{ ...inlineInput, fontSize: 16, fontWeight: 600 }}
          />
          <input
            value={description}
            placeholder="Add a short description (optional)"
            onChange={(e) => setDescription(e.target.value)}
            onFocus={(e) => (e.target.style.borderBottomColor = BORDER)}
            onBlur={(e) => {
              e.target.style.borderBottomColor = 'transparent'
              if (e.target.value.trim() !== (service.description || '')) save({ description: e.target.value.trim() })
            }}
            style={{ ...inlineInput, fontSize: 13, fontWeight: 300, color: MUTED, marginTop: 3 }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => onEdit(service)}
            title="Edit service"
            style={{ width: 34, height: 34, borderRadius: 10, border: `0.5px solid ${BORDER}`, backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Pencil size={14} color={TEXT} />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Change photo"
            style={{ width: 34, height: 34, borderRadius: 10, border: `0.5px solid ${BORDER}`, backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Camera size={15} color={TEXT} />
          </button>
          <button
            type="button"
            onClick={() => onToggle(service.id)}
            title={service.isActive ? 'Hide from customers' : 'Show to customers'}
            style={{ width: 34, height: 34, borderRadius: 10, border: `0.5px solid ${BORDER}`, backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {service.isActive ? <EyeOff size={15} color={TEXT} /> : <Eye size={15} color={TEXT} />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(service)}
            title="Delete this service"
            style={{ width: 34, height: 34, borderRadius: 10, border: `0.5px solid ${BORDER}`, backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Trash2 size={15} color="#b4413c" />
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => pickImage(e.target.files?.[0])}
        />
      </div>

      {imgError && (
        <p style={{ fontFamily: sans, fontSize: 11, color: '#dc2626', margin: '8px 0 0' }}>{imgError}</p>
      )}

      {!service.isActive && (
        <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: HINT, margin: '8px 0 0' }}>
          Hidden from customers. Tap the eye to show it again.
        </p>
      )}

      {/* Figures */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <StatBox label="Duration" value={formatDuration(service.durationMinutes)} onClick={() => onEdit(service)} caret />
        <StatBox label="Price" value={priceLabel(service)} unit="ZMW" onClick={() => onEdit(service)} caret />
        <StatBox label="Deposit" value={Number(service.depositZmw ?? 0)} unit="ZMW" onClick={() => onEdit(service)} caret />
      </div>
    </div>
  )
}

// ── Service sheet (create + edit) ───────────────────────────────────────────────
function ServiceSheet({ categories, initialCategory, editing, onClose, onSubmit, saving }) {
  const blank = {
    name: editing?.name ?? '',
    category: editing?.category ?? (initialCategory || categories[0] || ''),
    description: editing?.description ?? '',
    durationMinutes: editing?.durationMinutes ?? '',
    priceZmw: editing?.priceZmw ?? '',
    priceMaxZmw: editing?.priceMaxZmw ?? '',
    depositZmw: editing?.depositZmw ?? '',
    imageUrl: editing?.imageUrl ?? '',
  }
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [customCategory, setCustomCategory] = useState(!categories.includes(blank.category) && !!blank.category)
  const fileRef = useRef(null)
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  function submit() {
    setError('')
    if (!form.name.trim()) return setError('Give the service a name.')
    if (!form.category) return setError('Pick a category.')
    if (!form.durationMinutes) return setError('Choose how long it takes.')
    if (!form.priceZmw) return setError('Enter a starting price.')

    const from = parseFloat(form.priceZmw)
    const to = form.priceMaxZmw ? parseFloat(form.priceMaxZmw) : null
    if (to != null && to < from) return setError('"Price to" cannot be less than "Price from".')
    const deposit = parseFloat(form.depositZmw) || 0
    // Mirrors the DB constraint (deposit <= price) so it fails here with a
    // readable message instead of as a database error.
    if (deposit > from) return setError('Deposit cannot be more than the starting price.')

    onSubmit({
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      durationMinutes: Number(form.durationMinutes),
      priceZmw: from,
      priceMaxZmw: to,
      depositZmw: deposit,
      imageUrl: form.imageUrl,
      bufferMinutes: 0,
      requiresReferencePicture: false,
    })
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(36,24,18,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: PAGE, width: '100%', maxWidth: 560,
          borderRadius: '22px 22px 0 0', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '10px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: BORDER }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 16px', borderBottom: `0.5px solid ${BORDER}`, flexShrink: 0 }}>
          <h2 style={{ fontFamily: sans, fontSize: 22, fontWeight: 500, color: TEXT, margin: 0 }}>{editing ? 'Edit service' : 'New service'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
            <X size={20} color={MUTED} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && <ErrorMessage message={error} />}

          <div>
            <label style={LABEL}>Service name</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Acrylic Full Set"
              style={FIELD}
            />
          </div>

          <div>
            <label style={LABEL}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCustomCategory(false); set('category', c) }}
                  style={pillStyle(!customCategory && form.category === c)}
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setCustomCategory(true); set('category', '') }}
                style={pillStyle(customCategory)}
              >
                + Add your own
              </button>
            </div>
            {customCategory && (
              <input
                autoFocus
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                placeholder="e.g. Bridal Packages"
                style={{ ...FIELD, marginTop: 10 }}
              />
            )}
          </div>

          <div>
            <label style={LABEL}>Description <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="A short line customers will see…"
              rows={2}
              style={{ ...FIELD, resize: 'none' }}
            />
          </div>

          <div>
            <label style={LABEL}>Duration</label>
            <select
              value={form.durationMinutes}
              onChange={(e) => set('durationMinutes', e.target.value)}
              style={{ ...FIELD, cursor: 'pointer', color: form.durationMinutes ? TEXT : HINT }}
            >
              <option value="">Select duration</option>
              {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <MoneyField label="Price from" value={form.priceZmw} onChange={(v) => set('priceZmw', v)} placeholder="250" />
            <MoneyField label="Price to" value={form.priceMaxZmw} onChange={(v) => set('priceMaxZmw', v)} placeholder="500" />
          </div>

          <div style={{ maxWidth: 220 }}>
            <MoneyField label="Deposit required" value={form.depositZmw} onChange={(v) => set('depositZmw', v)} placeholder="50" />
          </div>

          <div>
            <label style={LABEL}>Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 12 }}>
              <div style={{ width: 54, height: 54, borderRadius: 10, flexShrink: 0, overflow: 'hidden', backgroundColor: form.imageUrl ? BORDER : '#F6E9EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.imageUrl
                  ? <img src={form.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <Camera size={20} color={HINT} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: TEXT, margin: 0 }}>
                  {form.imageUrl ? 'Photo added' : 'Add a photo'}
                </p>
                <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, margin: '2px 0 0', lineHeight: 1.4 }}>
                  Shown to customers · no text or numbers
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: sans, fontSize: 14, fontWeight: 600, color: BURG, flexShrink: 0 }}
              >
                {form.imageUrl ? 'Change' : 'Upload'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => readImage(e.target.files?.[0], (d) => set('imageUrl', d), setError)}
              />
            </div>
          </div>
        </div>

        <div style={{ padding: 20, borderTop: `0.5px solid ${BORDER}`, flexShrink: 0 }}>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              width: '100%', fontFamily: sans, fontSize: 14, fontWeight: 600,
              padding: '15px 0', borderRadius: 12, border: 'none',
              backgroundColor: BURG, color: '#fff',
              cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add service'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MoneyField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={LABEL}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: MUTED, flexShrink: 0 }}>ZMW</span>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={FIELD}
        />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Services() {
  const { data, loading, error } = useQuery(SERVICES, { variables: { activeOnly: false } })
  const { data: settingsData } = useQuery(SALON_SETTINGS)
  const businessType = settingsData?.salonSettings?.businessType ?? 'other'
  const suggested = CATEGORY_CHIPS[businessType] ?? CATEGORY_CHIPS.other

  const allServices = data?.services ?? []

  // Categories in use, plus the suggestions for this business type so a brand
  // new salon still has something to file services under.
  const categories = useMemo(() => {
    const used = [...new Set(allServices.map((s) => s.category).filter(Boolean))].sort()
    const extra = (suggested ?? []).filter((c) => !used.includes(c))
    return [...used, ...extra]
  }, [allServices, suggested])

  const [selected, setSelected] = useState(null)
  const [showSheet, setShowSheet] = useState(false)
  const [editingService, setEditingService] = useState(null)

  // Default to the first category, and recover if the selected one disappears.
  const active = selected && categories.includes(selected) ? selected : (categories[0] ?? null)

  const refetchOpts = [{ query: SERVICES, variables: { activeOnly: false } }]
  const [createService, { loading: creating }] = useMutation(CREATE_SERVICE, { refetchQueries: refetchOpts })
  const [updateService, { loading: savingEdit }] = useMutation(UPDATE_SERVICE, { refetchQueries: refetchOpts })
  const [toggleService] = useMutation(TOGGLE_SERVICE, { refetchQueries: refetchOpts })
  const [deleteService] = useMutation(DELETE_SERVICE, { refetchQueries: refetchOpts })
  const [deleteError, setDeleteError] = useState('')

  // Deleting is permanent, so confirm by name. The server refuses outright
  // once a service has bookings; that message is surfaced as-is.
  function handleDelete(service) {
    setDeleteError('')
    if (!window.confirm(`Delete "${service.name}" permanently? This cannot be undone.`)) return
    deleteService({ variables: { id: service.id } }).catch((err) => {
      setDeleteError(err.graphQLErrors?.[0]?.message ?? err.message ?? 'Could not delete that service.')
    })
  }

  const uncategorised = allServices.filter((s) => !s.category)
  const shown = active === '__none' ? uncategorised : allServices.filter((s) => s.category === active)

  function handleSheetSubmit(vars) {
    if (vars.id != null) {
      updateService({
        variables: vars,
        onCompleted: () => { setEditingService(null); setSelected(vars.category) },
      })
    } else {
      createService({
        variables: vars,
        onCompleted: () => { setShowSheet(false); setSelected(vars.category) },
      })
    }
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 26 }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 500, color: TEXT, margin: 0, lineHeight: 1.15 }}>
            Services
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, margin: '4px 0 0' }}>
            Manage your service menu
          </p>
        </div>
        <button
          onClick={() => setShowSheet(true)}
          style={{ flexShrink: 0, fontFamily: sans, fontSize: 14, fontWeight: 600, padding: '13px 24px', borderRadius: 14, border: 'none', backgroundColor: BURG, color: '#fff', cursor: 'pointer' }}
        >
          + Add
        </button>
      </div>

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {!loading && (
        <>
          {/* Category filter */}
          {(categories.length > 0 || uncategorised.length > 0) && (
            <div style={{ marginBottom: 26 }}>
              <p style={{ ...LABEL, marginBottom: 10 }}>Categories</p>
              <div
                className="cat-pill-row"
                style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}
              >
                {categories.map((c) => (
                  <button key={c} type="button" onClick={() => setSelected(c)} style={pillStyle(active === c)}>
                    {c}
                  </button>
                ))}
                {uncategorised.length > 0 && (
                  <button type="button" onClick={() => setSelected('__none')} style={pillStyle(active === '__none')}>
                    Uncategorised
                  </button>
                )}
              </div>
              <style>{`.cat-pill-row::-webkit-scrollbar { display: none; }`}</style>
            </div>
          )}

          {/* Selected category */}
          {active && (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: sans, fontSize: 22, fontWeight: 500, color: TEXT, margin: 0 }}>
                {active === '__none' ? 'Uncategorised' : active}
              </h2>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED }}>
                {shown.length} service{shown.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {deleteError && <ErrorMessage message={deleteError} />}

          {shown.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              onSave={(vars) => updateService({ variables: vars })}
              onToggle={(id) => toggleService({ variables: { id } })}
              onDelete={handleDelete}
              onEdit={setEditingService}
            />
          ))}

          {active && shown.length === 0 && (
            <p style={{ textAlign: 'center', fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, padding: '36px 0' }}>
              Nothing in {active === '__none' ? 'Uncategorised' : active} yet. Tap “+ Add” to create one.
            </p>
          )}

          {categories.length === 0 && uncategorised.length === 0 && (
            <p style={{ textAlign: 'center', fontFamily: sans, fontSize: 13, fontWeight: 300, color: MUTED, padding: '40px 0' }}>
              No services yet. Tap “+ Add” to create your first one.
            </p>
          )}
        </>
      )}

      {showSheet && (
        <ServiceSheet
          categories={categories}
          initialCategory={active === '__none' ? null : active}
          onClose={() => setShowSheet(false)}
          onSubmit={handleSheetSubmit}
          saving={creating}
        />
      )}

      {editingService && (
        <ServiceSheet
          categories={categories}
          editing={editingService}
          onClose={() => setEditingService(null)}
          onSubmit={handleSheetSubmit}
          saving={savingEdit}
        />
      )}
    </PageWrapper>
  )
}
