import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, User } from 'lucide-react'

export default function PhotoCard({ photo }) {
  const cardRef = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    // En mobile no hay :hover, así que usamos la posición de scroll como
    // equivalente: la tarjeta se "revela" al pasar por el centro de la
    // pantalla, igual de reversible que un hover en desktop.
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Link
      ref={cardRef}
      to={`/foto/${photo.id}`}
      className="group block break-inside-avoid mb-2 overflow-hidden relative bg-stone-900"
    >
      <img
        src={photo.image_url}
        alt={photo.title}
        loading="lazy"
        className={`w-full block transition-all duration-500 sm:grayscale sm:group-hover:grayscale-0 ${
          inView ? 'grayscale-0' : 'grayscale'
        }`}
      />

      {/* Leyenda: solo en desktop, revelada con hover. En mobile no hay leyenda,
          únicamente el cambio de blanco y negro a color al pasar por el centro. */}
      <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-end p-4">
        {photo.sports && (
          <span className="text-brand-red text-xs uppercase tracking-widest font-sans">
            {photo.sports.name}
          </span>
        )}
        <h3 className="font-serif text-stone-100 text-base leading-snug line-clamp-2 mt-0.5">
          {photo.title}
        </h3>
        <div className="flex items-center gap-4 mt-1.5 text-stone-400 text-xs font-sans">
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
        </div>
      </div>

      {photo.featured && (
        <span className="absolute top-2 left-2 bg-brand-red text-white text-xs px-2 py-0.5 uppercase tracking-widest font-sans">
          Destacada
        </span>
      )}
    </Link>
  )
}
