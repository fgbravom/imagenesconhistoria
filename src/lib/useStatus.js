import { useCallback, useState } from 'react'

/* Estado de un StatusBanner con un `clear` estable para su onDismiss. */
export function useStatus() {
  const [status, setStatus] = useState(null)
  const clear = useCallback(() => setStatus(null), [])
  return [status, setStatus, clear]
}
