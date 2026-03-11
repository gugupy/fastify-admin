import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { createContext, useContext } from 'react'
import { RbacProvider, useRbac } from '../lib/rbac'
import { Sidebar } from '../components/Sidebar'
import { NotFoundPage, ErrorPage } from '../components/ErrorPages'

export const HasLayoutContext = createContext(false)

export function useHasLayout() {
  return useContext(HasLayoutContext)
}

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error as Error} reset={reset} />
  ),
})

const PUBLIC_PATHS = ['/login', '/logout', '/signup', '/verify-mfa']

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, unauthenticated } = useRbac()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isPublic = PUBLIC_PATHS.includes(pathname)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    )
  }

  if (unauthenticated && !isPublic) {
    navigate({ to: '/login' })
    return null
  }

  // public pages render without the sidebar layout
  if (isPublic) {
    return <>{children}</>
  }

  return (
    <HasLayoutContext.Provider value={true}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </HasLayoutContext.Provider>
  )
}

function Root() {
  return (
    <RbacProvider>
      <AuthGuard>
        <Outlet />
      </AuthGuard>
    </RbacProvider>
  )
}
