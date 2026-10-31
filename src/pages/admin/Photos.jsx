import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Pencil, Trash2, ChevronDown, ChevronUp, Upload } from 'lucide-react'
import { insforge } from '../../lib/insforge'
import { updateWithImage, deleteWithImage } from '../../lib/photoRecords'
import { useStatus } from '../../lib/useStatus'
import { PageHeader, StatusBanner, ListSkeleton } from '../../components/admin/ui'
import PhotoForm from '../../components/admin/PhotoForm'

async function fetchPhotos() {
  const { data } = await insforge.database
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

/* ── Gestión y edición de fotos ── */
export default function Photos() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [settingFeatured, setSettingFeatured] = useState(null)
  const [status, setStatus, clearStatus] = useStatus()

  useEffect(() => {
    fetchPhotos().then(data => {
      setPhotos(data)
      setLoading(false)
    })
  }, [])

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
    setStatus(null)
    const { error } = await deleteWithImage('photos', photo)
    if (error) {
      setStatus({ type: 'error', msg: 'Error al eliminar la fotografía.' })
      return
    }
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    setStatus({ type: 'success', msg: `"${photo.title}" eliminada.` })
  }

  async function handleSave(photo, values) {
    const { changes, error } = await updateWithImage('photos', photo, values)
    if (error) return { error }
    setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, ...changes } : p))
    setEditingId(null)
    setStatus({ type: 'success', msg: 'Cambios guardados.' })
  }

  return (
    <>
      <PageHeader
        title="Fotografías"
        description="Marca la portada, edita los datos o elimina cualquier fotografía publicada."
        actions={
          <Link to="/admin/publicar"
            className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 text-xs font-sans uppercase tracking-widest hover:bg-red-700 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Publicar
          </Link>
        }
      />

      <StatusBanner status={status} onDismiss={clearStatus} className="mb-6" />

      {loading ? (
        <ListSkeleton />
      ) : photos.length === 0 ? (
        <p className="text-stone-600 font-sans text-sm">Aún no has subido fotografías.</p>
      ) : (
        <div className="divide-y divide-stone-800 border border-stone-800">
          {photos.map(photo => (
            <div key={photo.id}>
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  loading="lazy"
                  className={`w-14 h-11 sm:w-16 sm:h-12 object-cover flex-shrink-0 grayscale ${
                    photo.featured ? 'ring-2 ring-amber-400' : ''
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {photo.featured && (
                      <span className="flex items-center gap-1 bg-amber-400 text-stone-950 text-xs px-1.5 py-0.5 font-sans uppercase tracking-widest flex-shrink-0">
                        <Star className="w-2.5 h-2.5 fill-stone-950" />
                        <span className="hidden sm:inline">Portada</span>
                      </span>
                    )}
                    <p className="text-stone-100 text-sm font-sans font-medium truncate">{photo.title}</p>
                  </div>
                  <p className="text-stone-500 text-xs font-sans truncate">
                    {[photo.year, photo.location].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
                    aria-label={editingId === photo.id ? 'Cerrar edición' : 'Editar fotografía'}
                    className="flex items-center gap-1 text-xs font-sans text-stone-400 hover:text-stone-100 border border-stone-700 hover:border-stone-500 p-2 sm:px-3 sm:py-1.5 transition-colors uppercase tracking-widest"
                  >
                    <Pencil className="w-3 h-3" />
                    <span className="hidden sm:inline">{editingId === photo.id ? 'Cerrar' : 'Editar'}</span>
                    {editingId === photo.id
                      ? <ChevronUp className="w-3 h-3 hidden sm:block" />
                      : <ChevronDown className="w-3 h-3 hidden sm:block" />}
                  </button>
                  <button
                    onClick={() => handleDelete(photo)}
                    aria-label="Eliminar fotografía"
                    title="Eliminar fotografía"
                    className="flex items-center gap-1 text-xs font-sans text-stone-600 hover:text-brand-red active:text-brand-red p-2.5 transition-colors uppercase tracking-widest"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Eliminar</span>
                  </button>
                </div>
              </div>

              {editingId === photo.id && (
                <PhotoForm
                  record={photo}
                  onSubmit={values => handleSave(photo, values)}
                  onCancel={() => setEditingId(null)}
                  submitLabel="Guardar cambios"
                  savingLabel="Guardando..."
                />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
