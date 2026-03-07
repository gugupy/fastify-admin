import { EntityManager } from '@mikro-orm/core'
import { FastifyInstance, FastifyRequest } from 'fastify'
import fastifyOAuth2, { type OAuth2Namespace } from '@fastify/oauth2'
import { User } from '../entities/user.entity.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { sendMfaCode } from '../lib/mailer.js'
import { loadPermissions, generateUsername } from '../lib/auth-utils.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: number; email: string }
    user: { sub: number; email: string }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2?: OAuth2Namespace
    githubOAuth2?: OAuth2Namespace
    microsoftOAuth2?: OAuth2Namespace
  }
}

async function loginOrCreateOAuthUser(
  app: FastifyInstance,
  em: EntityManager,
  profile: {
    email: string
    fullName: string
    provider: string
    oauthId: string
    emailVerified: boolean
  },
  reply: any,
) {
  const fork = em.fork()
  let user = await fork.findOne(User, { email: profile.email })

  if (!user) {
    const username = await generateUsername(fork, profile.email)
    user = fork.create(User, {
      fullName: profile.fullName,
      username,
      email: profile.email,
      oauthProvider: profile.provider,
      oauthId: profile.oauthId,
      emailVerified: profile.emailVerified,
    })
    await fork.persist(user).flush()
  }

  const token = app.jwt.sign({ sub: user.id, email: user.email })
  reply
    .setCookie('token', token, { httpOnly: true, path: '/', sameSite: 'lax' })
    .redirect('/')
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  em: EntityManager,
  opts: { signup: boolean; requireEmailVerification: boolean; emailEnabled: boolean } = {
    signup: true,
    requireEmailVerification: false,
    emailEnabled: false,
  },
) {
  app.get('/api/auth/providers', async (_req, reply) => {
    reply.send({
      google: !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
      github: !!(
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ),
      microsoft: !!(
        process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
      ),
    })
  })

  if (opts.signup) {
    app.get<{ Querystring: { username: string } }>(
      '/api/auth/check-username',
      async (req, reply) => {
        const { username } = req.query
        if (!username || username.length < 5)
          return reply.send({ available: false })
        const fork = em.fork()
        const existing = await fork.findOne(User, { username })
        reply.send({ available: !existing })
      },
    )

    app.post<{
      Body: {
        fullName: string
        username: string
        email: string
        password: string
      }
    }>('/api/auth/signup', async (req, reply) => {
      const fork = em.fork()
      const { fullName, username, email, password } = req.body
      const existing = await fork.findOne(User, { email })
      if (existing) {
        return reply.status(409).send({ message: 'Email already in use.' })
      }
      const user = fork.create(User, {
        fullName,
        username,
        email,
        password: await hashPassword(password),
      })

      try {
        if (opts.requireEmailVerification) {
          const code = String(Math.floor(100000 + Math.random() * 900000))
          user.mfaCode = await hashPassword(code)
          user.mfaCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
          await fork.persist(user).flush()
          await sendMfaCode(email, code)
          return reply.send({ ok: true, requiresVerification: true })
        }

        await fork.persist(user).flush()
      } catch (err: any) {
        if (err?.code === '23505') {
          const column = err?.detail?.match(/Key \((\w+)\)/)?.[1]
          if (column === 'username')
            return reply
              .status(409)
              .send({ message: 'Username already taken.' })
          if (column === 'email')
            return reply.status(409).send({ message: 'Email already in use.' })
        }
        return reply
          .status(500)
          .send({ message: 'Something went wrong. Please try again.' })
      }

      const token = app.jwt.sign({ sub: user.id, email: user.email })
      reply
        .setCookie('token', token, {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
        })
        .send({ ok: true, requiresVerification: false })
    })

    app.post<{ Body: { email: string; code: string } }>(
      '/api/auth/signup/verify',
      async (req, reply) => {
        const fork = em.fork()
        const { email, code } = req.body
        const user = await fork.findOne(User, { email })
        if (!user || !user.mfaCode || !user.mfaCodeExpiresAt) {
          return reply.status(400).send({ message: 'Invalid or expired code.' })
        }
        if (user.mfaCodeExpiresAt < new Date()) {
          return reply.status(400).send({ message: 'Code expired.' })
        }
        if (!(await verifyPassword(code, user.mfaCode))) {
          return reply.status(400).send({ message: 'Invalid code.' })
        }
        user.mfaCode = undefined
        user.mfaCodeExpiresAt = undefined
        user.emailVerified = true
        await fork.flush()
        const token = app.jwt.sign({ sub: user.id, email: user.email })
        reply
          .setCookie('token', token, {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
          })
          .send({ ok: true })
      },
    )
  }

  app.post<{ Body: { email: string; password: string } }>(
    '/api/auth/login',
    async (req, reply) => {
      const fork = em.fork()
      const { email, password } = req.body
      const identifier = String(email ?? '').trim()
      const user = await fork.findOne(User, {
        $or: [{ email: identifier }, { username: identifier }],
      })
      if (
        !user ||
        !user.password ||
        !(await verifyPassword(password, user.password))
      ) {
        return reply.status(401).send({ message: 'Invalid credentials.' })
      }
      if (opts.requireEmailVerification && !user.emailVerified) {
        return reply.status(403).send({ message: 'Email not verified.' })
      }
      if (user.mfaEnabled) {
        const code = String(Math.floor(100000 + Math.random() * 900000))
        user.mfaCode = await hashPassword(code)
        user.mfaCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
        await fork.flush()
        await sendMfaCode(user.email, code)
        return reply.status(202).send({ mfaRequired: true, userId: user.id })
      }
      const token = app.jwt.sign({ sub: user.id, email: user.email })
      reply
        .setCookie('token', token, {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
        })
        .send({ ok: true })
    },
  )

  app.post<{ Body: { userId: number; code: string } }>(
    '/api/auth/mfa/verify',
    async (req, reply) => {
      const fork = em.fork()
      const { userId, code } = req.body
      const user = await fork.findOne(User, { id: userId })
      if (!user || !user.mfaCode || !user.mfaCodeExpiresAt) {
        return reply.status(400).send({ message: 'No pending MFA challenge.' })
      }
      if (user.mfaCodeExpiresAt < new Date()) {
        user.mfaCode = undefined
        user.mfaCodeExpiresAt = undefined
        await fork.flush()
        return reply
          .status(400)
          .send({ message: 'Code expired. Please sign in again.' })
      }
      if (!(await verifyPassword(code, user.mfaCode))) {
        return reply.status(401).send({ message: 'Invalid code.' })
      }
      user.mfaCode = undefined
      user.mfaCodeExpiresAt = undefined
      await fork.flush()
      const token = app.jwt.sign({ sub: user.id, email: user.email })
      reply
        .setCookie('token', token, {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
        })
        .send({ ok: true })
    },
  )

  app.post('/api/auth/logout', async (_req, reply) => {
    reply.clearCookie('token', { path: '/' }).send({ ok: true })
  })

  app.get('/api/auth/me', async (req, reply) => {
    try {
      await req.jwtVerify({ onlyCookie: true })
    } catch {
      return reply.status(401).send({ message: 'Unauthenticated.' })
    }
    const fork = em.fork()
    const user = await fork.findOne(User, { id: req.user.sub })
    if (!user) return reply.status(401).send({ message: 'Unauthenticated.' })
    const permissions = await loadPermissions(fork, req.user.sub)
    reply.send({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      bio: user.bio,
      mfaEnabled: user.mfaEnabled,
      hasPassword: !!user.password,
      oauthProvider: user.oauthProvider ?? null,
      permissions,
    })
  })

  app.put<{ Body: { fullName: string; bio?: string } }>(
    '/api/auth/profile',
    async (req, reply) => {
      try {
        await req.jwtVerify({ onlyCookie: true })
      } catch {
        return reply.status(401).send({ message: 'Unauthenticated.' })
      }
      const fork = em.fork()
      const user = await fork.findOne(User, { id: req.user.sub })
      if (!user) return reply.status(401).send({ message: 'Unauthenticated.' })
      user.fullName = req.body.fullName ?? user.fullName
      user.bio = req.body.bio ?? user.bio
      await fork.flush()
      reply.send({ ok: true })
    },
  )

  app.put<{ Body: { currentPassword?: string; newPassword: string } }>(
    '/api/auth/password',
    async (req, reply) => {
      try {
        await req.jwtVerify({ onlyCookie: true })
      } catch {
        return reply.status(401).send({ message: 'Unauthenticated.' })
      }
      const fork = em.fork()
      const user = await fork.findOne(User, { id: req.user.sub })
      if (!user) return reply.status(401).send({ message: 'Unauthenticated.' })
      if (user.password) {
        if (
          !req.body.currentPassword ||
          !(await verifyPassword(req.body.currentPassword, user.password))
        ) {
          return reply
            .status(401)
            .send({ message: 'Current password is incorrect.' })
        }
      }
      user.password = await hashPassword(req.body.newPassword)
      await fork.flush()
      reply.send({ ok: true })
    },
  )

  app.put<{ Body: { enabled: boolean } }>(
    '/api/auth/mfa',
    async (req, reply) => {
      try {
        await req.jwtVerify({ onlyCookie: true })
      } catch {
        return reply.status(401).send({ message: 'Unauthenticated.' })
      }
      const fork = em.fork()
      const user = await fork.findOne(User, { id: req.user.sub })
      if (!user) return reply.status(401).send({ message: 'Unauthenticated.' })
      if (req.body.enabled && !opts.emailEnabled) {
        return reply.status(400).send({ message: 'Email is not enabled on this server.' })
      }
      user.mfaEnabled = req.body.enabled
      if (!req.body.enabled) {
        user.mfaCode = undefined
        user.mfaCodeExpiresAt = undefined
      }
      await fork.flush()
      reply.send({ ok: true, mfaEnabled: user.mfaEnabled })
    },
  )
}

