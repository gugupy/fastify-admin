import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useRef, useState, useEffect } from 'react'
import { FastifyAdminIcon } from '../components/icons'
import { useRbac } from '../lib/rbac'
import { ThemeToggle } from '../components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'

type Search = { userId: number; email: string }

export const Route = createFileRoute('/verify-mfa')({
  validateSearch: (s): Search => ({
    userId: Number(s.userId),
    email: String(s.email ?? ''),
  }),
  component: VerifyMfaPage,
})

const CODE_LENGTH = 6

function VerifyMfaPage() {
  const { userId, email } = Route.useSearch()
  const { refresh } = useRbac()
  const router = useRouter()
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  function handleDigitChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = digit
    setDigits(next)
    if (digit && idx < CODE_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus()
    }
    if (next.every((d) => d)) {
      submitCode(next.join(''))
    }
  }

  function handleKeyDown(
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, CODE_LENGTH)
    if (!pasted) return
    const next = Array(CODE_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
    if (pasted.length === CODE_LENGTH) submitCode(pasted)
  }

  async function submitCode(code: string) {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Verification failed.')
      setDigits(Array(CODE_LENGTH).fill(''))
      setLoading(false)
      inputRefs.current[0]?.focus()
      return
    }

    await refresh()
    router.navigate({ to: '/' })
  }

  async function handleResend() {
    setResending(true)
    setError(null)
    // Re-trigger login with stored credentials isn't possible here — instead
    // send the user back to login so they can try again.
    router.navigate({ to: '/login' })
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
              FastifyAdmin
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{' '}
              <span className="text-foreground font-medium">{email}</span>
            </p>
          </div>
        </div>

        <div className="border rounded-lg bg-background p-8 shadow-sm">
          <p className="text-sm font-medium mb-4 text-center">
            Enter verification code
          </p>

          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className="w-10 h-12 rounded-md border border-input bg-background text-center text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50"
              />
            ))}
          </div>

          {error && (
            <FieldError className="mb-4 text-center">{error}</FieldError>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={loading || digits.some((d) => !d)}
            onClick={() => submitCode(digits.join(''))}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-foreground font-medium underline underline-offset-4 hover:text-primary disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Back to sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
