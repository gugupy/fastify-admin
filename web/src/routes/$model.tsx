import {
  createFileRoute,
  notFound,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { can, permissionsLoaded } from '../lib/rbac'
import { entityRegistry, perm, ALL_OPERATIONS } from '../lib/entityRegistry'

export const Route = createFileRoute('/$model')({
  beforeLoad: ({ location, params }) => {
    const { model } = params

    // redirect bare /$model → /$model/list
    if (location.pathname === `/${model}`) {
      throw redirect({ to: '/$model/list', params: { model } })
    }

    // entity not registered → 404
    if (!entityRegistry.has(model)) {
      throw notFound()
    }

    // derive which action is being accessed
    const path = location.pathname
    const config = entityRegistry.get(model)

    const isEdit = path.endsWith('/edit')
    const isNew = path.endsWith('/new/edit')
    const isShow = path.endsWith('/show')
    const isList = path.endsWith('/list')

    const action = isList
      ? 'list'
      : isShow
        ? 'show'
        : isNew
          ? 'create'
          : isEdit
            ? 'edit'
            : 'list'

    // block operations disabled in EntityAdmin config
    const ops = new Set(config.operations ?? ALL_OPERATIONS)
    if (!ops.has(action)) {
      throw redirect({ to: '/' })
    }

    // wait for RbacProvider to finish — router.invalidate() will re-run this
    if (!permissionsLoaded()) return

    if (!can(perm(config, model, action))) {
      throw redirect({ to: '/' })
    }
  },
  component: () => <Outlet />,
})
