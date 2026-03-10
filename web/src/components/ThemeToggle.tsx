import { AdminIcon } from './AdminIcon'
import { useTheme } from '../lib/theme'
import type { AdminIconKey } from '../lib/iconRegistry'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-0.5 border p-0.5 bg-background">
      {(
        [
          { value: 'light', name: 'sun' },
          { value: 'system', name: 'system' },
          { value: 'dark', name: 'moon' },
        ] as { value: 'light' | 'system' | 'dark'; name: AdminIconKey }[]
      ).map(({ value, name }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={value}
          className={[
            'p-1 transition-colors',
            theme === value
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          <AdminIcon name={name} size={12} />
        </button>
      ))}
    </div>
  )
}
