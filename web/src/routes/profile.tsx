import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useRbac } from '../lib/rbac'
import { getAdmin } from '../lib/FastifyAdmin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldLabel,
  FieldDescription,
} from '@/components/ui/field'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

const CODE_LENGTH = 6

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_1.6fr] gap-8 py-8 border-b last:border-b-0">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

function StatusBadge({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5  ${on ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
    >
      <span
        className={`w-1.5 h-1.5  ${on ? 'bg-green-500' : 'bg-muted-foreground/50'}`}
      />
      {on ? 'Enabled' : 'Disabled'}
    </span>
  )
}

export default function ProfilePage() {
  const { refresh, user, can } = useRbac()

  // Profile form
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Email change
  const [newEmail, setNewEmail] = useState(user?.email ?? '')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailDigits, setEmailDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill(''),
  )
  const emailInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // MFA
  const [mfaSaving, setMfaSaving] = useState(false)
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaOtpSent, setMfaOtpSent] = useState(false)
  const [mfaDigits, setMfaDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill(''),
  )
  const mfaInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (user) {
      setFullName(user.fullName)
      setBio(user.bio)
      setNewEmail(user.email)
    }
  }, [user])

  useEffect(() => {
    if (emailOtpSent) emailInputRefs.current[0]?.focus()
  }, [emailOtpSent])

  useEffect(() => {
    if (mfaOtpSent) mfaInputRefs.current[0]?.focus()
  }, [mfaOtpSent])

  async function saveProfile(e: React.SubmitEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(false)

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, bio }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setProfileError(body.message ?? 'Failed to save.')
    } else {
      setProfileSuccess(true)
      await refresh()
      setTimeout(() => setProfileSuccess(false), 3000)
    }
    setProfileSaving(false)
  }

  async function requestEmailChange() {
    if (!user || newEmail === user.email) return
    setEmailSaving(true)
    setEmailError(null)

    const res = await fetch('/api/auth/profile/email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail }),
    })

    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setEmailError(body.message ?? 'Failed to send verification code.')
      setEmailSaving(false)
      return
    }
    setEmailOtpSent(true)
    setEmailSaving(false)
  }

  function handleEmailDigitChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...emailDigits]
    next[idx] = digit
    setEmailDigits(next)
    if (digit && idx < CODE_LENGTH - 1) emailInputRefs.current[idx + 1]?.focus()
    if (next.every((d) => d)) submitEmailOtp(next.join(''))
  }

  function handleEmailDigitKeyDown(
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === 'Backspace' && !emailDigits[idx] && idx > 0)
      emailInputRefs.current[idx - 1]?.focus()
  }

  function handleEmailPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, CODE_LENGTH)
    if (!pasted) return
    const next = Array(CODE_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setEmailDigits(next)
    emailInputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
    if (pasted.length === CODE_LENGTH) submitEmailOtp(pasted)
  }

  async function submitEmailOtp(code: string) {
    setEmailError(null)
    setEmailSaving(true)

    const res = await fetch('/api/auth/profile/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setEmailError(body.message ?? 'Verification failed.')
      setEmailDigits(Array(CODE_LENGTH).fill(''))
      setEmailSaving(false)
      emailInputRefs.current[0]?.focus()
      return
    }

    await res.json()
    setEmailOtpSent(false)
    setEmailDigits(Array(CODE_LENGTH).fill(''))
    await refresh()
    setEmailSaving(false)
  }

  async function savePassword(e: React.SubmitEvent) {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: currentPassword || undefined,
        newPassword,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setPasswordError(body.message ?? 'Failed to update password.')
    } else {
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      await refresh()
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
    setPasswordSaving(false)
  }

  async function toggleMfa() {
    if (!user) return
    setMfaSaving(true)
    setMfaError(null)

    const res = await fetch('/api/auth/mfa', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !user.mfaEnabled }),
    })

    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMfaError(body.message ?? 'Failed to update MFA.')
      setMfaSaving(false)
      return
    }

    if (body.otpSent) {
      setMfaOtpSent(true)
      setMfaSaving(false)
      return
    }

    await refresh()
    setMfaSaving(false)
  }

  function handleMfaDigitChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...mfaDigits]
    next[idx] = digit
    setMfaDigits(next)
    if (digit && idx < CODE_LENGTH - 1) mfaInputRefs.current[idx + 1]?.focus()
    if (next.every((d) => d)) submitMfaOtp(next.join(''))
  }

  function handleMfaDigitKeyDown(
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === 'Backspace' && !mfaDigits[idx] && idx > 0)
      mfaInputRefs.current[idx - 1]?.focus()
  }

  function handleMfaPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, CODE_LENGTH)
    if (!pasted) return
    const next = Array(CODE_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setMfaDigits(next)
    mfaInputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
    if (pasted.length === CODE_LENGTH) submitMfaOtp(pasted)
  }

  async function submitMfaOtp(code: string) {
    setMfaError(null)
    setMfaSaving(true)

    const res = await fetch('/api/auth/mfa/enable/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setMfaError(body.message ?? 'Verification failed.')
      setMfaDigits(Array(CODE_LENGTH).fill(''))
      setMfaSaving(false)
      mfaInputRefs.current[0]?.focus()
      return
    }

    await refresh()
    setMfaOtpSent(false)
    setMfaDigits(Array(CODE_LENGTH).fill(''))
    setMfaSaving(false)
  }

  if (!user) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account settings
        </p>
      </div>

      <div className="border  bg-background px-6">
        {/* Profile info — always visible, edit controls hidden without permission */}
        <Section title="Personal information">
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input id="username" value={user.username} disabled />
              <FieldDescription>Username cannot be changed.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!can('profile.edit')}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="bio">Bio</FieldLabel>
              <Input
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio…"
                disabled={!can('profile.edit')}
              />
            </Field>
            {profileError && <FieldError>{profileError}</FieldError>}
            {can('profile.edit') && (
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={profileSaving}>
                  {profileSaving ? 'Saving…' : 'Save changes'}
                </Button>
                {profileSuccess && (
                  <span className="text-xs text-green-600">Saved!</span>
                )}
              </div>
            )}
          </form>
        </Section>

        {/* Email — always visible, update controls hidden without permission */}
        <Section
          title="Email address"
          description="Your email is used for login and notifications."
        >
          {emailOtpSent ? (
            <>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to{' '}
                <span className="text-foreground font-medium">{newEmail}</span>.
                Enter it to confirm your new email.
              </p>
              <div className="flex gap-2" onPaste={handleEmailPaste}>
                {emailDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      emailInputRefs.current[i] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleEmailDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleEmailDigitKeyDown(i, e)}
                    disabled={emailSaving}
                    className="w-10 h-12 rounded-md border border-input bg-background text-center text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50"
                  />
                ))}
              </div>
              {emailError && <FieldError>{emailError}</FieldError>}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  disabled={emailSaving || emailDigits.some((d) => !d)}
                  onClick={() => submitEmailOtp(emailDigits.join(''))}
                >
                  {emailSaving ? 'Verifying…' : 'Confirm email'}
                </Button>
                <button
                  type="button"
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  onClick={() => {
                    setEmailOtpSent(false)
                    setEmailDigits(Array(CODE_LENGTH).fill(''))
                    setEmailError(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={!can('profile.email')}
                />
              </Field>
              {emailError && <FieldError>{emailError}</FieldError>}
              {can('profile.email') && (
                <div>
                  <Button
                    type="button"
                    disabled={
                      emailSaving || newEmail === user.email || !newEmail
                    }
                    onClick={requestEmailChange}
                  >
                    {emailSaving ? 'Sending code…' : 'Update email'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Password */}
        {can('password.change') && (
          <Section
            title={user.hasPassword ? 'Change password' : 'Set a password'}
            description={
              user.oauthProvider && !user.hasPassword
                ? `You signed in with ${user.oauthProvider}. Set a password to also enable email login.`
                : undefined
            }
          >
            <form onSubmit={savePassword} className="flex flex-col gap-4">
              {user.hasPassword && (
                <Field>
                  <FieldLabel htmlFor="currentPassword">
                    Current password
                  </FieldLabel>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="newPassword">New password</FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </Field>
              {passwordError && <FieldError>{passwordError}</FieldError>}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={passwordSaving}>
                  {passwordSaving
                    ? 'Saving…'
                    : user.hasPassword
                      ? 'Update password'
                      : 'Set password'}
                </Button>
                {passwordSuccess && (
                  <span className="text-xs text-green-600">
                    Password updated!
                  </span>
                )}
              </div>
            </form>
          </Section>
        )}

        {/* MFA */}
        {getAdmin().mfaEnabled && can('mfa.manage') && (
          <Section
            title="Two-factor authentication"
            description="Add an extra layer of security. A 6-digit code will be emailed to you each time you sign in."
          >
            {mfaOtpSent ? (
              <>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to{' '}
                  <span className="text-foreground font-medium">
                    {user.email}
                  </span>
                  . Enter it to activate two-factor authentication.
                </p>
                <div className="flex gap-2" onPaste={handleMfaPaste}>
                  {mfaDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        mfaInputRefs.current[i] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleMfaDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleMfaDigitKeyDown(i, e)}
                      disabled={mfaSaving}
                      className="w-10 h-12 rounded-md border border-input bg-background text-center text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50"
                    />
                  ))}
                </div>
                {mfaError && <FieldError>{mfaError}</FieldError>}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    disabled={mfaSaving || mfaDigits.some((d) => !d)}
                    onClick={() => submitMfaOtp(mfaDigits.join(''))}
                  >
                    {mfaSaving ? 'Verifying…' : 'Confirm & enable'}
                  </Button>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    onClick={() => {
                      setMfaOtpSent(false)
                      setMfaDigits(Array(CODE_LENGTH).fill(''))
                      setMfaError(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      Email verification code
                    </span>
                    <StatusBadge on={user.mfaEnabled} />
                  </div>
                  <Button
                    variant={user.mfaEnabled ? 'outline' : 'default'}
                    onClick={toggleMfa}
                    disabled={mfaSaving}
                  >
                    {mfaSaving ? '…' : user.mfaEnabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
                {mfaError && <FieldError>{mfaError}</FieldError>}
              </>
            )}
          </Section>
        )}
      </div>
    </div>
  )
}
