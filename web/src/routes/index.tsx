import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useRbac } from '../lib/rbac'
import { entityRegistry, perm } from '../lib/entityRegistry'
import { getAdmin } from '../lib/FastifyAdmin'
import type { EntityCount } from '../types/entity'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function StatCard({ name, count }: EntityCount) {
  const config = entityRegistry.get(name)
  const label = config.label ?? capitalize(name)
  const Icon = config.icon

  return (
    <Link
      to="/$model/list"
      params={{ model: name }}
      className="group flex flex-col gap-3 rounded-lg border bg-background p-5 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <span className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold tracking-tight">
        {count.toLocaleString()}
      </p>
    </Link>
  )
}

export default function DashboardPage() {
  const { user, can } = useRbac()
  const [counts, setCounts] = useState<EntityCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data: EntityCount[]) => {
        setCounts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const visibleCounts = counts.filter(({ name }) => {
    if (getAdmin().securityEntities.includes(name)) return false
    const config = entityRegistry.get(name)
    const p = perm(config, name, 'list')
    return p !== false && can(p)
  })

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'there'

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here's an overview of your data.
        </p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : visibleCounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entities registered.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleCounts.map((item) => (
            <StatCard key={item.name} {...item} />
          ))}
        </div>
      )}
    </div>
  )
}
