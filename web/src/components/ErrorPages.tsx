import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Sidebar } from './Sidebar'
import { useRbac } from '../lib/rbac'
import { useHasLayout } from '../routes/__root'

function ErrorContent({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-sm text-center mb-24">{children}</div>
}

function ErrorLayout({ children }: { children: React.ReactNode }) {
  const hasLayout = useHasLayout()
  const { unauthenticated } = useRbac()

  // Already inside the sidebar layout (AuthGuard rendered it) — just center
  if (hasLayout) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        {children}
      </div>
    )
  }

  // Standalone (notFoundComponent rendered outside root component tree)
  if (unauthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center px-4">
        {children}
      </main>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <ErrorLayout>
      <ErrorContent>
        <p className="text-8xl font-bold text-muted-foreground/20 select-none leading-none mb-6">
          404
        </p>
        <h1 className="text-xl font-semibold mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link to="/">Go home</Link>
        </Button>
      </ErrorContent>
    </ErrorLayout>
  )
}

export function ErrorPage({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <ErrorLayout>
      <ErrorContent>
        <p className="text-8xl font-bold text-muted-foreground/20 select-none leading-none mb-6">
          500
        </p>
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-4">
          An unexpected error occurred. You can try again or go back home.
        </p>
        {error?.message && (
          <p className="text-xs font-mono bg-muted text-muted-foreground rounded px-3 py-2 mb-8 break-all text-left">
            {error.message}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full" onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" size="lg" className="w-full" asChild>
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </ErrorContent>
    </ErrorLayout>
  )
}
