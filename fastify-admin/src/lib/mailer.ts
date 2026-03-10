import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
}

export async function sendMfaCode(to: string, code: string) {
  const from = process.env.SMTP_FROM ?? 'noreply@fastifyadmin.local'
  const transporter = createTransport()
  await transporter.sendMail({
    from,
    to,
    subject: 'Your verification code',
    text: `Your FastifyAdmin verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    html: `
            <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
                <h2 style="margin-bottom:8px">Verification code</h2>
                <p style="color:#666;margin-bottom:24px">Enter this code to complete sign in. It expires in 10 minutes.</p>
                <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 24px;background:#f4f4f5;border-radius:8px;text-align:center">${code}</div>
                <p style="color:#999;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `,
  })
}
