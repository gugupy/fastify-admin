import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ThemeToggle } from './ThemeToggle'
import { useRbac } from '../lib/rbac'
import { entityRegistry, perm } from '../lib/entityRegistry'
import type { EntityMeta } from '../types/entity'
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
import { HugeiconsIcon } from '@hugeicons/react'
import { DatabaseLightningIcon, SecurityIcon } from '@hugeicons/core-free-icons'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

const DefaultEntityIcon = <HugeiconsIcon icon={DatabaseLightningIcon} />

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
  entity: EntityMeta
  config: ReturnType<typeof entityRegistry.get>
}

function SystemFlyout({
  items,
  pathname,
}: {
  items: NavItem[]
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const [top, setTop] = useState(0)
  const triggerRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isActive = items.some(
    ({ entity }) =>
      pathname.startsWith(`/${entity.name}/`) || pathname === `/${entity.name}`,
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
          Security
        </p>
        {items.map(({ entity, config }) => {
          const active =
            pathname.startsWith(`/${entity.name}/`) ||
            pathname === `/${entity.name}`
          const Icon = config.icon
          const label = config.label ?? capitalize(entity.name)
          return (
            <Link
              key={entity.name}
              to="/$model/list"
              params={{ model: entity.name }}
              className={[
                'flex items-center gap-2 px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              ].join(' ')}
            >
              <span className="shrink-0 opacity-70">
                {Icon ? (
                  <HugeiconsIcon size={14} icon={Icon} />
                ) : (
                  DefaultEntityIcon
                )}
              </span>
              {label}
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
        aria-label="Security"
      >
        <HugeiconsIcon size={14} icon={SecurityIcon} />
      </button>
      {flyout}
    </div>
  )
}

function NavLink({
  entity,
  config,
  pathname,
  collapsed,
}: NavItem & { pathname: string; collapsed: boolean }) {
  const active =
    pathname.startsWith(`/${entity.name}/`) || pathname === `/${entity.name}`
  const Icon = config.icon
  const label = config.label ?? capitalize(entity.name)

  const linkClass = [
    'flex items-center  text-sm transition-colors',
    collapsed ? 'justify-center w-9 h-9 mx-auto' : 'gap-2 px-2 py-1.5',
    active
      ? 'bg-muted font-medium text-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
  ].join(' ')

  const inner = (
    <Link
      to="/$model/list"
      params={{ model: entity.name }}
      className={linkClass}
    >
      <span className="shrink-0 opacity-70">
        {Icon ? <HugeiconsIcon size={14} icon={Icon} /> : DefaultEntityIcon}
      </span>
      {!collapsed && label}
    </Link>
  )

  if (!collapsed) return inner

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function Sidebar() {
  const { user, can } = useRbac()
  const admin = getAdmin()
  const AppIcon = admin.icon
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [entities, setEntities] = useState<EntityMeta[]>([])
  const [systemOpen, setSystemOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    fetch('/api/entities')
      .then((r) => r.json())
      .then(setEntities)
      .catch(() => {})
  }, [])

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

  const enriched = entities.map((entity) => ({
    entity,
    config: entityRegistry.get(entity.name),
  }))

  const navItems = enriched.filter(
    ({ entity, config }) =>
      config.sidebar !== false && can(perm(config, entity.name, 'list')),
  )

  const systemItems = enriched.filter(
    ({ entity, config }) =>
      admin.securityEntities.includes(entity.name) &&
      can(perm(config, entity.name, 'list')),
  )

  // Auto-open if a system entity is currently active
  const systemActive = systemItems.some(
    ({ entity }) =>
      pathname.startsWith(`/${entity.name}/`) || pathname === `/${entity.name}`,
  )

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
              <div className="w-7 h-7 bg-foreground text-background flex items-center justify-center shrink-0">
                {AppIcon ? (
                  <HugeiconsIcon size={14} icon={AppIcon} />
                ) : (
                  <FastifyAdminIcon />
                )}
              </div>
              {!collapsed && (
                <span className="font-semibold text-sm tracking-tight truncate">
                  {admin.name}
                </span>
              )}
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
            {/* System section */}
            {systemItems.length > 0 &&
              (collapsed ? (
                <div className="mb-1">
                  <SystemFlyout items={systemItems} pathname={pathname} />
                  <div className="mx-auto my-1.5 w-6 border-t border-border" />
                </div>
              ) : (
                <Collapsible
                  open={systemOpen || systemActive}
                  onOpenChange={setSystemOpen}
                  className="my-2"
                >
                  <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium hover:text-foreground transition-colors select-none">
                    <span className="flex items-center gap-1.5 justify-around">
                      <HugeiconsIcon size={14} icon={SecurityIcon} />
                      <span>Security</span>
                    </span>
                    <ChevronIcon open={systemOpen || systemActive} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex flex-col gap-0.5 mt-0.5 ml-5">
                    {systemItems.map(({ entity, config }) => (
                      <NavLink
                        key={entity.name}
                        entity={entity}
                        config={config}
                        pathname={pathname}
                        collapsed={collapsed}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}

            {/* Main entities */}
            {navItems.length > 0 && (
              <>
                {!collapsed && (
                  <p className="px-2 mb-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium select-none">
                    Entities
                  </p>
                )}
                {navItems.map(({ entity, config }) => (
                  <NavLink
                    key={entity.name}
                    entity={entity}
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
                    'w-full flex items-center  transition-colors hover:bg-muted/50 outline-none',
                    collapsed ? 'justify-center p-1' : 'gap-2 px-1 py-1',
                  ].join(' ')}
                >
                  <Avatar className="after:rounded-none rounded-none">
                    <AvatarImage
                      className="after:rounded-none rounded-none"
                      src="https://github.com/gugupy.png"
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
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
              className="absolute top-11 -right-3 z-10 w-6 h-6  border bg-background shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
