import type { ReactNode } from 'react'

export function FilterLabel({ children }: { children: ReactNode }) {
  return <span className="text-sm text-muted-foreground">{children}</span>
}

export function FilterCount({ value }: { value?: number }) {
  return (
    <span className="ml-1 tabular-nums text-muted-foreground">
      {value ?? 0}
    </span>
  )
}
