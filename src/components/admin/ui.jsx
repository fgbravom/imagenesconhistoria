import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle, X } from 'lucide-react'

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-stone-800">
      <div>
        <h1 className="font-serif text-3xl text-stone-100">{title}</h1>
        {description && <p className="text-stone-500 text-sm font-sans mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

/* Los mensajes de éxito se cierran solos; los de error quedan hasta cerrarlos. */
export function StatusBanner({ status, onDismiss, className = '' }) {
  useEffect(() => {
    if (status?.type !== 'success' || !onDismiss) return
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [status, onDismiss])

  if (!status) return null

  return (
    <div className={`flex items-center gap-2 text-sm font-sans p-3 ${className} ${
      status.type === 'error'
        ? 'bg-red-950 text-red-300 border border-red-800'
        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
    }`}>
      {status.type === 'error'
        ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
        : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">
        {status.msg}
        {status.link && (
          <Link to={status.link.to} className="ml-2 underline underline-offset-2 hover:text-white">
            {status.link.label}
          </Link>
        )}
      </span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Cerrar mensaje" className="p-1 -m-1 opacity-70 hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs text-stone-500 font-sans uppercase tracking-widest mb-1">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>
      {children}
    </div>
  )
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-2">
      {[...Array(rows)].map((_, i) => <div key={i} className="h-16 bg-stone-900 animate-pulse" />)}
    </div>
  )
}
