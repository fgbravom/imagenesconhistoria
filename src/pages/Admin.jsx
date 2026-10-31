import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, X, CheckCircle, AlertCircle, Star, ImageIcon, Pencil, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { insforge } from '../lib/insforge'
import { useAuth } from '../lib/AuthContext'

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  if (authLoading || !user) return null

  return (
    <div className="min-h-screen">
      <div className="border-b border-stone-800 bg-stone-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-stone-100">Panel de Administración</h1>
            <p className="text-stone-500 text-sm font-sans mt-1">{user.email}</p>
          </div>
          <Link to="/" className="text-stone-500 text-sm font-sans hover:text-stone-300 transition-colors">
            Ver sitio →
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-16">
        <PhotoManager />
        <PublishManager />
      </div>

      <footer className="border-t border-stone-800 py-8 text-center mt-8">
        <p className="text-stone-600 text-sm font-sans">
          © {new Date().getFullYear()} Imágenes con Historia — Panel Admin
        </p>
      </footer>
    </div>
  )
}

/* ── Subida de imagen al bucket ── */
async function uploadImage(file) {
  const ext = file.name.split('.').pop()
  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await insforge.storage
    .from('photos')
    .upload(key, file, { contentType: file.type })

  if (error) return { error }

  return {
    key,
    url: data?.url ?? `${import.meta.env.VITE_INSFORGE_URL}/api/storage/buckets/photos/objects/${key}`,
  }
}

