import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, X, CheckCircle, AlertCircle, Star, ImageIcon, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
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
        <FeaturedManager />
        <PhotoManager />
        <UploadForm />
      </div>

      <footer className="border-t border-stone-800 py-8 text-center mt-8">
        <p className="text-stone-600 text-sm font-sans">
          © {new Date().getFullYear()} Imágenes con Historia — Panel Admin
        </p>
      </footer>
    </div>
  )
}

/* ── Gestión de foto de portada ── */
function FeaturedManager() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [setting, setSetting] = useState(null)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetchPhotos()
    window.addEventListener('photo-uploaded', fetchPhotos)
    window.addEventListener('photo-updated', fetchPhotos)
    return () => {
      window.removeEventListener('photo-uploaded', fetchPhotos)
      window.removeEventListener('photo-updated', fetchPhotos)
    }
  }, [])

  async function fetchPhotos() {
    setLoading(true)
    const { data } = await insforge.database
      .from('photos')
      .select('id, title, image_url, featured, year, athlete_name')
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }

  async function setFeatured(photoId) {
    setSetting(photoId)
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
    setSetting(null)
  }

  return (
    <section>
      <SectionHeader icon={<Star className="w-5 h-5 text-amber-400" />} title="Foto de Portada" />
      <p className="text-stone-500 text-sm font-sans mb-6">
        La foto con borde dorado aparece en el hero de la página principal. Haz clic en otra para cambiarla.
      </p>

      {status && <StatusBanner status={status} className="mb-6" />}

      {loading ? (
        <SkeletonGrid count={4} />
      ) : photos.length === 0 ? (
        <p className="text-stone-600 font-sans text-sm">Aún no has subido fotografías.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map(photo => (
            <button
              key={photo.id}
              onClick={() => !photo.featured && setFeatured(photo.id)}
              disabled={setting === photo.id || photo.featured}
              className={`group relative aspect-[4/3] overflow-hidden transition-all ${
                photo.featured
                  ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-950 cursor-default'
                  : 'ring-1 ring-stone-700 hover:ring-brand-red hover:ring-offset-1 hover:ring-offset-stone-950 cursor-pointer'
              }`}
            >
              <img
                src={photo.image_url}
                alt={photo.title}
                className={`w-full h-full object-cover transition-all duration-300 ${photo.featured ? '' : 'grayscale group-hover:grayscale-0'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />

              {photo.featured && (
                <div className="absolute top-2 left-2 bg-amber-400 text-stone-950 text-xs px-2 py-0.5 font-sans uppercase tracking-widest flex items-center gap-1">
                  <Star className="w-3 h-3 fill-stone-950" /> Portada
                </div>
              )}

              {setting === photo.id && (
                <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-stone-100 text-xs font-sans leading-tight line-clamp-1">{photo.title}</p>
                {photo.year && <p className="text-stone-400 text-xs font-sans">{photo.year}</p>}
              </div>

              {!photo.featured && setting !== photo.id && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-brand-red text-white text-xs font-sans uppercase tracking-widest px-3 py-1.5">
                    Usar como portada
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

/* ── Gestión y edición de fotos ── */
function PhotoManager() {
  const [photos, setPhotos] = useState([])
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchAll()
    window.addEventListener('photo-uploaded', fetchAll)
    return () => window.removeEventListener('photo-uploaded', fetchAll)
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [photosRes, sportsRes] = await Promise.all([
      insforge.database
        .from('photos')
        .select('*, sports(name)')
        .order('created_at', { ascending: false }),
      insforge.database.from('sports').select('*').order('name'),
    ])
    setPhotos(photosRes.data ?? [])
    setSports(sportsRes.data ?? [])
    setLoading(false)
  }

  async function handleDelete(photo) {
    if (!confirm(`¿Eliminar "${photo.title}"? Esta acción no se puede deshacer.`)) return
    await insforge.storage.from('photos').remove([photo.image_key])
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
      <SectionHeader icon={<Pencil className="w-5 h-5 text-stone-400" />} title="Editar Fotografías" />
      <p className="text-stone-500 text-sm font-sans mb-6">
        Haz clic en "Editar" para modificar los datos de cualquier fotografía publicada.
      </p>

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
                  className="w-16 h-12 object-cover flex-shrink-0 grayscale"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-stone-100 text-sm font-sans font-medium truncate">{photo.title}</p>
                  <p className="text-stone-500 text-xs font-sans">
                    {[photo.sports?.name, photo.athlete_name, photo.year].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
                    className="text-stone-600 hover:text-brand-red transition-colors p-1.5"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === photo.id && (
                <EditForm
                  photo={photo}
                  sports={sports}
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

function EditForm({ photo, sports, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: photo.title ?? '',
    story: photo.story ?? '',
    sport_id: photo.sport_id ?? '',
    year: photo.year ?? '',
    athlete_name: photo.athlete_name ?? '',
    photographer: photo.photographer ?? '',
    location: photo.location ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await insforge.database
      .from('photos')
      .update({
        ...form,
        year: form.year ? parseInt(form.year) : null,
        sport_id: form.sport_id || null,
      })
      .eq('id', photo.id)

    if (error) {
      setError('Error al guardar los cambios.')
      setSaving(false)
    } else {
      onSaved({ ...photo, ...form, year: form.year ? parseInt(form.year) : null })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-stone-900/60 border-t border-stone-800 p-6 space-y-5">
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
        <Field label="Deporte">
          <select value={form.sport_id}
            onChange={e => setForm(f => ({ ...f, sport_id: e.target.value }))} className="input-field">
            <option value="">Sin clasificar</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Año">
          <input type="number" min="1900" max="2025" value={form.year}
            onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
            className="input-field" placeholder="1985" />
        </Field>
        <Field label="Atleta(s)">
          <input type="text" value={form.athlete_name}
            onChange={e => setForm(f => ({ ...f, athlete_name: e.target.value }))}
            className="input-field" />
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

/* ── Formulario de subida ── */
function UploadForm() {
  const fileRef = useRef()
  const [sports, setSports] = useState([])
  const [form, setForm] = useState({
    title: '', story: '', sport_id: '', year: '',
    athlete_name: '', photographer: '', location: '',
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    insforge.database.from('sports').select('*').order('name').then(({ data }) => {
      if (data) setSports(data)
    })
  }, [])

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

    const ext = file.name.split('.').pop()
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data: uploadData, error: uploadErr } = await insforge.storage
      .from('photos')
      .upload(key, file, { contentType: file.type })

    if (uploadErr) {
      setStatus({ type: 'error', msg: 'Error al subir la imagen.' })
      setUploading(false)
      return
    }

    const image_url = uploadData?.url ?? `${import.meta.env.VITE_INSFORGE_URL}/storage/v1/object/public/photos/${key}`

    const { error: dbErr } = await insforge.database.from('photos').insert([{
      ...form,
      year: form.year ? parseInt(form.year) : null,
      sport_id: form.sport_id || null,
      image_url,
      image_key: key,
      featured: false,
    }])

    if (dbErr) {
      setStatus({ type: 'error', msg: 'Error al guardar en la base de datos.' })
      setUploading(false)
      return
    }

    setStatus({ type: 'success', msg: 'Fotografía publicada. Puedes marcarla como portada en la sección de arriba.' })
    setForm({ title: '', story: '', sport_id: '', year: '', athlete_name: '', photographer: '', location: '' })
    setFile(null)
    setPreview(null)
    setUploading(false)
    window.dispatchEvent(new CustomEvent('photo-uploaded'))
  }

  return (
    <section>
      <SectionHeader icon={<ImageIcon className="w-5 h-5 text-stone-400" />} title="Publicar Fotografía" />

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
          <Field label="Deporte">
            <select value={form.sport_id}
              onChange={e => setForm(f => ({ ...f, sport_id: e.target.value }))} className="input-field">
              <option value="">Sin clasificar</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Año">
            <input type="number" min="1900" max="2025" value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              className="input-field" placeholder="1985" />
          </Field>
          <Field label="Atleta(s)">
            <input type="text" value={form.athlete_name}
              onChange={e => setForm(f => ({ ...f, athlete_name: e.target.value }))}
              className="input-field" placeholder="Marcelo Ríos" />
          </Field>
          <Field label="Fotógrafo">
            <input type="text" value={form.photographer}
              onChange={e => setForm(f => ({ ...f, photographer: e.target.value }))}
              className="input-field" placeholder="Agencia EFE" />
          </Field>
          <Field label="Lugar">
            <input type="text" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="input-field" placeholder="Santiago, Chile" />
          </Field>
        </div>

        {status && <StatusBanner status={status} />}

        <button type="submit" disabled={uploading}
          className="bg-brand-red text-white px-10 py-3 text-sm font-sans uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50">
          {uploading ? 'Publicando...' : 'Publicar fotografía'}
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

function SkeletonGrid({ count }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="aspect-[4/3] bg-stone-800 animate-pulse" />
      ))}
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
