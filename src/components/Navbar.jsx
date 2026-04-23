import { Link, useNavigate } from 'react-router-dom'
import { Camera, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="border-b border-stone-800/50 bg-transparent backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Camera className="w-6 h-6 text-brand-red" />
          <span className="font-serif text-lg font-bold tracking-tight text-stone-100 group-hover:text-brand-red transition-colors">
            Imágenes con Historia
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link to="/admin" className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-100 transition-colors uppercase tracking-widest">
                <Shield className="w-4 h-4" /> Admin
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-stone-500 hover:text-brand-red transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-stone-500 hover:text-stone-300 transition-colors">
              Acceder
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
