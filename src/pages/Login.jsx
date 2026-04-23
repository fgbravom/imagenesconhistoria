import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Credenciales incorrectas.')
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Camera className="w-10 h-10 text-brand-red" />
        </div>
        <h1 className="font-serif text-2xl text-stone-100 text-center mb-8">Acceso Admin</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-stone-500 font-sans uppercase tracking-widest mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 text-stone-100 px-4 py-2 text-sm font-sans focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 font-sans uppercase tracking-widest mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 text-stone-100 px-4 py-2 text-sm font-sans focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>
          {error && <p className="text-brand-red text-sm font-sans">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red text-white py-3 text-sm font-sans uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
