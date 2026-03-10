import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'

export type AuthUser = {
  id: number
  username: string
  email: string
  fullName: string
  bio: string
  mfaEnabled: boolean
  hasPassword: boolean
  oauthProvider: string | null
  permissions: string[]
}

type RbacContextValue = {
  user: AuthUser | null
  /** true while the initial /api/auth/me fetch is in-flight */
  loading: boolean
  /** true if /api/auth/me returned 401 */
  unauthenticated: boolean
  can: (permission: string) => boolean
  /** Call after a successful login to re-load user + permissions */
  refresh: () => Promise<void>
}

const RbacContext = createContext<RbacContextValue>({
  user: null,
  loading: true,
  unauthenticated: false,
  can: () => false,
  refresh: async () => {},
})

// Module-level store — readable synchronously from beforeLoad / outside React
let _permissions = new Set<string>()
let _loaded = false

export function can(permission: string) {
  return _permissions.has(permission)
}
/** True once the first /api/auth/me response has been processed. */
export function permissionsLoaded() {
  return _loaded
}

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me')
  if (!res.ok) return null
  return res.json()
}

export function RbacProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthenticated, setUnauthenticated] = useState(false)
  const router = useRouter()

  async function load() {
    setLoading(true)
    const me = await fetchMe()
    _permissions = new Set(me?.permissions ?? [])
    _loaded = true
    setUser(me)
    setUnauthenticated(me === null)
    setLoading(false)
    // re-run beforeLoad guards now that permissions are known
    router.invalidate()
  }

  useEffect(() => {
    load()
  }, [])

  const permissions = new Set(user?.permissions ?? [])

  return (
    <RbacContext.Provider
      value={{
        user,
        loading,
        unauthenticated,
        can: (p) => permissions.has(p),
        refresh: load,
      }}
    >
      {children}
    </RbacContext.Provider>
  )
}

export function useRbac() {
  return useContext(RbacContext)
}

/** Returns true if the user has the given permission. */
export function useCan(permission: string) {
  return useRbac().can(permission)
}
