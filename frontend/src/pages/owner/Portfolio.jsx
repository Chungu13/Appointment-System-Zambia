import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Images, Plus, Trash2, X, ChevronUp, ChevronDown, Camera } from 'lucide-react'
import { PORTFOLIO_IMAGES } from '../../graphql/queries/portfolio'
import { ADD_PORTFOLIO_IMAGE, DELETE_PORTFOLIO_IMAGE, REORDER_PORTFOLIO_IMAGES } from '../../graphql/mutations/portfolio'
import { SERVICES } from '../../graphql/queries/services'
import PageWrapper, { PageHeader } from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="font-semibold text-on-surface">Add portfolio photo</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors">
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full aspect-square object-cover rounded-xl border border-outline-variant" />
              <button
                onClick={() => { setPreview(null); setDataUrl(null) }}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container'
              }`}
            >
              <Camera size={26} className="text-on-surface-variant" />
              <span className="text-sm text-on-surface-variant">Click or drag a photo here</span>
              <span className="text-xs text-on-surface-variant/60">JPG or PNG, max 5 MB</span>
            </div>
          )}

          <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => processFile(e.target.files?.[0])} />

          <div>
            <label className="text-xs font-medium text-on-surface-variant block mb-1.5">Caption (optional)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Knotless box braids"
              className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {services?.length > 0 && (
            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1.5">Tag a service (optional)</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-background text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">No tag</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
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

  return (
    <div className="relative group rounded-2xl overflow-hidden border border-outline-variant bg-surface-container-lowest">
      <img src={image.imageUrl} alt={image.caption || 'Portfolio'} className="w-full aspect-square object-cover" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
        {/* Top: reorder */}
        <div className="flex justify-end gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1.5 bg-black/50 text-white rounded-lg disabled:opacity-30 hover:bg-black/70 transition-colors"
          >
            <ChevronUp size={15} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1.5 bg-black/50 text-white rounded-lg disabled:opacity-30 hover:bg-black/70 transition-colors"
          >
            <ChevronDown size={15} />
          </button>
        </div>

        {/* Bottom: caption + delete */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            {image.caption && (
              <p className="text-white text-xs font-medium truncate">{image.caption}</p>
            )}
            {image.serviceName && (
              <p className="text-white/70 text-xs truncate">{image.serviceName}</p>
            )}
          </div>
          {confirm ? (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setConfirm(false)}
                className="px-2 py-1 text-xs bg-white/20 text-white rounded-lg hover:bg-white/30"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="p-1.5 bg-black/50 text-white rounded-lg hover:bg-red-600/80 transition-colors shrink-0"
            >
              <Trash2 size={14} />
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
          <Button onClick={() => setShowModal(true)} loading={adding}>
            <Plus size={16} />
            Add Photo
          </Button>
        }
      />

      {loading && <PageSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {!loading && images.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
            <Images size={28} className="text-on-surface-variant" />
          </div>
          <h3 className="font-semibold text-on-surface mb-2">No photos yet</h3>
          <p className="text-sm text-on-surface-variant mb-6 max-w-xs">
            Upload photos of your best work. Customers will see these on your public page before booking.
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add your first photo
          </Button>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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

          <button
            onClick={() => setShowModal(true)}
            className="aspect-square rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary/50 hover:bg-surface-container hover:text-primary transition-colors"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">Add photo</span>
          </button>
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
