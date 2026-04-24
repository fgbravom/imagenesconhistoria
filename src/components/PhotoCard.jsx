import { Link } from 'react-router-dom'
import { Calendar, User } from 'lucide-react'

export default function PhotoCard({ photo }) {
  return (
    <Link
      to={`/foto/${photo.id}`}
      className="group block break-inside-avoid mb-2 overflow-hidden relative bg-stone-900"
    >
      <img
        src={photo.image_url}
        alt={photo.title}
        loading="lazy"
        className="w-full block grayscale group-hover:grayscale-0 transition-all duration-500"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
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
