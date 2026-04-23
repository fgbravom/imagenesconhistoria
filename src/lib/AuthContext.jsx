import { createContext, useContext, useEffect, useState } from 'react'
import { insforge } from './insforge'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = no session

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      setUser(data?.user ?? null)
    })
  }, [])

  async function signIn(email, password) {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password })
    if (!error) setUser(data.user)
    return { data, error }
  }

  async function signOut() {
    await insforge.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
