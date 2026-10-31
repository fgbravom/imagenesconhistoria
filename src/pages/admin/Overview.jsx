import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageIcon, ListOrdered, Star, Send, Upload } from 'lucide-react'
import { insforge } from '../../lib/insforge'
import { PageHeader } from '../../components/admin/ui'

async function fetchOverview() {
  const [photos, pending, featured, next, latest] = await Promise.all([
    insforge.database.from('photos').select('id', { count: 'exact', head: true }),
    insforge.database.from('photo_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    insforge.database.from('photos').select('id, title, year, image_url').eq('featured', true).limit(1),
    insforge.database
      .from('photo_queue')
      .select('id, title, year, image_url')
      .eq('status', 'pending')
      .order('queue_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
      .limit(1),
    insforge.database
      .from('photos')
      .select('id, title, year, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  return {
    photoCount: photos.count ?? 0,
    pendingCount: pending.count ?? 0,
    featured: featured.data?.[0] ?? null,
    next: next.data?.[0] ?? null,
    latest: latest.data?.[0] ?? null,
  }
}

/* ── Resumen del panel ── */
export default function Overview() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchOverview().then(setData)
  }, [])

  return (
    <>
      <PageHeader
        title="Resumen"
        description="Estado de la galería y de la publicación automática."
        actions={
          <Link to="/admin/publicar"
            className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 text-xs font-sans uppercase tracking-widest hover:bg-red-700 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Publicar
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <StatCard to="/admin/fotos" icon={<ImageIcon className="w-3.5 h-3.5" />} label="Publicadas" value={data?.photoCount} />
        <StatCard to="/admin/cola" icon={<ListOrdered className="w-3.5 h-3.5" />} label="En cola" value={data?.pendingCount} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PhotoCard
          to="/admin/fotos"
          icon={<Star className="w-3.5 h-3.5" />}
          label="Portada actual"
          photo={data?.featured}
          loading={!data}
          empty="Sin portada. Marca una en Fotografías."
        />
        <PhotoCard
          to="/admin/cola"
          icon={<Send className="w-3.5 h-3.5" />}
          label="Próxima en publicarse"
          photo={data?.next}
          loading={!data}
          empty="La cola está vacía."
        />
        <PhotoCard
          to={data?.latest ? `/foto/${data.latest.id}` : '/admin/fotos'}
          icon={<ImageIcon className="w-3.5 h-3.5" />}
          label="Última publicada"
          photo={data?.latest}
          loading={!data}
          empty="Aún no hay fotografías."
        />
      </div>
    </>
  )
}

function StatCard({ to, icon, label, value }) {
  return (
    <Link to={to} className="block border border-stone-800 hover:border-stone-600 p-5 transition-colors">
      <p className="flex items-center gap-2 text-stone-500 text-xs font-sans uppercase tracking-widest">
        {icon} {label}
      </p>
      {value === undefined
        ? <div className="h-9 w-16 mt-2 bg-stone-900 animate-pulse" />
        : <p className="font-serif text-4xl text-stone-100 mt-2">{value}</p>}
    </Link>
  )
}

function PhotoCard({ to, icon, label, photo, loading, empty }) {
  return (
    <Link to={to} className="group block border border-stone-800 hover:border-stone-600 transition-colors">
      <p className="flex items-center gap-2 text-stone-500 text-xs font-sans uppercase tracking-widest px-4 pt-4 pb-3">
        {icon} {label}
      </p>
      {loading ? (
        <div className="aspect-[4/3] bg-stone-900 animate-pulse" />
      ) : photo ? (
        <>
          <img
            src={photo.image_url}
            alt={photo.title}
            className="aspect-[4/3] w-full object-cover grayscale group-hover:grayscale-0 transition-all"
          />
          <div className="p-4">
            <p className="text-stone-100 text-sm font-sans font-medium truncate">{photo.title}</p>
            {photo.year && <p className="text-stone-500 text-xs font-sans">{photo.year}</p>}
          </div>
        </>
      ) : (
        <p className="aspect-[4/3] flex items-center justify-center p-6 text-center text-stone-600 text-sm font-sans bg-stone-900/40">
          {empty}
        </p>
      )}
    </Link>
  )
}
