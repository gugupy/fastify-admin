import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ThemeToggle } from './ThemeToggle'
import { useRbac } from '../lib/rbac'
import { entityRegistry, perm } from '../lib/entityRegistry'
import { menuRegistry } from '../lib/menuRegistry'
import type { MenuItem } from '../lib/menuRegistry'
import { FastifyAdminIcon } from './icons'
import { getAdmin } from '../lib/FastifyAdmin'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AdminIcon } from './AdminIcon'
import { Avatar, AvatarFallback } from './ui/avatar'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PanelCollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M9 3v18" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M15 9l-3 3 3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

type NavItem = {
  name: string
  config: ReturnType<typeof entityRegistry.get>
}

type FlyoutChild = {
  model: string
  label: string
  icon?: ReturnType<typeof entityRegistry.get>['icon']
}

function GroupFlyout({
  label,
  triggerIcon,
  children,
  pathname,
}: {
  label: string
  triggerIcon: React.ReactNode
  children: FlyoutChild[]
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const [top, setTop] = useState(0)
  const triggerRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isActive = children.some(
    ({ model }) => pathname.startsWith(`/${model}/`) || pathname === `/${model}`,
  )

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 100)
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  function handleMouseEnter() {
    cancelClose()
    if (triggerRef.current) {
      setTop(triggerRef.current.getBoundingClientRect().top)
    }
    setOpen(true)
  }

  const flyout =
    open &&
    createPortal(
      <div
        style={{ position: 'fixed', top, left: 56 + 8 }}
        className="z-50 min-w-44 border bg-background shadow-md py-1"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium select-none">
          {label}
        </p>
        {children.map(({ model, label: childLabel, icon: Icon }) => {
          const active =
            pathname.startsWith(`/${model}/`) || pathname === `/${model}`
          return (
            <Link
              key={model}
              to="/$model/list"
              params={{ model }}
              className={[
                'flex items-center gap-2 px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md',
              ].join(' ')}
            >
              <span className="shrink-0 opacity-70">
                {Icon ? <Icon size={14} /> : <AdminIcon name="entity" size={14} />}
              </span>
              {childLabel}
            </Link>
          )
        })}
      </div>,
      document.body,
    )

  return (
    <div
      ref={triggerRef}
      className="flex justify-center mb-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={scheduleClose}
    >
      <button
        className={[
          'w-9 h-9 flex items-center justify-center transition-colors',
          isActive
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        ].join(' ')}
        aria-label={label}
      >
        {triggerIcon}
      </button>
      {flyout}
    </div>
  )
}

function NavLink({
  name,
  config,
  pathname,
  collapsed,
}: NavItem & { pathname: string; collapsed: boolean }) {
  const active = pathname.startsWith(`/${name}/`) || pathname === `/${name}`
  const Icon = config.icon
  const label = config.label ?? capitalize(name)

  const linkClass = [
    'flex items-center  text-sm transition-colors',
    collapsed ? 'justify-center w-9 h-9 mx-auto' : 'gap-2 px-2 py-1.5',
    active
      ? 'bg-muted font-medium text-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
  ].join(' ')

  const inner = (
    <Link to="/$model/list" params={{ model: name }} className={linkClass}>
      <span className="shrink-0 opacity-70">
        {Icon ? <Icon size={14} /> : <AdminIcon name="entity" size={14} />}
      </span>
      {!collapsed && label}
    </Link>
  )

  if (!collapsed) return inner

  return (
    <div className="mb-1">
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
      <div className="mx-auto my-1.5 w-6 border-t border-border" />
    </div>
  )
}

