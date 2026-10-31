import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { insforge } from '../lib/insforge'
import PhotoCard from '../components/PhotoCard'

const PAGE_SIZE = 30

export default function Home() {
  const [featured, setFeatured] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [heroLoaded, setHeroLoaded] = useState(false)
  const [featuredChecked, setFeaturedChecked] = useState(false)
  const sentinelRef = useRef(null)
  const loadingRef = useRef(false)
  const pageRef = useRef(0)

  async function loadPhotos(pageNum) {
    loadingRef.current = true
    // La primera página arranca con loading=true desde el estado inicial.
    if (pageNum > 0) setLoadingMore(true)

    const { data } = await insforge.database
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    const rows = data ?? []
    if (pageNum === 0) setPhotos(rows)
    else setPhotos(prev => [...prev, ...rows])
    pageRef.current = pageNum
    setHasMore(rows.length === PAGE_SIZE)

    loadingRef.current = false
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => {
    insforge.database
      .from('photos')
      .select('*')
      .eq('featured', true)
      .limit(1)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) setFeatured(data[0])
        setFeaturedChecked(true)
      })
    loadPhotos(0)
  }, [])

  // El hero se revela recién cuando la imagen destacada terminó de cargar (o,
  // si no hay ninguna, apenas confirmamos que no hay nada que esperar) para
  // que el texto y la foto aparezcan juntos en vez de por capas.
  const heroReady = heroLoaded || (featuredChecked && !featured)

  // Scroll infinito: al acercarse el sentinel al viewport se pide la página
  // siguiente. Se re-crea tras cada página para que, si el sentinel sigue
  // visible (pantallas altas), vuelva a disparar sin esperar otro scroll.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current) loadPhotos(pageRef.current + 1)
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, photos.length])

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative h-[85vh] min-h-[560px] flex flex-col items-center justify-center overflow-hidden">
        {featured ? (
          <img
            src={featured.image_url}
            alt={featured.title}
            fetchPriority="high"
            decoding="async"
            onLoad={() => setHeroLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover grayscale transition-opacity duration-700 ${heroLoaded ? 'opacity-30' : 'opacity-0'}`}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#2d1a1a_0%,_#0a0a0a_70%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/50 to-stone-950" />

        <div
          className={`relative z-10 text-center px-4 max-w-4xl mx-auto transition-opacity duration-700 ${
            heroReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-12 bg-brand-red" />
            <span className="text-brand-red text-xs uppercase tracking-[0.3em] font-sans">Imagen — Historia — Memoria</span>
            <div className="h-px w-12 bg-brand-red" />
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl text-stone-100 leading-none tracking-tight">
            Imágen<br />
            <span className="italic text-stone-400">e Historia</span>
          </h1>

          <p className="mt-6 text-stone-400 text-lg sm:text-xl font-sans max-w-xl mx-auto leading-relaxed">
            Cada imagen guarda una historia.
          </p>
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

        {/* Grid */}
        {loading ? (
          <div className="columns-2 lg:columns-3 xl:columns-4 gap-2">
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
            <div className="columns-2 lg:columns-3 xl:columns-4 gap-2">
              {photos.map(p => <PhotoCard key={p.id} photo={p} />)}
            </div>
            {hasMore && (
              <div ref={sentinelRef} className="text-center mt-12 px-4 h-8">
                {loadingMore && (
                  <span className="text-stone-600 text-xs font-sans uppercase tracking-widest">Cargando...</span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <Camera className="w-12 h-12 text-stone-700" />
            <p className="text-stone-500 font-sans">Aún no hay fotografías publicadas.</p>
            <Link
              to="/admin"
              className="bg-brand-red text-white text-sm font-sans uppercase tracking-widest px-6 py-2 hover:bg-red-700 transition-colors"
            >
              Subir la primera fotografía
            </Link>
          </div>
        )}
      </section>

      <footer className="border-t border-stone-800 py-8 text-center">
        <p className="text-stone-600 text-sm font-sans">
          © {new Date().getFullYear()} Imágenes con Historia
        </p>
      </footer>
    </div>
  )
}
