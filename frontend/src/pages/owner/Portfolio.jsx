import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Images, Plus, Trash2, X, ChevronUp, ChevronDown, Camera } from 'lucide-react'
import { PORTFOLIO_IMAGES } from '../../graphql/queries/portfolio'
import { ADD_PORTFOLIO_IMAGE, DELETE_PORTFOLIO_IMAGE, REORDER_PORTFOLIO_IMAGES } from '../../graphql/mutations/portfolio'
import { SERVICES } from '../../graphql/queries/services'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'

const BURG    = '#6B2737'
const TEXT    = '#1a0a0d'
const MUTED   = '#b09090'
const HINT    = '#c0a8a8'
const BORDER  = '#ede5e7'
const BLUSH   = '#fdf8f8'

const sans  = "'Inter', sans-serif"
const serif = "'Inter', sans-serif"

// ── Upload modal ──────────────────────────────────────────────────────────────

function UploadModal({ services, onClose, onSave }) {
  const [preview, setPreview] = useState(null)
  const [dataUrl, setDataUrl] = useState(null)
  const [caption, setCaption] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef()

  function processFile(file) {
    setError(null)
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG files are accepted.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setDataUrl(e.target.result)
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files?.[0])
  }

  function submit() {
    if (!dataUrl) {
      setError('Please choose a photo first.')
      return
    }
    onSave({ imageUrl: dataUrl, caption, serviceId: serviceId ? parseInt(serviceId) : null })
  }

  const fieldStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '9px 12px', border: `0.5px solid ${BORDER}`,
    fontFamily: sans, fontSize: 12, fontWeight: 300,
    color: TEXT, backgroundColor: '#fff', outline: 'none',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `0.5px solid ${BORDER}` }}>
          <h2 style={{ fontFamily: serif, fontSize: 20, fontWeight: 300, color: TEXT, margin: 0 }}>Add portfolio photo</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: '#dc2626', margin: 0 }}>{error}</p>}

          {preview ? (
            <div style={{ position: 'relative' }}>
              <img src={preview} alt="Preview" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', border: `0.5px solid ${BORDER}` }} />
              <button
                onClick={() => { setPreview(null); setDataUrl(null) }}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                height: 160, border: `0.5px solid ${dragOver ? BURG : BORDER}`,
                backgroundColor: dragOver ? BLUSH : '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8, cursor: 'pointer',
                transition: 'border-color 0.1s, background-color 0.1s',
              }}
            >
              <Camera size={24} color={MUTED} />
              <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED }}>Click or drag a photo here</span>
              <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: HINT }}>JPG or PNG, max 5 MB</span>
            </div>
          )}

          <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => processFile(e.target.files?.[0])} />

          <div>
            <label style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: 6 }}>
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Knotless box braids"
              style={fieldStyle}
              onFocus={(e) => (e.target.style.borderColor = BURG)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
          </div>

          {services?.length > 0 && (
            <div>
              <label style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, display: 'block', marginBottom: 6 }}>
                Tag a service (optional)
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                style={fieldStyle}
              >
                <option value="">No tag</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, padding: 20 }}>
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={submit} disabled={!dataUrl} className="flex-1">Add photo</Button>
        </div>
      </div>
    </div>
  )
}

// ── Photo card ────────────────────────────────────────────────────────────────

function PhotoCard({ image, isFirst, isLast, onDelete, onMoveUp, onMoveDown }) {
  const [confirm, setConfirm] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirm(false) }}
    >
      <img src={image.imageUrl} alt={image.caption || 'Portfolio'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(107,39,55,0.75)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 10,
        pointerEvents: hovered ? 'auto' : 'none',
      }}>
        {/* Top: reorder */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.3 : 1 }}
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.3 : 1 }}
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Bottom: caption + delete */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            {image.caption && (
              <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {image.caption}
              </p>
            )}
            {image.serviceName && (
              <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.7)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {image.serviceName}
              </p>
            )}
          </div>
          {confirm ? (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button
                onClick={() => setConfirm(false)}
                style={{ padding: '3px 8px', fontFamily: sans, fontSize: 10, fontWeight: 300, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                style={{ padding: '3px 8px', fontFamily: sans, fontSize: 10, fontWeight: 300, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Portfolio() {
  const [showModal, setShowModal] = useState(false)

  const { data, loading, error } = useQuery(PORTFOLIO_IMAGES)
  const { data: servicesData } = useQuery(SERVICES)

  const refetchOpts = { refetchQueries: [PORTFOLIO_IMAGES] }

  const [addImage, { loading: adding }] = useMutation(ADD_PORTFOLIO_IMAGE, refetchOpts)
  const [deleteImage] = useMutation(DELETE_PORTFOLIO_IMAGE, refetchOpts)
  const [reorderImages] = useMutation(REORDER_PORTFOLIO_IMAGES, refetchOpts)

  const images = data?.portfolioImages ?? []
  const services = servicesData?.services ?? []
  const atLimit = images.length >= 10

  async function handleSave({ imageUrl, caption, serviceId }) {
    await addImage({ variables: { imageUrl, caption: caption || '', serviceId: serviceId || null } })
    setShowModal(false)
  }

  async function handleDelete(id) {
    await deleteImage({ variables: { id } })
  }

  async function moveImage(index, direction) {
    const reordered = [...images]
    const swapIdx = index + direction
    if (swapIdx < 0 || swapIdx >= reordered.length) return
    ;[reordered[index], reordered[swapIdx]] = [reordered[swapIdx], reordered[index]]
    await reorderImages({ variables: { ids: reordered.map((img) => img.id) } })
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Portfolio"
        subtitle={images.length > 0 ? `${images.length} photo${images.length === 1 ? '' : 's'}` : 'Showcase your work to attract more customers'}
        action={
          atLimit ? (
            <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em', color: MUTED }}>
              10 / 10 — limit reached
            </span>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              disabled={adding}
              style={{
                background: BURG, color: '#fff', padding: '10px 20px',
                fontFamily: sans, fontSize: 10, fontWeight: 300,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                border: 'none', cursor: adding ? 'not-allowed' : 'pointer',
                opacity: adding ? 0.7 : 1,
              }}
            >
              {adding ? 'Uploading…' : 'Add Photo'}
            </button>
          )
        }
      />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {!loading && images.length === 0 && (
        <div style={{ backgroundColor: '#fff', border: `0.5px solid ${BORDER}`, padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, backgroundColor: BLUSH, border: `0.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Images size={20} color="#d4a8b0" />
          </div>
          <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: TEXT, margin: '0 0 10px' }}>No photos yet</h3>
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 300, color: MUTED, maxWidth: 300, margin: '0 auto 24px', lineHeight: 1.7 }}>
            Upload photos of your best work. Customers will see these on your public page before booking.
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: BURG, color: '#fff', padding: '10px 20px', fontFamily: sans, fontSize: 10, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}
          >
            Add your first photo
          </button>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <PhotoCard
              key={img.id}
              image={img}
              isFirst={i === 0}
              isLast={i === images.length - 1}
              onDelete={() => handleDelete(img.id)}
              onMoveUp={() => moveImage(i, -1)}
              onMoveDown={() => moveImage(i, 1)}
            />
          ))}

          {!atLimit && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                aspectRatio: '1', border: `0.5px solid ${BORDER}`, background: '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8, cursor: 'pointer',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BLUSH)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
            >
              <Plus size={20} color="#d4a8b0" />
              <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 300, color: MUTED }}>Add photo</span>
            </button>
          )}
        </div>
      )}

      {showModal && (
        <UploadModal
          services={services}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </PageWrapper>
  )
}
