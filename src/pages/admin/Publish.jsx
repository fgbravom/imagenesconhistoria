import { useState } from 'react'
import { insforge } from '../../lib/insforge'
import { uploadImage, removeImage, toRecord } from '../../lib/photoRecords'
import { useStatus } from '../../lib/useStatus'
import { PageHeader, StatusBanner } from '../../components/admin/ui'
import PhotoForm from '../../components/admin/PhotoForm'

/* ── Publicar fotografía: ahora o en cola ── */
export default function Publish() {
  const [mode, setMode] = useState('now') // 'now' | 'queue'
  const [status, setStatus, clearStatus] = useStatus()

  async function handleSubmit({ fields, file }) {
    setStatus(null)

    const { key, url, error: uploadErr } = await uploadImage(file)
    if (uploadErr) return { error: 'Error al subir la imagen.' }

    const payload = { ...toRecord(fields), image_url: url, image_key: key }

    const { error: dbErr } = mode === 'now'
      ? await insforge.database.from('photos').insert([{ ...payload, featured: false }])
      : await insforge.database.from('photo_queue').insert([{ ...payload, status: 'pending' }])

    if (dbErr) {
      // No dejar el archivo huérfano en el bucket.
      await removeImage(key)
      return { error: mode === 'now' ? 'Error al guardar en la base de datos.' : 'Error al guardar en la cola.' }
    }

    if (mode === 'now') {
      setStatus({
        type: 'success',
        msg: 'Fotografía publicada.',
        link: { to: '/admin/fotos', label: 'Marcarla como portada' },
      })
    } else {
      setStatus({
        type: 'success',
        msg: 'Fotografía agregada a la cola. Se publicará automáticamente según su turno.',
        link: { to: '/admin/cola', label: 'Ver cola' },
      })
      window.dispatchEvent(new CustomEvent('queue-updated'))
    }
  }

  return (
    <>
      <PageHeader
        title="Publicar fotografía"
        description={mode === 'now'
          ? 'La fotografía queda visible en el sitio de inmediato.'
          : 'Se guarda en la cola; una Schedule de InsForge publica automáticamente la más antigua (o de menor orden) cada semana.'}
      />

      <div className="inline-flex border border-stone-700 mb-8">
        <button
          type="button"
          onClick={() => setMode('now')}
          className={`px-4 py-2 text-xs font-sans uppercase tracking-widest transition-colors ${
            mode === 'now' ? 'bg-brand-red text-white' : 'text-stone-400 hover:text-stone-100'
          }`}
        >
          Publicar ahora
        </button>
        <button
          type="button"
          onClick={() => setMode('queue')}
          className={`px-4 py-2 text-xs font-sans uppercase tracking-widest transition-colors border-l border-stone-700 ${
            mode === 'queue' ? 'bg-stone-100 text-stone-950' : 'text-stone-400 hover:text-stone-100'
          }`}
        >
          Agregar a la cola
        </button>
      </div>

      <StatusBanner status={status} onDismiss={clearStatus} className="mb-8" />

      <PhotoForm
        requireImage
        onSubmit={handleSubmit}
        submitLabel={mode === 'now' ? 'Publicar fotografía' : 'Agregar a la cola'}
        savingLabel={mode === 'now' ? 'Publicando...' : 'Agregando...'}
        submitClassName={mode === 'now'
          ? 'bg-brand-red text-white hover:bg-red-700'
          : 'bg-stone-100 text-stone-950 hover:bg-white'}
      />
    </>
  )
}
