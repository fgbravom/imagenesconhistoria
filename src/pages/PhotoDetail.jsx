import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, User, MapPin, Camera, ArrowLeft, Trash2 } from 'lucide-react'
import { insforge } from '../lib/insforge'

export default function PhotoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => setUser(data?.user ?? null))
    insforge.database
      .from('photos')
      .select('*, sports(name, slug)')
      .eq('id', id)
      .limit(1)
      .then(({ data }) => {
        setPhoto(data?.[0] ?? null)
        setLoading(false)
      })
  }, [id])

  async function handleDelete() {
    if (!confirm('¿Eliminar esta fotografía?')) return
    await insforge.storage.from('photos').remove([photo.image_key])
    await insforge.database.from('photos').delete().eq('id', id)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-500 font-sans animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (!photo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-stone-500 font-sans">Fotografía no encontrada.</p>
        <Link to="/" className="text-brand-red text-sm font-sans hover:underline">
          Volver a la galería
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-stone-500 hover:text-stone-100 transition-colors text-sm font-sans uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Galería
          </Link>
          {user && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-stone-600 hover:text-brand-red transition-colors text-sm font-sans"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Image */}
          <div className="sticky top-24">
            <div className="bg-stone-900 border border-stone-800">
              <img
                src={photo.image_url}
                alt={photo.title}
                className="w-full object-contain max-h-[75vh]"
              />
            </div>
            {/* Metadata bar */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-stone-500 font-sans">
              {photo.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {photo.year}
                </span>
              )}
              {photo.athlete_name && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {photo.athlete_name}
                </span>
              )}
              {photo.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {photo.location}
                </span>
              )}
              {photo.photographer && (
                <span className="flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Foto: {photo.photographer}
                </span>
              )}
            </div>
          </div>

          {/* Story */}
          <div>
            {photo.sports && (
              <Link
                to={`/?sport=${photo.sports.slug}`}
                className="text-brand-red text-xs uppercase tracking-widest font-sans hover:text-red-400 transition-colors"
              >
                {photo.sports.name}
              </Link>
            )}
            <h1 className="font-serif text-3xl sm:text-4xl text-stone-100 mt-2 leading-tight">
              {photo.title}
            </h1>
            <div className="mt-8 prose prose-invert prose-stone max-w-none prose-p:font-sans prose-p:text-stone-300 prose-p:leading-relaxed">
              {photo.story.split('\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-stone-800 py-8 text-center mt-16">
        <p className="text-stone-600 text-sm font-sans">
          © {new Date().getFullYear()} Imágenes con Historia — Deporte Chileno
        </p>
      </footer>
    </div>
  )
}
