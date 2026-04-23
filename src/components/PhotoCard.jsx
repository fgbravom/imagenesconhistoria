import { Link } from 'react-router-dom'
import { Calendar, User } from 'lucide-react'

export default function PhotoCard({ photo }) {
  return (
    <Link
      to={`/foto/${photo.id}`}
      className="group block bg-stone-900 rounded overflow-hidden border border-stone-800 hover:border-brand-red transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-800">
        <img
          src={photo.image_url}
          alt={photo.title}
          loading="lazy"
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
        />
        {photo.featured && (
          <span className="absolute top-2 left-2 bg-brand-red text-white text-xs px-2 py-0.5 uppercase tracking-widest font-sans">
            Destacada
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4">
        {photo.sports && (
          <span className="text-brand-red text-xs uppercase tracking-widest font-sans">
            {photo.sports.name}
          </span>
        )}
        <h3 className="font-serif text-stone-100 text-lg mt-1 leading-snug group-hover:text-brand-red transition-colors line-clamp-2">
          {photo.title}
        </h3>
        <p className="text-stone-400 text-sm mt-2 line-clamp-2 font-sans leading-relaxed">
          {photo.story}
        </p>
        <div className="flex items-center gap-4 mt-3 text-stone-500 text-xs font-sans">
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
    </Link>
  )
}
