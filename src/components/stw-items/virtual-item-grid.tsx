import type { ReactNode } from 'react'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { cn } from '../../lib/utils'

// Cards are 7.5rem wide at least, with a 0.75rem gap
const cardMinWidth = 120
const gridGap = 12

/**
 * Card grid that only renders the visible rows: accounts can have
 * thousands of items. Every card has the same fixed height and the page
 * scrolls in the main layout viewport.
 */
export function VirtualItemGrid<Item>({
  cardHeight,
  isStale,
  items,
  selectedIndex,
  getKey,
  renderItem,
}: {
  cardHeight: number
  isStale: boolean
  items: Array<Item>
  selectedIndex: number
  getKey: (item: Item) => string
  renderItem: (item: Item) => ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [scrollMargin, setScrollMargin] = useState(0)
  const [scrollElement] = useState(() =>
    document.querySelector<HTMLElement>('.main-wrapper-content'),
  )

  const columns = Math.max(
    1,
    Math.floor((width + gridGap) / (cardMinWidth + gridGap)),
  )
  const virtualizer = useVirtualizer({
    count: Math.ceil(items.length / columns),
    getScrollElement: () => scrollElement,
    estimateSize: () => cardHeight + gridGap,
    overscan: 4,
    scrollMargin,
  })

  useLayoutEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )

    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  // The filters above the grid change height as they wrap
  useLayoutEffect(() => {
    const offsetTop = containerRef.current?.offsetTop ?? 0

    if (offsetTop !== scrollMargin) {
      setScrollMargin(offsetTop)
    }
  })

  // A new list (filters, order, profile) starts at the top
  useEffect(() => {
    if (scrollElement && scrollElement.scrollTop > scrollMargin) {
      scrollElement.scrollTop = scrollMargin
    }
  }, [items])

  // Keep the item open in the details in view
  useEffect(() => {
    if (selectedIndex >= 0) {
      virtualizer.scrollToIndex(Math.floor(selectedIndex / columns))
    }
  }, [selectedIndex])

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full transition-opacity', {
        'opacity-60': isStale,
      })}
      style={{ height: virtualizer.getTotalSize() - gridGap }}
    >
      {virtualizer.getVirtualItems().map((row) => (
        <div
          key={row.key}
          className="absolute left-0 top-0 grid w-full gap-3"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            height: cardHeight,
            transform: `translateY(${row.start - scrollMargin}px)`,
          }}
        >
          {items
            .slice(row.index * columns, (row.index + 1) * columns)
            .map((item) => (
              <div
                key={getKey(item)}
                className="min-w-0"
              >
                {renderItem(item)}
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
