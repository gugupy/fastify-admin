import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { EntityTable } from '../../components/EntityTable'
import { entityRegistry, perm } from '../../lib/entityRegistry'
import { useRbac } from '../../lib/rbac'
import type { EntityMeta } from '../../types/entity'

const DEFAULT_PAGE_SIZE = 20

export const Route = createFileRoute('/$model/list')({
  loader: async ({ params }) => {
    const config = entityRegistry.get(params.model)
    const pageSize = config.list?.pageSize ?? DEFAULT_PAGE_SIZE
    const [entitiesRes, recordsRes] = await Promise.all([
      fetch('/api/entities'),
      fetch(`/api/${params.model}?page=1&limit=${pageSize}`),
    ])
    const entities: EntityMeta[] = await entitiesRes.json()
    const paginated: { data: Record<string, unknown>[]; total: number } =
      await recordsRes.json()
    const entity = entities.find((e) => e.name === params.model)
    return { entity, records: paginated.data, total: paginated.total, pageSize }
  },
  component: ListComponent,
})

function PaginationBar({
  page,
  totalPages,
  currentTotal,
  goToPage,
}: {
  page: number
  totalPages: number
  currentTotal: number
  goToPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Page {page} of {totalPages} — {currentTotal} total
      </span>
      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
            )
            .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis')
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === 'ellipsis' ? (
                <PaginationItem key={`e-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => p !== page && goToPage(p)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
          <PaginationItem>
            <PaginationNext
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function ListComponent() {
  const { model } = Route.useParams()
  const { entity, records, total, pageSize } = Route.useLoaderData()
  const config = entityRegistry.get(model)

  if (!entity) {
    return <div className="p-6 text-destructive">Entity "{model}" not found.</div>
  }

  if (config.list?.component) {
    const Custom = config.list.component
    return <Custom model={model} entity={entity} records={records} />
  }

  return (
    <DefaultList
      model={model}
      entity={entity}
      records={records}
      total={total}
      pageSize={pageSize}
      config={config}
    />
  )
}

function DefaultList({
  model,
  entity,
  records,
  total,
  pageSize,
  config,
}: {
  model: string
  entity: EntityMeta
  records: Record<string, unknown>[]
  total: number
  pageSize: number
  config: ReturnType<typeof entityRegistry.get>
}) {
  const { can } = useRbac()
  const [page, setPage] = useState(1)
  const [currentRecords, setCurrentRecords] = useState(records)
  const [currentTotal, setCurrentTotal] = useState(total)

  const permCreate = perm(config, model, 'create')
  const canCreate = permCreate !== false && can(permCreate)
  const totalPages = Math.ceil(currentTotal / pageSize)

  useEffect(() => {
    setCurrentRecords(records)
    setCurrentTotal(total)
    setPage(1)
  }, [records, total])

  async function goToPage(p: number) {
    const res = await fetch(`/api/${model}?page=${p}&limit=${pageSize}`)
    const paginated: { data: Record<string, unknown>[]; total: number } =
      await res.json()
    setCurrentRecords(paginated.data)
    setCurrentTotal(paginated.total)
    setPage(p)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-semibold capitalize">{model}</h1>
          <span className="text-sm text-muted-foreground">{currentTotal}</span>
        </div>
        {canCreate && (
          <Link to="/$model/$id/edit" params={{ model, id: 'new' }}>
            <button className="px-4 py-2 bg-foreground text-background text-sm">
              New
            </button>
          </Link>
        )}
      </div>

      <div className="mb-4">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          currentTotal={currentTotal}
          goToPage={goToPage}
        />
      </div>

      <EntityTable
        model={model}
        entity={entity}
        records={currentRecords}
        config={config}
        onDeleted={() => goToPage(page)}
      />

      <div className="mt-4">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          currentTotal={currentTotal}
          goToPage={goToPage}
        />
      </div>
    </div>
  )
}
