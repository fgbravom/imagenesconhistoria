import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { insforge } from '../lib/insforge'
import PhotoCard from '../components/PhotoCard'

const DECADES = [
  { label: 'Todos', value: null },
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

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [sportFilter, setSportFilter] = useState(null)
  const [decadeFilter, setDecadeFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 12

  useEffect(() => {
    insforge.database.from('sports').select('*').order('name').then(({ data }) => {
      if (data) setSports(data)
    })
  }, [])

  useEffect(() => {
    setPage(0)
    loadPhotos(0)
  }, [sportFilter, decadeFilter, search])

  async function loadPhotos(pageNum) {
    setLoading(true)
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
  }

  function loadMore() {
    const next = page + 1
    setPage(next)
    loadPhotos(next)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-stone-800 bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="font-serif text-4xl text-stone-100">Galería</h1>
          <p className="text-stone-500 font-sans text-sm mt-1 uppercase tracking-widest">
            Fotografías del deporte chileno con historia
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar por atleta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 text-stone-100 placeholder-stone-500 pl-9 pr-4 py-2 text-sm font-sans focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          {/* Sport pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSportFilter(null)}
              className={`px-3 py-1 text-xs font-sans uppercase tracking-widest transition-colors ${
                !sportFilter ? 'bg-brand-red text-white' : 'bg-stone-900 text-stone-400 border border-stone-700 hover:border-stone-500'
              }`}
            >
              Todos los deportes
            </button>
            {sports.map(s => (
              <button
                key={s.id}
                onClick={() => setSportFilter(s.id)}
                className={`px-3 py-1 text-xs font-sans uppercase tracking-widest transition-colors ${
                  sportFilter === s.id ? 'bg-brand-red text-white' : 'bg-stone-900 text-stone-400 border border-stone-700 hover:border-stone-500'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Decade pills */}
          <div className="flex flex-wrap gap-2">
            {DECADES.map(d => (
              <button
                key={d.label}
                onClick={() => setDecadeFilter(d.value)}
                className={`px-3 py-1 text-xs font-sans uppercase tracking-widest transition-colors ${
                  decadeFilter === d.value ? 'bg-stone-100 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-700 hover:border-stone-500'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading && photos.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-stone-900 rounded animate-pulse">
                <div className="aspect-[4/3] bg-stone-800" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-stone-800 rounded w-1/3" />
                  <div className="h-5 bg-stone-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : photos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {photos.map(p => <PhotoCard key={p.id} photo={p} />)}
            </div>
            {photos.length % PAGE_SIZE === 0 && (
              <div className="text-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-stone-900 border border-stone-700 text-stone-300 px-8 py-3 text-sm font-sans uppercase tracking-widest hover:border-brand-red hover:text-brand-red transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-stone-500 font-sans text-center py-20">
            No se encontraron fotografías con esos filtros.
          </p>
        )}
      </div>

      <footer className="border-t border-stone-800 py-8 text-center mt-16">
        <p className="text-stone-600 text-sm font-sans">
          © {new Date().getFullYear()} Imágenes con Historia — Deporte Chileno
        </p>
      </footer>
    </div>
  )
}
