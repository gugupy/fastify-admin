import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

import { FastifyAdmin } from './lib/FastifyAdmin'
import { ThemeProvider } from './lib/theme'
import { iconRegistry } from './lib/iconRegistry'
import type { AdminIconComponent } from './lib/iconRegistry'

import * as LucideIcons from 'lucide-react'

// Register all lucide-react icons by their component name.
// This means any lucide icon name (e.g. 'User', 'ShoppingCart', 'Database')
// can be used as the `icon` field in an EntityView without extra registration.
iconRegistry.registerEntityIcons(
  Object.fromEntries(
    Object.entries(LucideIcons).filter(([, v]) => typeof v === 'function'),
  ) as Record<string, AdminIconComponent>,
)

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
  await FastifyAdmin.initFromApi()

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
