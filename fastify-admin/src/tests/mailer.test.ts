import { describe, it, expect, vi, beforeEach } from 'vitest'
import nodemailer from 'nodemailer'
import { sendMfaCode } from '../lib/mailer.js'

vi.mock('nodemailer')

// ── Setup ─────────────────────────────────────────────────────────────────────

let mockSendMail: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockSendMail = vi.fn().mockResolvedValue({})
  vi.mocked(nodemailer.createTransport).mockReturnValue({
    sendMail: mockSendMail,
  } as any)
  delete process.env.SMTP_FROM
})

// ── sendMfaCode ───────────────────────────────────────────────────────────────

describe('sendMfaCode', () => {
  it('sends email to the correct recipient', async () => {
    await sendMfaCode('user@example.com', '123456')
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com' }),
    )
  })

  it('uses the correct subject line', async () => {
    await sendMfaCode('user@example.com', '123456')
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Your verification code' }),
    )
  })

  it('includes the code in the plain-text body', async () => {
    await sendMfaCode('user@example.com', '987654')
    const [mail] = mockSendMail.mock.calls[0]
    expect(mail.text).toContain('987654')
  })

  it('includes the code in the HTML body', async () => {
    await sendMfaCode('user@example.com', '987654')
    const [mail] = mockSendMail.mock.calls[0]
    expect(mail.html).toContain('987654')
  })

  it('uses SMTP_FROM env var as the sender address', async () => {
    process.env.SMTP_FROM = 'custom@myapp.com'
    await sendMfaCode('user@example.com', '111111')
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'custom@myapp.com' }),
    )
  })

  it('falls back to default sender when SMTP_FROM is not set', async () => {
    await sendMfaCode('user@example.com', '222222')
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'noreply@fastifyadmin.local' }),
    )
  })

  it('creates a new transporter on each call', async () => {
    await sendMfaCode('a@example.com', '111111')
    await sendMfaCode('b@example.com', '222222')
    expect(vi.mocked(nodemailer.createTransport)).toHaveBeenCalledTimes(2)
  })
})
