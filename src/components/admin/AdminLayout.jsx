import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Camera, ImageIcon, Upload, ListOrdered, Menu, X, LogOut, ExternalLink } from 'lucide-react'
import { insforge } from '../../lib/insforge'
import { useAuth } from '../../lib/AuthContext'

const NAV = [
  { to: '/admin/fotos', label: 'Fotografías', icon: ImageIcon },
  { to: '/admin/publicar', label: 'Publicar', icon: Upload },
  { to: '/admin/cola', label: 'Cola', icon: ListOrdered, showQueueCount: true },
]

async function fetchQueueCount() {
  const { count } = await insforge.database
    .from('photo_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  return count ?? 0
}

export default function AdminLayout() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [queueCount, setQueueCount] = useState(null)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user) return
    const refresh = () => fetchQueueCount().then(setQueueCount)
    refresh()
    window.addEventListener('queue-updated', refresh)
    return () => window.removeEventListener('queue-updated', refresh)
  }, [user])

  // En móvil el drawer se cierra con Esc y bloquea el scroll del fondo.
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  if (loading || !user) return null

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  const close = () => setOpen(false)

  return (
    <div className="min-h-screen">
      {/* Barra superior (solo móvil) */}
      <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-stone-800 bg-stone-950/90 backdrop-blur">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="p-2 -ml-2 text-stone-400 hover:text-stone-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Brand />
      </header>

      {/* Fondo del drawer en móvil */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        id="admin-drawer"
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-stone-950 border-r border-stone-800 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 lg:h-16 flex items-center justify-between px-5 border-b border-stone-800">
          <Brand />
          <button type="button" onClick={close} aria-label="Cerrar menú"
            className="lg:hidden p-2 -mr-2 text-stone-500 hover:text-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <p className="px-5 mb-2 text-[11px] text-stone-600 font-sans uppercase tracking-widest">Panel</p>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={close}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 border-l-2 text-sm font-sans uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'border-brand-red bg-stone-900 text-stone-100'
                    : 'border-transparent text-stone-500 hover:text-stone-200 hover:bg-stone-900/50'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.showQueueCount && queueCount > 0 && (
                <span className="min-w-5 px-1.5 py-0.5 bg-stone-800 text-stone-300 text-[11px] text-center tracking-normal">
                  {queueCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-stone-800 p-5 space-y-3">
          <p className="text-stone-500 text-xs font-sans truncate" title={user.email}>{user.email}</p>
          <Link to="/" className="flex items-center gap-2 text-xs font-sans text-stone-400 hover:text-stone-100 uppercase tracking-widest transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Ver sitio
          </Link>
          <button type="button" onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-sans text-stone-400 hover:text-brand-red uppercase tracking-widest transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="lg:pl-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function Brand() {
  return (
    <Link to="/admin" className="flex items-center gap-2 group">
      <Camera className="w-5 h-5 text-brand-red" />
      <span className="font-serif text-base font-bold tracking-tight text-stone-100 group-hover:text-brand-red transition-colors">
        Imágen e Historia
      </span>
    </Link>
  )
}
