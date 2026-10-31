import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'

export default function PhotoCard({ photo }) {
  const cardRef = useRef(null)
  const [inView, setInView] = useState(false)
  const [near, setNear] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Carga diferida propia en vez de loading="lazy": el umbral nativo es de
  // 1250–2500px y la galería entera cabe en ese rango, así que se bajaba todo
  // de una. Aquí la imagen se pide recién cuando está a 300px de aparecer.
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
      className="group block overflow-hidden relative bg-stone-900"
      // Mientras no carga, la tarjeta reserva un alto 4:3 para que el
      // observer vea su posición real y la columna no colapse a cero.
      style={loaded ? undefined : { aspectRatio: '4 / 3' }}
    >
      <img
        src={near ? photo.image_url : undefined}
        alt={photo.title}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full block transition-[filter,opacity] duration-500 sm:grayscale sm:group-hover:grayscale-0 ${
          inView ? 'grayscale-0' : 'grayscale'
        } ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Leyenda: solo en desktop, revelada con hover. En mobile no hay leyenda,
          únicamente el cambio de blanco y negro a color al pasar por el centro. */}
      <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-end p-4">
        <h3 className="font-serif text-stone-100 text-base leading-snug line-clamp-2">
          {photo.title}
        </h3>
        <div className="flex items-center gap-4 mt-1.5 text-stone-400 text-xs font-sans">
          {photo.year && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {photo.year}
            </span>
          )}
          {photo.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {photo.location}
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
