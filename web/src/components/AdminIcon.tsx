import { createElement } from 'react'
import { iconRegistry, type AdminIconKey } from '../lib/iconRegistry'

type AdminIconProps = {
  name: AdminIconKey
  size?: number
  className?: string
}

/**
 * Renders a named icon from the icon registry.
 * Override any icon globally via `iconRegistry.override({ ... })`.
 *
 * @example
 * <AdminIcon name="delete" size={14} />
 * <AdminIcon name="entity" size={16} className="opacity-70" />
 */
export function AdminIcon({ name, size, className }: AdminIconProps) {
  return createElement(iconRegistry.get(name), { size, className })
}
