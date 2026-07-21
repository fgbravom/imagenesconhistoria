import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    function handleScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40)
        ticking = false
      })
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <header
      className={`border-b sticky top-0 z-50 backdrop-blur transition-colors duration-300 ${
        scrolled ? 'bg-stone-950/90 border-stone-800' : 'bg-transparent border-stone-800/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Camera className="w-6 h-6 text-brand-red" />
          <span className="font-serif text-lg font-bold tracking-tight text-stone-100 group-hover:text-brand-red transition-colors">
            Imágen e Historia
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link
                to="/admin"
                className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-100 active:text-stone-100 transition-colors uppercase tracking-widest p-2 -m-2"
              >
                <Shield className="w-4 h-4" /> Admin
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="flex items-center gap-1 text-sm text-stone-500 hover:text-brand-red active:text-brand-red transition-colors p-2.5 -m-2.5"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm text-stone-500 hover:text-stone-300 active:text-stone-300 transition-colors p-2 -m-2"
            >
              Acceder
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
