import { insforge } from './insforge'

export const EMPTY_FIELDS = { title: '', story: '', year: '', photographer: '', location: '' }

export function fieldsFrom(record) {
  return {
    title: record.title ?? '',
    story: record.story ?? '',
    year: record.year ?? '',
    photographer: record.photographer ?? '',
    location: record.location ?? '',
  }
}

export function toRecord(fields) {
  return { ...fields, year: fields.year ? parseInt(fields.year) : null }
}

/* ── Subida de imagen al bucket ── */
export async function uploadImage(file) {
  const ext = file.name.split('.').pop()
  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await insforge.storage.from('photos').upload(key, file)

  if (error) return { error }

  return {
    key,
    url: data?.url ?? `${import.meta.env.VITE_INSFORGE_URL}/api/storage/buckets/photos/objects/${key}`,
  }
}

// Las fotos restauradas del respaldo no tienen archivo en storage todavía.
export async function removeImage(key) {
  if (!key) return { error: null }
  return insforge.storage.from('photos').remove(key)
}

/*
 * Actualiza una fila de `photos` o `photo_queue` y, si viene una imagen nueva,
 * la sube antes y borra la anterior solo cuando la fila ya quedó guardada.
 * Devuelve los cambios aplicados o un mensaje de error.
 */
export async function updateWithImage(table, record, { fields, file }) {
  const changes = toRecord(fields)

  if (file) {
    const { key, url, error } = await uploadImage(file)
    if (error) return { error: 'Error al subir la imagen.' }
    changes.image_url = url
    changes.image_key = key
  }

  const { error } = await insforge.database.from(table).update(changes).eq('id', record.id)

  if (error) {
    if (file) await removeImage(changes.image_key)
    return { error: 'Error al guardar los cambios.' }
  }

  if (file) await removeImage(record.image_key)
  return { changes }
}

/* Borra la fila primero y el archivo solo si la fila se borró. */
export async function deleteWithImage(table, record) {
  const { error } = await insforge.database.from(table).delete().eq('id', record.id)
  if (error) return { error }
  await removeImage(record.image_key)
  return { error: null }
}