function MenuGroup({
  item,
  children,
  pathname,
  collapsed,
}: {
  item: MenuItem
  children: MenuItem[]
  pathname: string
  collapsed: boolean
}) {
  const groupActive = children.some((child) => {
    const m = child.entity ?? child.name
    return pathname.startsWith(`/${m}/`) || pathname === `/${m}`
  })
  const [open, setOpen] = useState(groupActive)

  // Re-open automatically when navigating into a child route.
  useEffect(() => {
    if (groupActive) setOpen(true)
  }, [groupActive])

  const Icon = item.iconComponent
  const groupLabel = item.label ?? capitalize(item.name)

  if (collapsed) {
    return (
      <div className="mb-1">
        <GroupFlyout
          label={groupLabel}
          triggerIcon={Icon ? <Icon size={14} /> : <AdminIcon name="entity" size={14} />}
          children={children.map((child) => {
            const model = child.entity ?? child.name
            return { model, label: child.label ?? capitalize(model), icon: child.iconComponent }
          })}
          pathname={pathname}
        />
        <div className="mx-auto my-1.5 w-6 border-t border-border" />
      </div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="my-1">
      <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium hover:text-foreground transition-colors select-none">
        <span className="flex items-center gap-1.5">
          {Icon ? <Icon size={14} /> : <AdminIcon name="entity" size={14} />}
          {item.label ?? capitalize(item.name)}
        </span>
        <ChevronIcon open={open} />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-0.5 mt-0.5 ml-5">
        {children.map((child) => (
          <MenuNavLink
            key={child.name}
            item={child}
            pathname={pathname}
            collapsed={collapsed}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

function MenuNavLink({
  item,
  pathname,
  collapsed,
}: {
  item: MenuItem
  pathname: string
  collapsed: boolean
}) {
  const model = item.entity ?? item.name
  const active = pathname.startsWith(`/${model}/`) || pathname === `/${model}`
  const Icon = item.iconComponent
  const label = item.label ?? capitalize(model)

  const linkClass = [
    'flex items-center text-sm transition-colors',
    collapsed ? 'justify-center w-9 h-9 mx-auto' : 'gap-2 px-2 py-1.5',
    active
      ? 'bg-muted font-medium text-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
  ].join(' ')

  const inner = (
    <Link to="/$model/list" params={{ model }} className={linkClass}>
      <span className="shrink-0 opacity-70">
        {Icon ? <Icon size={14} /> : <AdminIcon name="entity" size={14} />}
      </span>
      {!collapsed && label}
    </Link>
  )

  if (!collapsed) return inner

  return (
    <div className="mb-1">
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
      <div className="mx-auto my-1.5 w-6 border-t border-border" />
    </div>
  )
}

export function Sidebar() {
  const { user, can } = useRbac()
  const admin = getAdmin()
  const AppIcon = admin.icon
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [systemOpen, setSystemOpen] = useState(false)
  // Capture menu items once at mount — populated by FastifyAdmin.initFromApi before render.
  const [registeredMenu] = useState(() => menuRegistry.getAll())
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem('sidebar-collapsed', String(next))
      } catch {
        /* */
      }
      return next
    })
  }

  //
  const initials = (() => {
    const name = user?.fullName?.trim()
    if (!name) return '?'
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      const first = parts[0].charAt(0) || ''
      const second = parts[1].charAt(0) || ''
      const combined = (first + second).toUpperCase()
      return combined || '?'
    }
    return name.slice(0, 2).toUpperCase()
  })()

  // Entity names + configs come from the registry (populated by initFromApi before render).
  const allItems: NavItem[] = entityRegistry
    .names()
    .map((name) => ({ name, config: entityRegistry.get(name) }))

  const navItems = allItems.filter(
    ({ name, config }) =>
      config.sidebar !== false &&
      ((p) => p !== false && can(p))(perm(config, name, 'list')),
  )

  const systemItems = allItems.filter(
    ({ name, config }) =>
      admin.securityEntities.includes(name) &&
      ((p) => p !== false && can(p))(perm(config, name, 'list')),
  )

  // Auto-open when navigating into a security entity route; stays open until manually closed.
  const systemActive = systemItems.some(
    ({ name }) => pathname.startsWith(`/${name}/`) || pathname === `/${name}`,
  )

  useEffect(() => {
    if (systemActive) setSystemOpen(true)
  }, [systemActive])

  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative shrink-0">
        <aside
          className={[
            'flex flex-col h-screen border-r bg-background transition-[width] duration-200 overflow-hidden',
            collapsed ? 'w-14' : 'w-56',
          ].join(' ')}
        >
          {/* Logo */}
          <div className="px-3 py-3.5 border-b flex items-center gap-2.5 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-foreground min-w-0"
            >
              <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center shrink-0">
                {AppIcon ? <AppIcon size={14} /> : <FastifyAdminIcon />}
              </div>
              {!collapsed && (
                <span className="font-semibold text-sm tracking-tight truncate">
                  {admin.name}
                </span>
              )}
            </Link>
          </div>

          {/* Nav */}
          <nav className={['flex-1 overflow-y-auto py-3 flex flex-col', collapsed ? 'px-0 gap-1' : 'px-2 gap-0.5'].join(' ')}>
            {/* ── System (security) items — always rendered first ────────── */}
            {systemItems.length > 0 &&
              (collapsed ? (
                <div className="mb-1">
                  <GroupFlyout
                    label="Security"
                    triggerIcon={<AdminIcon name="security" size={14} />}
                    children={systemItems.map(({ name, config }) => ({
                      model: name,
                      label: config.label ?? capitalize(name),
                      icon: config.icon,
                    }))}
                    pathname={pathname}
                  />
                  <div className="mx-auto my-1.5 w-6 border-t border-border" />
                </div>
              ) : (
                <Collapsible
                  open={systemOpen}
                  onOpenChange={setSystemOpen}
                  className="my-2"
                >
                  <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium hover:text-foreground transition-colors select-none">
                    <span className="flex items-center gap-1.5 justify-around">
                      <AdminIcon name="security" size={14} />
                      <span>Security</span>
                    </span>
                    <ChevronIcon open={systemOpen} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex flex-col gap-0.5 mt-0.5 ml-5">
                    {systemItems.map(({ name, config }) => (
                      <NavLink
                        key={name}
                        name={name}
                        config={config}
                        pathname={pathname}
                        collapsed={collapsed}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}

            {/* ── Registered menu or auto-detected entities ─────────────── */}
            {registeredMenu.length > 0
              ? // Registered menu: only items explicitly configured server-side.
                // Security items are excluded here — they are already shown above.
                registeredMenu
                  .filter(
                    (i) =>
                      !i.parent &&
                      !admin.securityEntities.includes(i.entity ?? '') &&
                      i.name !== 'security',
                  )
                  .map((item) => {
                    const children = registeredMenu.filter(
                      (i) =>
                        i.parent === item.name &&
                        !admin.securityEntities.includes(i.entity ?? ''),
                    )
                    if (children.length > 0) {
                      return (
                        <MenuGroup
                          key={item.name}
                          item={item}
                          children={children}
                          pathname={pathname}
                          collapsed={collapsed}
                        />
                      )
                    }
                    return (
                      <MenuNavLink
                        key={item.name}
                        item={item}
                        pathname={pathname}
                        collapsed={collapsed}
                      />
                    )
                  })
              : // Auto-detect: show all non-security entities.
                navItems.length > 0 && (
                  <>
                    {!collapsed && (
                      <p className="px-2 mb-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium select-none">
                        Entities
                      </p>
                    )}
                    {navItems.map(({ name, config }) => (
                      <NavLink
                        key={name}
                        name={name}
                        config={config}
                        pathname={pathname}
                        collapsed={collapsed}
                      />
                    ))}
                  </>
                )}
          </nav>

          {/* User profile */}
          <div className="border-t px-2 py-3 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={[
                    'w-full flex items-center  transition-colors hover:bg-muted/50 outline-none rounded-md',
                    collapsed ? 'justify-center p-1' : 'gap-2 px-1 py-1',
                  ].join(' ')}
                >
                  <Avatar className="rounded-md after:rounded-md">
                    <AvatarFallback className="rounded-md">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {!collapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium truncate leading-tight">
                        {user?.fullName}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {user?.email}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align={collapsed ? 'center' : 'start'}
                className="w-48 mb-1 ml-5"
              >
                <div className="py-3">
                  <span className="block px-2 text-sm">{user?.fullName}</span>
                  <span className="block px-2 text-xs text-muted-foreground font-normal truncate">
                    {user?.email}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
                  Profile &amp; settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-xs">Theme</span>
                  <ThemeToggle />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => navigate({ to: '/logout' })}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Floating collapse toggle — sits on the sidebar's right border, level with the header */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="absolute rounded-md top-11 -right-3 z-10 w-6 h-6  border bg-background shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <PanelCollapseIcon collapsed={collapsed} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
