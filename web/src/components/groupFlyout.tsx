import type { entityRegistry } from '@/lib/entityRegistry'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '@tanstack/react-router'
import { AdminIcon } from './AdminIcon'

type FlyoutChild = {
  model: string
  label: string
  icon?: ReturnType<typeof entityRegistry.get>['icon']
}

export function GroupFlyout({
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
    ({ model }) =>
      pathname.startsWith(`/${model}/`) || pathname === `/${model}`,
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
                {Icon ? (
                  <Icon size={14} />
                ) : (
                  <AdminIcon name="entity" size={14} />
                )}
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
