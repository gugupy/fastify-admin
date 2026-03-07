import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { EyeIcon, EyeOffIcon, FastifyAdminIcon } from '../components/icons'
import { useRbac } from '../lib/rbac'
import { getAdmin } from '../lib/FastifyAdmin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { GoogleIcon, GitHubIcon, MicrosoftIcon } from '../components/OAuthIcons'
import { ThemeToggle } from '../components/ThemeToggle'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { refresh } = useRbac()
  const router = useRouter()
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { google, github, microsoft } = getAdmin().oauth
  const hasOAuth = google || github || microsoft

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identity, password }),
    })

    const body = await res.json().catch(() => ({}))

    if (res.status === 202 && body.mfaRequired) {
      router.navigate({
        to: '/verify-mfa',
        search: { userId: body.userId, email: identity },
      })
      return
    }

    if (!res.ok) {
      setError(body.message ?? 'Login failed.')
      setLoading(false)
      return
    }

    await refresh()
    router.navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center">
              <FastifyAdminIcon size={16} />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              {getAdmin().name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <div className="border rounded-lg bg-background p-8 shadow-sm">
          {hasOAuth && (
            <>
              <div className="flex flex-col gap-2">
                {google && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <a href="/api/auth/google">
                      <GoogleIcon />
                      Continue with Google
                    </a>
                  </Button>
                )}
                {github && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <a href="/api/auth/github">
                      <GitHubIcon />
                      Continue with GitHub
                    </a>
                  </Button>
                )}
                {microsoft && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <a href="/api/auth/microsoft">
                      <MicrosoftIcon />
                      Continue with Microsoft
                    </a>
                  </Button>
                )}
              </div>
              <FieldSeparator className="my-6">or</FieldSeparator>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="identity">Email or username</FieldLabel>
              <Input
                id="identity"
                type="text"
                autoComplete="username"
                placeholder="you@example.com or janedoe"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon size={16} />
                  ) : (
                    <EyeIcon size={16} />
                  )}
                </button>
              </div>
            </Field>

            {error && <FieldError>{error}</FieldError>}

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        {getAdmin().signup && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-foreground font-medium underline underline-offset-4 hover:text-primary"
            >
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
