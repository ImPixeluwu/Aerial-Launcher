import type { ReactNode } from 'react'
import type {
  InventoryAlteration,
  InventoryItemStats,
} from '../../types/inventory'
import type { RarityType } from '../../config/constants/resources'

import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'

import { ItemImage, PerkRow, PowerBadge, rarityStyle } from './item-parts'

/**
 * What the item detail dialog shows, shared by the inventory viewer and
 * the schematics catalog.
 */
export type StwItemDetail = {
  key: string
  name: string
  iconKey: string
  imageUrl: string | null
  rarity: RarityType | null
  labels: Array<string>
  powerLevel: number | null
  stars: ReactNode
  levelText: string | null
  level: number | null
  stats: InventoryItemStats | null
  alterations: Array<InventoryAlteration>
  showNoPerks: boolean
  description: string | null
  rows: Array<[string, ReactNode]>
}

function formatStat(key: keyof InventoryItemStats, value: number) {
  switch (key) {
    case 'critChance':
    case 'critDamage':
      return `${Math.round(value * 1000) / 10}%`
    case 'attackTime':
    case 'fireDelay':
    case 'reloadTime':
      return `${value.toFixed(2)} s`
    case 'fireRate':
      return value.toFixed(2)
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
  }
}

const statOrder: Array<keyof InventoryItemStats> = [
  'damage',
  'critChance',
  'critDamage',
  'attackTime',
  'fireRate',
  'fireDelay',
  'clipSize',
  'reloadTime',
  'ammoCost',
  'durability',
  'impact',
]

export function ItemDetailDialog({
  detail,
  position,
  onClose,
  onNext,
  onPrevious,
}: {
  detail: StwItemDetail | null
  position: { index: number; total: number } | null
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}) {
  const { t } = useTranslation(['stw-operations'])
  const hasPrevious = position !== null && position.index > 0
  const hasNext = position !== null && position.index < position.total - 1

  useEffect(() => {
    if (!detail) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && hasPrevious) {
        event.preventDefault()
        onPrevious()
      } else if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault()
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [detail, hasPrevious, hasNext, onPrevious, onNext])

  const stats = detail?.stats
    ? statOrder.flatMap((key) => {
        const value = detail.stats?.[key]

        return typeof value === 'number' ? [[key, value] as const] : []
      })
    : []

  return (
    <Dialog
      open={detail !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent
        className="max-w-3xl gap-0 overflow-hidden p-0"
        hideCloseButton
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {position && (
          <div className="absolute left-2 top-2 z-10 flex items-center gap-1 text-sm text-muted-foreground">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              onClick={onPrevious}
              disabled={!hasPrevious}
              aria-label={t('inventory.previous')}
              title={t('inventory.previous')}
            >
              <ChevronLeft className="size-6" />
            </button>
            <span className="min-w-14 text-center tabular-nums">
              {position.index + 1} / {position.total}
            </span>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              onClick={onNext}
              disabled={!hasNext}
              aria-label={t('inventory.next')}
              title={t('inventory.next')}
            >
              <ChevronRight className="size-6" />
            </button>
          </div>
        )}
        <DialogClose
          className="absolute right-2 top-2 z-10 flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('inventory.close')}
        >
          <X className="size-6" />
        </DialogClose>
        {detail && (
          <ScrollArea viewportClassName="max-h-[90vh]">
            <div className="grid gap-4 p-6 pt-14">
              <DialogHeader
                className="rounded-md border-2 p-3"
                style={rarityStyle(detail.rarity)}
              >
                <div className="flex gap-4">
                  <ItemImage
                    key={detail.key}
                    iconKey={detail.iconKey}
                    imageUrl={detail.imageUrl}
                    className="size-24 shrink-0"
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <DialogDescription>
                      {detail.labels.join(' | ')}
                    </DialogDescription>
                    <DialogTitle className="text-xl">{detail.name}</DialogTitle>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {detail.powerLevel !== null && (
                        <PowerBadge
                          powerLevel={detail.powerLevel}
                          className="text-sm"
                        />
                      )}
                      {detail.stars}
                      {detail.levelText !== null && (
                        <span>{detail.levelText}</span>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-4">
                  {stats.length > 0 && (
                    <section className="text-sm">
                      <h3 className="mb-2 font-semibold">
                        {t('inventory.stats-title', {
                          level: detail.level ?? 1,
                        })}
                      </h3>
                      <dl className="divide-y rounded-md border">
                        {stats.map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between px-3 py-1.5"
                          >
                            <dt className="text-muted-foreground">
                              {t(`inventory.stat.${key}`)}
                            </dt>
                            <dd className="font-semibold">
                              {formatStat(key, value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      {stats.some(([key]) => key === 'damage') && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {t('inventory.stats-note')}
                        </p>
                      )}
                    </section>
                  )}

                  <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
                    {detail.rows.map(([label, value]) => (
                      <div
                        key={label}
                        className="contents"
                      >
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="break-all">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="flex flex-col gap-4">
                  {detail.alterations.length > 0 ? (
                    <section className="text-sm">
                      <h3 className="mb-2 font-semibold">
                        {t('inventory.alterations')}
                      </h3>
                      <ul className="flex flex-col gap-1 overflow-hidden rounded-md">
                        {detail.alterations.map((alteration, index) => (
                          <PerkRow
                            key={`${alteration.id}-${index}`}
                            alteration={alteration}
                          />
                        ))}
                      </ul>
                    </section>
                  ) : (
                    detail.showNoPerks && (
                      <p className="text-sm text-muted-foreground">
                        {t('inventory.no-perks')}
                      </p>
                    )
                  )}

                  {detail.description && (
                    <p className="text-sm italic text-muted-foreground">
                      {detail.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
