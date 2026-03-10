import {
  createFileRoute,
  notFound,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { can, permissionsLoaded } from '../lib/rbac'
import { entityRegistry, perm } from '../lib/entityRegistry'

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

    const p = perm(config, model, action)

    // operation disabled entirely
    if (p === false) {
      throw redirect({ to: '/' })
    }

    // wait for RbacProvider to finish — router.invalidate() will re-run this
    if (!permissionsLoaded()) return

    if (!can(p)) {
      throw redirect({ to: '/' })
    }
  },
  component: () => <Outlet />,
})
