import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

import { FastifyAdmin } from './lib/FastifyAdmin'
import { ThemeProvider } from './lib/theme'

import {
  User03Icon,
  ShieldUserIcon,
  LockKeyIcon,
  Package01Icon,
} from '@hugeicons/core-free-icons'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  notFoundMode: 'root',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!

async function init() {
  await FastifyAdmin.initFromApi({
    User03: User03Icon,
    ShieldUser: ShieldUserIcon,
    LockKey: LockKeyIcon,
    Package01: Package01Icon,
  })

  if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>,
    )
  }
}

init()
