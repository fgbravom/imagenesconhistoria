import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Camera } from 'lucide-react'
import { insforge } from '../lib/insforge'
import PhotoCard from '../components/PhotoCard'

const DECADES = [
  { label: 'Todas las épocas', value: null },
  { label: '1940s', value: 1940 },
  { label: '1950s', value: 1950 },
  { label: '1960s', value: 1960 },
  { label: '1970s', value: 1970 },
  { label: '1980s', value: 1980 },
  { label: '1990s', value: 1990 },
  { label: '2000s', value: 2000 },
  { label: '2010s', value: 2010 },
  { label: '2020s', value: 2020 },
]

const PAGE_SIZE = 12

export default function Home() {
  const [featured, setFeatured] = useState(null)
  const [photos, setPhotos] = useState([])
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [sportFilter, setSportFilter] = useState(null)
  const [decadeFilter, setDecadeFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    insforge.database.from('sports').select('*').order('name').then(({ data }) => {
      if (data) setSports(data)
    })
    insforge.database
      .from('photos')
      .select('*, sports(name, slug)')
      .eq('featured', true)
      .limit(1)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) setFeatured(data[0])
      })
  }, [])

  useEffect(() => {
    setPage(0)
    loadPhotos(0)
  }, [sportFilter, decadeFilter, search])

  async function loadPhotos(pageNum) {
    if (pageNum === 0) setLoading(true)
    else setLoadingMore(true)

    let query = insforge.database
      .from('photos')
      .select('*, sports(name, slug)')
      .order('year', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    if (sportFilter) query = query.eq('sport_id', sportFilter)
    if (decadeFilter) query = query.gte('year', decadeFilter).lt('year', decadeFilter + 10)
    if (search.trim()) query = query.ilike('athlete_name', `%${search.trim()}%`)

    const { data } = await query
    if (pageNum === 0) setPhotos(data ?? [])
    else setPhotos(prev => [...prev, ...(data ?? [])])

    setLoading(false)
    setLoadingMore(false)
  }

  function loadMore() {
    const next = page + 1
    setPage(next)
    loadPhotos(next)
  }

  const hasActiveFilter = sportFilter || decadeFilter || search.trim()

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative h-[85vh] min-h-[560px] flex flex-col items-center justify-center overflow-hidden">
        {featured ? (
          <img
            src={featured.image_url}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-30"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#2d1a1a_0%,_#0a0a0a_70%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/50 to-stone-950" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-12 bg-brand-red" />
            <span className="text-brand-red text-xs uppercase tracking-[0.3em] font-sans">Chile — Deporte — Historia</span>
            <div className="h-px w-12 bg-brand-red" />
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl text-stone-100 leading-none tracking-tight">
            Imágen<br />
            <span className="italic text-stone-400">e Historia</span>
          </h1>

          <p className="mt-6 text-stone-400 text-lg sm:text-xl font-sans max-w-xl mx-auto leading-relaxed">
            Recopilación de fotografías históricas para Chile y el mundo. Cada imagen guarda una historia.
          </p>

          {featured && (
            <Link
              to={`/foto/${featured.id}`}
              className="inline-block mt-8 bg-brand-red text-white text-sm font-sans uppercase tracking-widest px-8 py-3 hover:bg-red-700 transition-colors"
            >
              Ver fotografía destacada
            </Link>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-600">
          <span className="text-xs font-sans uppercase tracking-widest">Explorar</span>
          <div className="w-px h-8 bg-gradient-to-b from-stone-600 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── GALERÍA ── */}
      <section className="py-16">

        {/* Section label */}
        <div className="flex items-center gap-4 mb-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-px flex-1 bg-stone-800" />
          <span className="text-stone-500 text-xs font-sans uppercase tracking-[0.25em]">Galería</span>
          <div className="h-px flex-1 bg-stone-800" />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar por atleta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 text-stone-100 placeholder-stone-500 pl-9 pr-4 py-2 text-sm font-sans focus:outline-none focus:border-brand-red transition-colors rounded-none"
            />
          </div>

          {/* Sport pills */}
          <div className="flex flex-wrap gap-2">
            <FilterPill active={!sportFilter} onClick={() => setSportFilter(null)}>
              Todos los deportes
            </FilterPill>
            {sports.map(s => (
              <FilterPill key={s.id} active={sportFilter === s.id} onClick={() => setSportFilter(s.id)}>
                {s.name}
              </FilterPill>
            ))}
          </div>

          {/* Decade pills */}
          <div className="flex flex-wrap gap-2">
            {DECADES.map(d => (
              <FilterPill
                key={d.label}
                active={decadeFilter === d.value}
                onClick={() => setDecadeFilter(d.value)}
                variant="light"
              >
                {d.label}
              </FilterPill>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`break-inside-avoid mb-2 bg-stone-900 animate-pulse ${
                  i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-2">
              {photos.map(p => <PhotoCard key={p.id} photo={p} />)}
            </div>
            {photos.length % PAGE_SIZE === 0 && (
              <div className="text-center mt-12 px-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-stone-900 border border-stone-700 text-stone-300 px-10 py-3 text-sm font-sans uppercase tracking-widest hover:border-brand-red hover:text-brand-red transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Cargando...' : 'Cargar más fotografías'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <Camera className="w-12 h-12 text-stone-700" />
            {hasActiveFilter ? (
              <p className="text-stone-500 font-sans">No se encontraron fotografías con esos filtros.</p>
            ) : (
              <>
                <p className="text-stone-500 font-sans">Aún no hay fotografías publicadas.</p>
                <Link
                  to="/admin"
                  className="bg-brand-red text-white text-sm font-sans uppercase tracking-widest px-6 py-2 hover:bg-red-700 transition-colors"
                >
                  Subir la primera fotografía
                </Link>
              </>
            )}
          </div>
        )}
      </section>

      <footer className="border-t border-stone-800 py-8 text-center">
        <p className="text-stone-600 text-sm font-sans">
          © {new Date().getFullYear()} Imágenes con Historia — Deporte Chileno
        </p>
      </footer>
    </div>
  )
}

function FilterPill({ active, onClick, children, variant = 'red' }) {
  const baseClass = 'px-3 py-1 text-xs font-sans uppercase tracking-widest transition-colors cursor-pointer'
  if (active) {
    return (
      <button onClick={onClick} className={`${baseClass} ${variant === 'light' ? 'bg-stone-100 text-stone-950' : 'bg-brand-red text-white'}`}>
        {children}
      </button>
    )
  }
  return (
    <button onClick={onClick} className={`${baseClass} bg-stone-900 text-stone-400 border border-stone-700 hover:border-stone-500 hover:text-stone-200`}>
      {children}
    </button>
  )
}
