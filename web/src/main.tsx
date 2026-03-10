import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

import { FastifyAdmin } from './lib/FastifyAdmin'
import { ThemeProvider } from './lib/theme'
import { iconRegistry, asIcon } from './lib/iconRegistry'

import {
  // ── People ──────────────────────────────────────────────────────────────────
  User03Icon,
  UserGroupIcon,
  UserMultipleIcon,
  UserAccountIcon,
  UserCheck01Icon,
  UserStar01Icon,
  // ── Security ────────────────────────────────────────────────────────────────
  ShieldUserIcon,
  LockKeyIcon,
  SecurityIcon,
  LockIcon,
  Key01Icon,
  // ── Products / Commerce ─────────────────────────────────────────────────────
  Package01Icon,
  Package02Icon,
  ShoppingBag01Icon,
  ShoppingCart01Icon,
  Store01Icon,
  Tag01Icon,
  // ── Finance ─────────────────────────────────────────────────────────────────
  Wallet01Icon,
  Money01Icon,
  CreditCardIcon,
  Invoice01Icon,
  // ── Communication ───────────────────────────────────────────────────────────
  Mail01Icon,
  Message01Icon,
  Notification01Icon,
  // ── Analytics / Data ────────────────────────────────────────────────────────
  Analytics01Icon,
  BarChartIcon,
  PieChart01Icon,
  Chart01Icon,
  Database01Icon,
  Table01Icon,
  // ── Content ─────────────────────────────────────────────────────────────────
  File01Icon,
  Folder01Icon,
  Image01Icon,
  Note01Icon,
  News01Icon,
  BookOpen01Icon,
  // ── Navigation / UI ─────────────────────────────────────────────────────────
  Home01Icon,
  Search01Icon,
  Settings01Icon,
  Bookmark01Icon,
  StarIcon,
  // ── Tech / Infrastructure ────────────────────────────────────────────────────
  CodeIcon,
  CloudServerIcon,
  ServerStack01Icon,
  Globe02Icon,
  Link01Icon,
  Layers01Icon,
  // ── Time ────────────────────────────────────────────────────────────────────
  Calendar01Icon,
  Ticket01Icon,
} from '@hugeicons/core-free-icons'

iconRegistry.registerEntityIcons({
  // People
  User03: asIcon(User03Icon),
  UserGroup: asIcon(UserGroupIcon),
  UserMultiple: asIcon(UserMultipleIcon),
  UserAccount: asIcon(UserAccountIcon),
  UserCheck01: asIcon(UserCheck01Icon),
  UserStar01: asIcon(UserStar01Icon),
  // Security
  ShieldUser: asIcon(ShieldUserIcon),
  LockKey: asIcon(LockKeyIcon),
  Security: asIcon(SecurityIcon),
  Lock: asIcon(LockIcon),
  Key01: asIcon(Key01Icon),
  // Products / Commerce
  Package01: asIcon(Package01Icon),
  Package02: asIcon(Package02Icon),
  ShoppingBag01: asIcon(ShoppingBag01Icon),
  ShoppingCart01: asIcon(ShoppingCart01Icon),
  Store01: asIcon(Store01Icon),
  Tag01: asIcon(Tag01Icon),
  // Finance
  Wallet01: asIcon(Wallet01Icon),
  Money01: asIcon(Money01Icon),
  CreditCard: asIcon(CreditCardIcon),
  Invoice01: asIcon(Invoice01Icon),
  // Communication
  Mail01: asIcon(Mail01Icon),
  Message01: asIcon(Message01Icon),
  Notification01: asIcon(Notification01Icon),
  // Analytics / Data
  Analytics01: asIcon(Analytics01Icon),
  BarChart: asIcon(BarChartIcon),
  PieChart01: asIcon(PieChart01Icon),
  Chart01: asIcon(Chart01Icon),
  Database01: asIcon(Database01Icon),
  Table01: asIcon(Table01Icon),
  // Content
  File01: asIcon(File01Icon),
  Folder01: asIcon(Folder01Icon),
  Image01: asIcon(Image01Icon),
  Note01: asIcon(Note01Icon),
  News01: asIcon(News01Icon),
  BookOpen01: asIcon(BookOpen01Icon),
  // Navigation / UI
  Home01: asIcon(Home01Icon),
  Search01: asIcon(Search01Icon),
  Settings01: asIcon(Settings01Icon),
  Bookmark01: asIcon(Bookmark01Icon),
  Star: asIcon(StarIcon),
  // Tech / Infrastructure
  Code: asIcon(CodeIcon),
  CloudServer: asIcon(CloudServerIcon),
  ServerStack01: asIcon(ServerStack01Icon),
  Globe02: asIcon(Globe02Icon),
  Link01: asIcon(Link01Icon),
  Layers01: asIcon(Layers01Icon),
  // Time
  Calendar01: asIcon(Calendar01Icon),
  Ticket01: asIcon(Ticket01Icon),
})

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
