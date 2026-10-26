import type { InventoryAlteration } from '../../types/inventory'

import { useState } from 'react'
import { Star, Zap } from 'lucide-react'

import { RarityType, raritiesColor } from '../../config/constants/resources'

import { compactNumber } from '../../lib/parsers/numbers'
import { assets } from '../../lib/repository'
import { cn } from '../../lib/utils'

// Perk colors as shown in game: grey, green, blue, purple, gold
export const perkColors: Record<RarityType, string> = {
  [RarityType.Common]: '#c4c4c4',
  [RarityType.Uncommon]: '#5fc314',
  [RarityType.Rare]: '#2fa3f5',
  [RarityType.Epic]: '#b45cf0',
  [RarityType.Legendary]: '#f5c242',
  [RarityType.Mythic]: '#f5c242',
}

export function rarityStyle(rarity: RarityType | null) {
  const color = raritiesColor[rarity ?? RarityType.Common]

  return {
    borderColor: color,
    background: `linear-gradient(180deg, ${color}33 0%, transparent 70%)`,
  }
}

export function formatQuantity(value: number) {
  return value >= 10_000 ? compactNumber(value) : value.toLocaleString()
}

export function ItemImage({
  className,
  iconKey,
  imageUrl,
}: {
  className?: string
  iconKey: string
  imageUrl: string | null
}) {
  const [hasError, setHasError] = useState(false)

  return (
    <img
      src={
        !hasError && imageUrl ? imageUrl : assets(iconKey) ?? assets('question')
      }
      alt=""
      className={cn('object-contain', className)}
      draggable={false}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  )
}

export function PowerBadge({
  className,
  powerLevel,
}: {
  className?: string
  powerLevel: number
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded bg-black/70 px-1 text-xs font-semibold',
        className,
      )}
    >
      <Zap className="size-3 fill-current text-yellow-400" />
      {powerLevel}
    </span>
  )
}

/**
 * Five stars: the first "tier" ones are lit and the first supercharges
 * are highlighted.
 */
export function ItemStars({
  superchargeLevel,
  tier,
}: {
  superchargeLevel: number
  tier: number | null
}) {
  const litStars = Math.min(Math.max(tier ?? 1, 1), 5)
  const supercharged = Math.min(superchargeLevel, litStars)

  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            'size-3',
            index < supercharged
              ? 'fill-current text-sky-400'
              : index < litStars
                ? 'fill-current text-yellow-400'
                : 'text-muted-foreground/40',
          )}
        />
      ))}
    </span>
  )
}

function PerkTierBars({ color, tier }: { color: string; tier: number }) {
  return (
    <span className="flex flex-col-reverse gap-[3px]">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className="h-[5px] w-3 bg-black/40"
          style={index < tier ? { backgroundColor: color } : {}}
        />
      ))}
    </span>
  )
}

export function PerkRow({ alteration }: { alteration: InventoryAlteration }) {
  const color = alteration.rarity ? perkColors[alteration.rarity] : undefined
  const elementIcon = alteration.element ? assets(alteration.element) : null
  // As in the game: tier bars on the left and the element icon next to the
  // text. Legacy element perks have no tier bars, only the icon.
  const iconAsMarker = elementIcon && alteration.legacy
  const hasMarker = alteration.tier !== null || iconAsMarker

  return (
    <li
      className="flex min-h-10 items-stretch gap-0.5"
      title={alteration.id}
    >
      {hasMarker && (
        <span className="flex w-10 shrink-0 items-center justify-center bg-secondary/80">
          {iconAsMarker ? (
            <img
              src={elementIcon}
              alt={alteration.element ?? ''}
              className="size-7 object-contain"
              draggable={false}
            />
          ) : (
            <PerkTierBars
              color={color ?? perkColors[RarityType.Common]}
              tier={alteration.tier ?? 0}
            />
          )}
        </span>
      )}
      <span className="flex flex-grow items-center gap-2 bg-secondary/50 px-2.5 py-1.5">
        {elementIcon && !iconAsMarker && (
          <img
            src={elementIcon}
            alt={alteration.element ?? ''}
            className="size-6 shrink-0 object-contain"
            draggable={false}
          />
        )}
        {alteration.name}
      </span>
    </li>
  )
}
