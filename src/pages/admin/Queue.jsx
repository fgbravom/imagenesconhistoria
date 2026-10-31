import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Upload, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { insforge } from '../../lib/insforge'
import { updateWithImage, deleteWithImage } from '../../lib/photoRecords'
import { useStatus } from '../../lib/useStatus'
import { PageHeader, StatusBanner, ListSkeleton } from '../../components/admin/ui'
import PhotoForm from '../../components/admin/PhotoForm'

async function fetchPending() {
  const { data } = await insforge.database
    .from('photo_queue')
    .select('id, title, story, year, photographer, location, image_url, image_key, queue_order, created_at')
    .eq('status', 'pending')
    .order('queue_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  return data ?? []
}

async function fetchPublished() {
  const { data } = await insforge.database
    .from('photo_queue')
    .select('id, title, year, image_url, published_at, published_photo_id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  return data ?? []
}

const dateFormat = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

/* ── Cola de publicación automática ── */
export default function Queue() {
  const [tab, setTab] = useState('pending') // 'pending' | 'published'
  const [queue, setQueue] = useState([])
  const [published, setPublished] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [status, setStatus, clearStatus] = useStatus()

  useEffect(() => {
    Promise.all([fetchPending(), fetchPublished()]).then(([pending, done]) => {
      setQueue(pending)
      setPublished(done)
      setLoading(false)
    })
  }, [])

  async function refresh() {
    const [pending, done] = await Promise.all([fetchPending(), fetchPublished()])
    setQueue(pending)
    setPublished(done)
    window.dispatchEvent(new CustomEvent('queue-updated'))
  }

  async function handlePublishNow() {
    setPublishing(true)
    setStatus(null)
    const { error } = await insforge.database.rpc('publish_next_queued_photo')
    setPublishing(false)
    if (error) {
      setStatus({ type: 'error', msg: 'Error al publicar.' })
      return
    }
    setStatus({ type: 'success', msg: 'Fotografía publicada desde la cola.' })
    refresh()
  }

  async function updateOrder(item, value) {
    const queue_order = value === '' ? null : parseInt(value)
    if (queue_order === item.queue_order) return
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, queue_order } : q))
    const { error } = await insforge.database.from('photo_queue').update({ queue_order }).eq('id', item.id)
    if (error) setStatus({ type: 'error', msg: 'Error al cambiar el orden.' })
    refresh()
  }

  async function handleSave(item, values) {
    const { changes, error } = await updateWithImage('photo_queue', item, values)
    if (error) return { error }
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, ...changes } : q))
    setEditingId(null)
    setStatus({ type: 'success', msg: 'Cambios guardados.' })
  }

  async function handleDelete(item) {
    if (!confirm(`¿Quitar "${item.title}" de la cola? La imagen también se borrará.`)) return
    setStatus(null)
    const { error } = await deleteWithImage('photo_queue', item)
    if (error) {
      setStatus({ type: 'error', msg: 'Error al quitar la fotografía de la cola.' })
      return
    }
    setStatus({ type: 'success', msg: `"${item.title}" quitada de la cola.` })
    refresh()
  }

  return (
    <>
      <PageHeader
        title="Cola"
        description="Una Schedule de InsForge publica automáticamente cada semana la fotografía de menor orden (o la más antigua). Deja el orden vacío para respetar la fecha de ingreso."
        actions={
          <Link to="/admin/publicar"
            className="flex items-center gap-2 border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-stone-100 px-4 py-2 text-xs font-sans uppercase tracking-widest transition-colors">
            <Upload className="w-3.5 h-3.5" /> Agregar
          </Link>
        }
      />

      <div className="flex border-b border-stone-800 mb-6" role="tablist">
        {[
          ['pending', 'Pendientes', queue.length],
          ['published', 'Publicadas', published.length],
        ].map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px px-4 py-2.5 border-b-2 text-xs font-sans uppercase tracking-widest transition-colors ${
              tab === key
                ? 'border-brand-red text-stone-100'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            {label}
            {!loading && <span className="ml-2 text-stone-600">{count}</span>}
          </button>
        ))}
      </div>

      <StatusBanner status={status} onDismiss={clearStatus} className="mb-6" />

      {loading ? (
        <ListSkeleton rows={2} />
      ) : tab === 'published' ? (
        <PublishedList items={published} />
      ) : queue.length > 0 ? (
        <>
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={handlePublishNow}
              disabled={publishing}
              className="flex items-center gap-1 text-xs font-sans text-stone-300 hover:text-brand-red border border-stone-700 hover:border-brand-red px-3 py-1.5 transition-colors uppercase tracking-widest disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              {publishing ? 'Publicando...' : 'Publicar la siguiente ahora'}
            </button>
          </div>
          <div className="divide-y divide-stone-800 border border-stone-800">
            {queue.map((item, i) => (
              <div key={item.id}>
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                  <img src={item.image_url} alt={item.title} loading="lazy" className="w-14 h-11 sm:w-16 sm:h-12 object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {i === 0 && (
                        <span className="bg-brand-red text-white text-xs px-1.5 py-0.5 uppercase tracking-widest font-sans flex-shrink-0">
                          Siguiente
                        </span>
                      )}
                      <p className="text-stone-100 text-sm font-sans font-medium truncate">{item.title}</p>
                    </div>
                    <p className="text-stone-500 text-xs font-sans truncate">
                      {[item.year, item.location].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <input
                      type="number"
                      defaultValue={item.queue_order ?? ''}
                      onBlur={e => updateOrder(item, e.target.value)}
                      placeholder="Orden"
                      aria-label="Orden en la cola"
                      title="Orden manual (menor se publica antes); vacío = por fecha de ingreso"
                      className="input-field w-16 sm:w-20 px-2 text-center"
                    />
                    <button
                      onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                      aria-label={editingId === item.id ? 'Cerrar edición' : 'Editar fotografía en cola'}
                      className="flex items-center gap-1 text-xs font-sans text-stone-400 hover:text-stone-100 border border-stone-700 hover:border-stone-500 p-2 sm:px-3 sm:py-1.5 transition-colors uppercase tracking-widest"
                    >
                      <Pencil className="w-3 h-3" />
                      <span className="hidden sm:inline">{editingId === item.id ? 'Cerrar' : 'Editar'}</span>
                      {editingId === item.id
                        ? <ChevronUp className="w-3 h-3 hidden sm:block" />
                        : <ChevronDown className="w-3 h-3 hidden sm:block" />}
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      aria-label="Quitar de la cola"
                      title="Quitar de la cola"
                      className="text-stone-600 hover:text-brand-red active:text-brand-red p-2.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {editingId === item.id && (
                  <PhotoForm
                    record={item}
                    onSubmit={values => handleSave(item, values)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Guardar cambios"
                    savingLabel="Guardando..."
                  />
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-stone-600 font-sans text-sm">
          La cola está vacía.{' '}
          <Link to="/admin/publicar" className="text-stone-400 underline underline-offset-2 hover:text-stone-100">
            Agrega fotos
          </Link>{' '}
          para las próximas publicaciones automáticas.
        </p>
      )}
    </>
  )
}

function PublishedList({ items }) {
  if (items.length === 0) {
    return <p className="text-stone-600 font-sans text-sm">Todavía no se ha publicado nada desde la cola.</p>
  }

  return (
    <div className="divide-y divide-stone-800 border border-stone-800">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
          <img src={item.image_url} alt={item.title} loading="lazy" className="w-14 h-11 sm:w-16 sm:h-12 object-cover flex-shrink-0 grayscale" />
          <div className="flex-1 min-w-0">
            <p className="text-stone-100 text-sm font-sans font-medium truncate">{item.title}</p>
            <p className="text-stone-500 text-xs font-sans truncate">
              {item.published_at ? `Publicada el ${dateFormat.format(new Date(item.published_at))}` : 'Publicada'}
            </p>
          </div>
          {item.published_photo_id ? (
            <Link to={`/foto/${item.published_photo_id}`}
              className="text-xs font-sans text-stone-400 hover:text-stone-100 uppercase tracking-widest flex-shrink-0">
              Ver
            </Link>
          ) : (
            <span className="text-xs font-sans text-stone-600 flex-shrink-0">Eliminada del sitio</span>
          )}
        </div>
      ))}
    </div>
  )
}
