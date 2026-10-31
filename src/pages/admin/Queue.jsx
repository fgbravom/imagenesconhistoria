import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Upload } from 'lucide-react'
import { insforge } from '../../lib/insforge'
import { useStatus } from '../../lib/useStatus'
import { PageHeader, StatusBanner, ListSkeleton } from '../../components/admin/ui'

async function fetchPending() {
  const { data } = await insforge.database
    .from('photo_queue')
    .select('id, title, year, image_url, queue_order, created_at')
    .eq('status', 'pending')
    .order('queue_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  return data ?? []
}

/* ── Cola de publicación automática ── */
export default function Queue() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [status, setStatus, clearStatus] = useStatus()

  useEffect(() => {
    fetchPending().then(data => {
      setQueue(data)
      setLoading(false)
    })
  }, [])

  async function refresh() {
    setQueue(await fetchPending())
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

      <StatusBanner status={status} onDismiss={clearStatus} className="mb-6" />

      {loading ? (
        <ListSkeleton rows={2} />
      ) : queue.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-stone-500 text-xs font-sans uppercase tracking-widest">
              {queue.length} en espera
            </p>
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
              <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
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
                  {item.year && <p className="text-stone-500 text-xs font-sans">{item.year}</p>}
                </div>
                <input
                  type="number"
                  defaultValue={item.queue_order ?? ''}
                  onBlur={e => updateOrder(item, e.target.value)}
                  placeholder="Orden"
                  aria-label="Orden en la cola"
                  title="Orden manual (menor se publica antes); vacío = por fecha de ingreso"
                  className="input-field w-20 px-2 text-center flex-shrink-0"
                />
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