/* ── Gestión y edición de fotos ── */
function PhotoManager() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [settingFeatured, setSettingFeatured] = useState(null)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetchAll()
    window.addEventListener('photo-uploaded', fetchAll)
    return () => window.removeEventListener('photo-uploaded', fetchAll)
  }, [])

  async function fetchAll() {
    setLoading(true)
    const { data } = await insforge.database
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }

  async function setFeatured(photoId) {
    setSettingFeatured(photoId)
    setStatus(null)

    // Primero desmarcar la portada actual (solo la que tiene featured=true)
    await insforge.database
      .from('photos')
      .update({ featured: false })
      .eq('featured', true)

    // Luego marcar la nueva
    const { error } = await insforge.database
      .from('photos')
      .update({ featured: true })
      .eq('id', photoId)

    if (error) {
      setStatus({ type: 'error', msg: 'Error al actualizar la portada.' })
    } else {
      setPhotos(prev => prev.map(p => ({ ...p, featured: p.id === photoId })))
      setStatus({ type: 'success', msg: 'Foto de portada actualizada.' })
    }
    setSettingFeatured(null)
  }

  async function handleDelete(photo) {
    if (!confirm(`¿Eliminar "${photo.title}"? Esta acción no se puede deshacer.`)) return
    // Las fotos restauradas del respaldo no tienen archivo en storage todavía.
    if (photo.image_key) await insforge.storage.from('photos').remove([photo.image_key])
    await insforge.database.from('photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    window.dispatchEvent(new CustomEvent('photo-updated'))
  }

  function handleSaved(updated) {
    setPhotos(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
    setEditingId(null)
    window.dispatchEvent(new CustomEvent('photo-updated'))
  }

  return (
    <section>
      <SectionHeader icon={<ImageIcon className="w-5 h-5 text-stone-400" />} title="Fotografías" />
      <p className="text-stone-500 text-sm font-sans mb-6">
        Marca la portada, edita los datos o elimina cualquier fotografía publicada.
      </p>

      {status && <StatusBanner status={status} className="mb-6" />}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-stone-900 animate-pulse" />)}
        </div>
      ) : photos.length === 0 ? (
        <p className="text-stone-600 font-sans text-sm">Aún no has subido fotografías.</p>
      ) : (
        <div className="divide-y divide-stone-800 border border-stone-800">
          {photos.map(photo => (
            <div key={photo.id}>
              {/* Row */}
              <div className="flex items-center gap-4 p-4">
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className={`w-16 h-12 object-cover flex-shrink-0 grayscale transition-all ${
                    photo.featured ? 'ring-2 ring-amber-400' : ''
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {photo.featured && (
                      <span className="flex items-center gap-1 bg-amber-400 text-stone-950 text-xs px-1.5 py-0.5 font-sans uppercase tracking-widest flex-shrink-0">
                        <Star className="w-2.5 h-2.5 fill-stone-950" /> Portada
                      </span>
                    )}
                    <p className="text-stone-100 text-sm font-sans font-medium truncate">{photo.title}</p>
                  </div>
                  <p className="text-stone-500 text-xs font-sans">
                    {[photo.year, photo.location].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setFeatured(photo.id)}
                    disabled={photo.featured || settingFeatured === photo.id}
                    aria-label={photo.featured ? 'Portada actual' : 'Marcar como portada'}
                    title={photo.featured ? 'Portada actual' : 'Marcar como portada'}
                    className={`p-2.5 transition-colors ${
                      photo.featured ? 'text-amber-400 cursor-default' : 'text-stone-600 hover:text-amber-400'
                    }`}
                  >
                    {settingFeatured === photo.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Star className={`w-3.5 h-3.5 ${photo.featured ? 'fill-amber-400' : ''}`} />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingId(editingId === photo.id ? null : photo.id)}
                    className="flex items-center gap-1 text-xs font-sans text-stone-400 hover:text-stone-100 border border-stone-700 hover:border-stone-500 px-3 py-1.5 transition-colors uppercase tracking-widest"
                  >
                    <Pencil className="w-3 h-3" />
                    {editingId === photo.id ? 'Cerrar' : 'Editar'}
                    {editingId === photo.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleDelete(photo)}
                    aria-label="Eliminar fotografía"
                    className="flex items-center gap-1 text-xs font-sans text-stone-600 hover:text-brand-red active:text-brand-red p-2.5 transition-colors uppercase tracking-widest"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === photo.id && (
                <EditForm
                  photo={photo}
                  onSaved={handleSaved}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function EditForm({ photo, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: photo.title ?? '',
    story: photo.story ?? '',
    year: photo.year ?? '',
    photographer: photo.photographer ?? '',
    location: photo.location ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function clearFile() {
    setFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const changes = {
      ...form,
      year: form.year ? parseInt(form.year) : null,
    }

    // Si eligió una imagen nueva, subirla antes de guardar los datos.
    if (file) {
      const { key, url, error: uploadErr } = await uploadImage(file)
      if (uploadErr) {
        setError('Error al subir la imagen.')
        setSaving(false)
        return
      }
      // Borrar el archivo anterior solo si existía uno.
      if (photo.image_key) {
        await insforge.storage.from('photos').remove([photo.image_key])
      }
      changes.image_url = url
      changes.image_key = key
    }

    const { error } = await insforge.database
      .from('photos')
      .update(changes)
      .eq('id', photo.id)

    if (error) {
      setError('Error al guardar los cambios.')
      setSaving(false)
    } else {
      onSaved({ ...photo, ...changes })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-stone-900/60 border-t border-stone-800 p-6 space-y-5">
      <div>
        <label className="block text-xs text-stone-500 font-sans uppercase tracking-widest mb-2">
          Fotografía
        </label>
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <img
              src={preview ?? photo.image_url}
              alt={photo.title}
              className="w-40 h-28 object-cover border border-stone-700"
            />
            {preview && (
              <button type="button" onClick={clearFile}
                className="absolute top-1 right-1 bg-stone-950/80 text-stone-300 hover:text-white p-1"
                title="Descartar imagen nueva">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            <button type="button" onClick={() => fileRef.current.click()}
              className="flex items-center gap-2 text-xs font-sans text-stone-300 border border-stone-700 hover:border-stone-500 px-4 py-2 transition-colors uppercase tracking-widest">
              <Upload className="w-3 h-3" />
              {photo.image_key ? 'Reemplazar imagen' : 'Subir imagen'}
            </button>
            <p className="text-stone-600 text-xs font-sans">
              {preview
                ? 'Se subirá al guardar los cambios.'
                : photo.image_key
                  ? 'La imagen actual se borrará del almacenamiento al reemplazarla.'
                  : 'Esta fotografía aún no tiene imagen.'}
            </p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <Field label="Título" required>
          <input type="text" required value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" />
        </Field>
        <Field label="Historia" required>
          <textarea required rows={5} value={form.story}
            onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
            className="input-field resize-none" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Field label="Año">
          <input type="number" min="1900" max={new Date().getFullYear()} value={form.year}
            onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
            className="input-field" placeholder="1985" />
        </Field>
        <Field label="Fotógrafo">
          <input type="text" value={form.photographer}
            onChange={e => setForm(f => ({ ...f, photographer: e.target.value }))}
            className="input-field" />
        </Field>
        <Field label="Lugar">
          <input type="text" value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            className="input-field" />
        </Field>
      </div>

      {error && (
        <p className="text-brand-red text-sm font-sans flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="bg-brand-red text-white px-6 py-2 text-sm font-sans uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-stone-500 hover:text-stone-300 text-sm font-sans transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

/* ── Publicar fotografía: ahora o en cola ── */
function PublishManager() {
  const fileRef = useRef()
  const [mode, setMode] = useState('now') // 'now' | 'queue'
  const [form, setForm] = useState({
    title: '', story: '', year: '', photographer: '', location: '',
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [queue, setQueue] = useState([])
  const [loadingQueue, setLoadingQueue] = useState(true)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    fetchQueue()
  }, [])

  async function fetchQueue() {
    setLoadingQueue(true)
    const { data } = await insforge.database
      .from('photo_queue')
      .select('id, title, year, image_url, queue_order, created_at')
      .eq('status', 'pending')
      .order('queue_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    setQueue(data ?? [])
    setLoadingQueue(false)
  }

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setStatus({ type: 'error', msg: 'Debes seleccionar una imagen.' }); return }
    setUploading(true)
    setStatus(null)

    const { key, url, error: uploadErr } = await uploadImage(file)

    if (uploadErr) {
      setStatus({ type: 'error', msg: 'Error al subir la imagen.' })
      setUploading(false)
      return
    }

    const payload = {
      ...form,
      year: form.year ? parseInt(form.year) : null,
      image_url: url,
      image_key: key,
    }

    if (mode === 'now') {
      const { error: dbErr } = await insforge.database.from('photos').insert([{ ...payload, featured: false }])
      if (dbErr) {
        setStatus({ type: 'error', msg: 'Error al guardar en la base de datos.' })
        setUploading(false)
        return
      }
      setStatus({ type: 'success', msg: 'Fotografía publicada. Puedes marcarla como portada en la sección de arriba.' })
      window.dispatchEvent(new CustomEvent('photo-uploaded'))
    } else {
      const { error: dbErr } = await insforge.database.from('photo_queue').insert([{ ...payload, status: 'pending' }])
      if (dbErr) {
        setStatus({ type: 'error', msg: 'Error al guardar en la cola.' })
        setUploading(false)
        return
      }
      setStatus({ type: 'success', msg: 'Fotografía agregada a la cola. Se publicará automáticamente según su turno.' })
      fetchQueue()
    }

    setForm({ title: '', story: '', year: '', photographer: '', location: '' })
    setFile(null)
    setPreview(null)
    setUploading(false)
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
    fetchQueue()
    window.dispatchEvent(new CustomEvent('photo-uploaded'))
  }

  async function updateOrder(id, value) {
    const queue_order = value === '' ? null : parseInt(value)
    setQueue(prev => prev.map(q => q.id === id ? { ...q, queue_order } : q))
    await insforge.database.from('photo_queue').update({ queue_order }).eq('id', id)
    fetchQueue()
  }

  return (
    <section>
      <SectionHeader icon={<Upload className="w-5 h-5 text-stone-400" />} title="Publicar Fotografía" />

      <div className="inline-flex border border-stone-700 mb-4">
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

      <p className="text-stone-500 text-sm font-sans mb-6">
        {mode === 'now'
          ? 'La fotografía queda visible en el sitio de inmediato.'
          : 'Se guarda en la cola; una Schedule de InsForge publica automáticamente la más antigua (o de menor orden) cada semana.'}
      </p>

      {status && <StatusBanner status={status} className="mb-6" />}

      {mode === 'queue' && (
        loadingQueue ? (
          <div className="space-y-2 mb-8">
            {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-stone-900 animate-pulse" />)}
          </div>
        ) : queue.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
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
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <img src={item.image_url} alt={item.title} className="w-16 h-12 object-cover flex-shrink-0" />
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
                    onBlur={e => updateOrder(item.id, e.target.value)}
                    placeholder="Orden"
                    title="Orden manual (menor se publica antes); vacío = por fecha de ingreso"
                    className="input-field w-20 text-center flex-shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-stone-600 font-sans text-sm mb-8">
            La cola está vacía. Agrega fotos abajo para las próximas publicaciones automáticas.
          </p>
        )
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-xs text-stone-500 font-sans uppercase tracking-widest mb-2">
            Fotografía <span className="text-brand-red">*</span>
          </label>
          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="preview" className="max-h-64 object-contain border border-stone-700" />
              <button type="button" onClick={() => { setFile(null); setPreview(null) }}
                className="absolute top-2 right-2 bg-stone-950/80 text-stone-300 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-stone-700 hover:border-brand-red transition-colors p-12 flex flex-col items-center justify-center cursor-pointer text-stone-500 hover:text-stone-300">
              <Upload className="w-8 h-8 mb-3" />
              <p className="text-sm font-sans">Arrastra o haz clic para seleccionar imagen</p>
              <p className="text-xs font-sans mt-1 text-stone-600">JPG, PNG, WEBP</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Field label="Título" required>
            <input type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" />
          </Field>
          <Field label="Historia / Descripción" required>
            <textarea required rows={7} value={form.story}
              onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
              className="input-field resize-none"
              placeholder="Cuenta la historia detrás de esta fotografía..." />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Año">
            <input type="number" min="1900" max={new Date().getFullYear()} value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              className="input-field" placeholder="1985" />
          </Field>
          <Field label="Fotógrafo">
            <input type="text" value={form.photographer}
              onChange={e => setForm(f => ({ ...f, photographer: e.target.value }))}
              className="input-field" placeholder="Nombre o archivo de origen" />
          </Field>
          <Field label="Lugar">
            <input type="text" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="input-field" placeholder="Santiago, Chile" />
          </Field>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className={`px-10 py-3 text-sm font-sans uppercase tracking-widest transition-colors disabled:opacity-50 ${
            mode === 'now'
              ? 'bg-brand-red text-white hover:bg-red-700'
              : 'bg-stone-100 text-stone-950 hover:bg-white'
          }`}
        >
          {mode === 'now'
            ? (uploading ? 'Publicando...' : 'Publicar fotografía')
            : (uploading ? 'Agregando...' : 'Agregar a la cola')}
        </button>
      </form>
    </section>
  )
}

/* ── Helpers ── */
function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-800">
      {icon}
      <h2 className="font-serif text-2xl text-stone-100">{title}</h2>
    </div>
  )
}

function StatusBanner({ status, className = '' }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-sans p-3 ${className} ${
      status.type === 'error'
        ? 'bg-red-950 text-red-300 border border-red-800'
        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
    }`}>
      {status.type === 'error'
        ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
        : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
      {status.msg}
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs text-stone-500 font-sans uppercase tracking-widest mb-1">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>
      {children}
    </div>
  )
}
