import type { buildApp } from './setup.js'

type Ctx = Awaited<ReturnType<typeof buildApp>>

export function createHelpers(ctx: () => Ctx) {
  function checkUsername(username: string) {
    return ctx().app.inject({
      method: 'GET',
      url: `/api/auth/check-username?username=${username}`,
    })
  }

  function signup(username: string, email: string, password = 'password123') {
    return ctx().app.inject({
      method: 'POST',
      url: '/api/auth/signup',
      payload: { fullName: 'Test User', username, email, password },
    })
  }

  function login(username_or_email: string, password = 'password123') {
    return ctx().app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: username_or_email, password },
    })
  }

  function verify(email: string, code: string) {
    return ctx().app.inject({
      method: 'POST',
      url: '/api/auth/signup/verify',
      payload: { email, code },
    })
  }

  function cookieFrom(res: Awaited<ReturnType<typeof login>>) {
    return res.headers['set-cookie'] as string
  }

  return { checkUsername, signup, login, verify, cookieFrom }
}
