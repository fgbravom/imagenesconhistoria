import { useEffect, useRef, useState } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import { EMPTY_FIELDS, fieldsFrom } from '../../lib/photoRecords'
import { Field } from './ui'

/*
 * Formulario de fotografía compartido por Publicar (sin `record`, con zona
 * de arrastre) y por la edición inline de fotos y de la cola (con `record`).
 * `onSubmit({ fields, file })` devuelve `{ error }` si algo falló; sin
 * `record`, el formulario se limpia tras un envío exitoso.
 */
export default function PhotoForm({
  record,
  onSubmit,
  onCancel,
  requireImage = false,
  submitLabel,
  savingLabel,
  submitClassName = 'bg-brand-red text-white hover:bg-red-700',
}) {
  const [fields, setFields] = useState(() => (record ? fieldsFrom(record) : EMPTY_FIELDS))
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()
  const previewRef = useRef(null)

  // Liberar la URL de la vista previa al desmontar.
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  function setImage(f) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    const url = f ? URL.createObjectURL(f) : null
    previewRef.current = url
    setFile(f)
    setPreview(url)
    if (!f && fileRef.current) fileRef.current.value = ''
  }

  function handleFile(e) {
    const f = e.target.files[0]
    if (f) setImage(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) setImage(f)
  }

  function set(name) {
    return e => setFields(f => ({ ...f, [name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (requireImage && !file) { setError('Debes seleccionar una imagen.'); return }
    setSaving(true)
    setError(null)

    const result = await onSubmit({ fields, file })
    setSaving(false)

    if (result?.error) {
      setError(result.error)
    } else if (!record) {
      setFields(EMPTY_FIELDS)
      setImage(null)
    }
  }

  const compact = Boolean(record)

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? 'bg-stone-900/60 border-t border-stone-800 p-4 sm:p-6 space-y-5' : 'space-y-8'}
    >
      <div>
        <label className="block text-xs text-stone-500 font-sans uppercase tracking-widest mb-2">
          Fotografía {requireImage && <span className="text-brand-red">*</span>}
        </label>

        {compact ? (
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="relative flex-shrink-0 self-start">
              <img
                src={preview ?? record.image_url}
                alt={record.title}
                className="w-40 h-28 object-cover border border-stone-700"
              />
              {preview && (
                <button type="button" onClick={() => setImage(null)}
                  className="absolute top-1 right-1 bg-stone-950/80 text-stone-300 hover:text-white p-1"
                  title="Descartar imagen nueva">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <button type="button" onClick={() => fileRef.current.click()}
                className="flex items-center gap-2 text-xs font-sans text-stone-300 border border-stone-700 hover:border-stone-500 px-4 py-2 transition-colors uppercase tracking-widest">
                <Upload className="w-3 h-3" />
                {record.image_key ? 'Reemplazar imagen' : 'Subir imagen'}
              </button>
              <p className="text-stone-600 text-xs font-sans">
                {preview
                  ? 'Se subirá al guardar los cambios.'
                  : record.image_key
                    ? 'La imagen actual se borrará del almacenamiento al reemplazarla.'
                    : 'Esta fotografía aún no tiene imagen.'}
              </p>
            </div>
          </div>
        ) : preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Vista previa" className="max-h-64 object-contain border border-stone-700" />
            <button type="button" onClick={() => setImage(null)}
              aria-label="Quitar imagen"
              className="absolute top-2 right-2 bg-stone-950/80 text-stone-300 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current.click()}
            className="border-2 border-dashed border-stone-700 hover:border-brand-red transition-colors p-12 flex flex-col items-center justify-center cursor-pointer text-stone-500 hover:text-stone-300">
            <Upload className="w-8 h-8 mb-3" />
            <p className="text-sm font-sans text-center">Arrastra o haz clic para seleccionar imagen</p>
            <p className="text-xs font-sans mt-1 text-stone-600">JPG, PNG, WEBP</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <Field label="Título" required>
          <input type="text" required value={fields.title} onChange={set('title')} className="input-field" />
        </Field>
        <Field label={compact ? 'Historia' : 'Historia / Descripción'} required>
          <textarea required rows={compact ? 5 : 7} value={fields.story} onChange={set('story')}
            className="input-field resize-none"
            placeholder={compact ? undefined : 'Cuenta la historia detrás de esta fotografía...'} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Field label="Año">
          <input type="number" min="1900" max={new Date().getFullYear()} value={fields.year}
            onChange={set('year')} className="input-field" placeholder="1985" />
        </Field>
        <Field label="Fotógrafo">
          <input type="text" value={fields.photographer} onChange={set('photographer')}
            className="input-field" placeholder={compact ? undefined : 'Nombre o archivo de origen'} />
        </Field>
        <Field label="Lugar">
          <input type="text" value={fields.location} onChange={set('location')}
            className="input-field" placeholder={compact ? undefined : 'Santiago, Chile'} />
        </Field>
      </div>

      {error && (
        <p className="text-brand-red text-sm font-sans flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className={`${compact ? 'px-6 py-2' : 'px-10 py-3'} text-sm font-sans uppercase tracking-widest transition-colors disabled:opacity-50 ${submitClassName}`}>
          {saving ? savingLabel : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="text-stone-500 hover:text-stone-300 text-sm font-sans transition-colors">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