export async function registerOAuthRoutes(
  app: FastifyInstance,
  em: EntityManager,
  baseUrl: string,
) {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    await app.register(fastifyOAuth2, {
      name: 'googleOAuth2',
      scope: ['profile', 'email'],
      credentials: {
        client: {
          id: process.env.GOOGLE_CLIENT_ID,
          secret: process.env.GOOGLE_CLIENT_SECRET,
        },
        auth: {
          authorizeHost: 'https://accounts.google.com',
          authorizePath: '/o/oauth2/v2/auth',
          tokenHost: 'https://oauth2.googleapis.com',
          tokenPath: '/token',
        },
      },
      startRedirectPath: '/api/auth/google',
      callbackUri: `${baseUrl}/api/auth/google/callback`,
    })

    app.get('/api/auth/google/callback', async (req, reply) => {
      const token =
        await app.googleOAuth2!.getAccessTokenFromAuthorizationCodeFlow(req)
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.token.access_token}` },
      })
      globalThis.console.log(await res.json())
      const profile = (await res.json()) as {
        id: string
        email: string
        name: string
        verified_email: boolean
      }
      await loginOrCreateOAuthUser(
        app,
        em,
        {
          email: profile.email,
          fullName: profile.name,
          provider: 'google',
          oauthId: profile.id,
          emailVerified: profile.verified_email,
        },
        reply,
      )
    })
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    await app.register(fastifyOAuth2, {
      name: 'githubOAuth2',
      scope: ['read:user', 'user:email'],
      credentials: {
        client: {
          id: process.env.GITHUB_CLIENT_ID,
          secret: process.env.GITHUB_CLIENT_SECRET,
        },
        auth: {
          tokenHost: 'https://github.com',
          tokenPath: '/login/oauth/access_token',
          authorizeHost: 'https://github.com',
          authorizePath: '/login/oauth/authorize',
        },
      },
      startRedirectPath: '/api/auth/github',
      callbackUri: `${baseUrl}/api/auth/github/callback`,
    })

    app.get('/api/auth/github/callback', async (req, reply) => {
      const token =
        await app.githubOAuth2!.getAccessTokenFromAuthorizationCodeFlow(req)
      const headers = {
        Authorization: `Bearer ${token.token.access_token}`,
        'User-Agent': 'fastify-admin',
      }
      const [userRes, emailsRes] = await Promise.all([
        fetch('https://api.github.com/user', { headers }),
        fetch('https://api.github.com/user/emails', { headers }),
      ])
      const user = (await userRes.json()) as {
        id: number
        name: string
        email: string | null
      }
      const emails = (await emailsRes.json()) as Array<{
        email: string
        primary: boolean
        verified: boolean
      }>
      const primaryEmail =
        user.email ??
        emails.find((e) => e.primary && e.verified)?.email ??
        emails[0]?.email
      if (!primaryEmail)
        return reply
          .status(400)
          .send({ message: 'No email found on GitHub account.' })
      await loginOrCreateOAuthUser(
        app,
        em,
        {
          email: primaryEmail,
          fullName: user.name ?? primaryEmail,
          provider: 'github',
          oauthId: String(user.id),
          emailVerified: true,
        },
        reply,
      )
    })
  }

  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    await app.register(fastifyOAuth2, {
      name: 'microsoftOAuth2',
      scope: ['openid', 'profile', 'email', 'User.Read'],
      credentials: {
        client: {
          id: process.env.MICROSOFT_CLIENT_ID,
          secret: process.env.MICROSOFT_CLIENT_SECRET,
        },
        auth: {
          authorizeHost: 'https://login.microsoftonline.com',
          authorizePath: '/common/oauth2/v2.0/authorize',
          tokenHost: 'https://login.microsoftonline.com',
          tokenPath: '/common/oauth2/v2.0/token',
        },
      },
      startRedirectPath: '/api/auth/microsoft',
      callbackUri: `${baseUrl}/api/auth/microsoft/callback`,
    })

    app.get('/api/auth/microsoft/callback', async (req, reply) => {
      const token =
        await app.microsoftOAuth2!.getAccessTokenFromAuthorizationCodeFlow(req)
      const res = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${token.token.access_token}` },
      })
      const profile = (await res.json()) as {
        id: string
        displayName: string
        mail: string
        userPrincipalName: string
      }
      const email = profile.mail ?? profile.userPrincipalName
      await loginOrCreateOAuthUser(
        app,
        em,
        {
          email,
          fullName: profile.displayName,
          provider: 'microsoft',
          oauthId: profile.id,
          emailVerified: true,
        },
        reply,
      )
    })
  }
}

export async function requireAuth(req: FastifyRequest, reply: any) {
  try {
    await req.jwtVerify({ onlyCookie: true })
  } catch {
    reply.status(401).send({ message: 'Unauthenticated.' })
  }
}
