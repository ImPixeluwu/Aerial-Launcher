import type { HomebaseZone, HomebaseZoneId } from '../../../types/homebase'

import { UpdateIcon } from '@radix-ui/react-icons'
import { createRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import {
  zoneColors,
  zoneLetters,
} from '../../../config/constants/fortnite/world-info'
import {
  homebaseMaxEnduranceWave,
  homebaseMaxLevel,
  homebaseZoneIds,
  homebaseZoneWorld,
} from '../../../config/constants/homebase'

import { Route as RootRoute } from '../../__root'

import { HomeBreadcrumb } from '../../../components/navigations/breadcrumb/home'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/ui/breadcrumb'
import { Button } from '../../../components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'

import { useHomebaseData } from './-hooks'

import { cn } from '../../../lib/utils'

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/stw-operations/homebase',
  component: () => {
    const { t } = useTranslation(['sidebar'])

    return (
      <>
        <Breadcrumb>
          <BreadcrumbList>
            <HomeBreadcrumb />
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('stw-operations.title')}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {t('stw-operations.options.homebase')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Content />
      </>
    )
  },
})

function Content() {
  const { t } = useTranslation(['stw-operations', 'zones'])

  const { isLoading, overview, selected, zone, zoneId, loadOverview, setZoneId } =
    useHomebaseData()

  if (!selected) {
    return (
      <div className="flex flex-grow items-center justify-center text-muted-foreground">
        {t('homebase.no-account')}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-grow gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={zoneId}
          onValueChange={(value) => setZoneId(value as HomebaseZoneId)}
        >
          <TabsList>
            {homebaseZoneIds.map((id) => {
              const world = homebaseZoneWorld[id]
              const unlocked =
                overview?.zones.find((item) => item.zoneId === id)?.unlocked ??
                false

              return (
                <TabsTrigger
                  key={id}
                  value={id}
                  className={cn('gap-2', {
                    'opacity-50': overview?.success && !unlocked,
                  })}
                >
                  <ZoneLetter
                    color={zoneColors[world]}
                    letter={zoneLetters[world]}
                  />
                  {t(world, { ns: 'zones' })}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
        <Button
          size="icon"
          variant="outline"
          onClick={loadOverview}
          disabled={isLoading}
          title={t('homebase.reload')}
        >
          <UpdateIcon className={cn({ 'animate-spin': isLoading })} />
        </Button>
      </div>

      {overview && !overview.success ? (
        <div className="border-l-4 border-red-400 ml-2 pl-2 text-red-400">
          {t('homebase.load-failed')}: {overview.error}
        </div>
      ) : !overview || !zone ? (
        <div className="flex flex-grow items-center justify-center">
          <UpdateIcon className="animate-spin size-6" />
        </div>
      ) : (
        <ZonePanel
          zone={zone}
          className={cn({ 'opacity-60': isLoading })}
        />
      )}
    </div>
  )
}

function ZonePanel({
  className,
  zone,
}: {
  className?: string
  zone: HomebaseZone
}) {
  const { t } = useTranslation(['stw-operations', 'zones'])
  const world = homebaseZoneWorld[zone.zoneId]

  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-md border p-4 max-w-2xl',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <ZoneLetter
          color={zoneColors[world]}
          letter={zoneLetters[world]}
          className="size-8 text-base"
        />
        <div>
          <h2 className="text-lg font-semibold leading-tight">
            {t(world, { ns: 'zones' })}
          </h2>
          <span className="text-xs text-muted-foreground">{zone.zoneId}</span>
        </div>
      </div>

      {!zone.unlocked ? (
        <p className="text-muted-foreground">{t('homebase.locked')}</p>
      ) : (
        <>
          <Meter
            label={t('homebase.storm-shield-level')}
            value={zone.level}
            max={homebaseMaxLevel}
          />
          <Meter
            label={t('homebase.endurance-wave')}
            value={zone.highestEnduranceWave}
            max={homebaseMaxEnduranceWave}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {t('homebase.amplifiers')}
            </span>
            <span className="font-semibold">{zone.amplifierCount}</span>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">
              {t('homebase.edit-permissions', {
                count: zone.editPermissions.length,
              })}
            </h3>
            {zone.editPermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('homebase.no-edit-permissions')}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {zone.editPermissions.map((permission) => (
                  <li
                    key={permission.accountId}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 rounded bg-muted/50 px-2 py-1"
                  >
                    <span
                      className={cn('text-sm', {
                        'text-muted-foreground italic':
                          !permission.displayName,
                      })}
                    >
                      {permission.displayName ?? t('homebase.unknown-account')}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground select-text">
                      {permission.accountId}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Meter({
  label,
  max,
  value,
}: {
  label: string
  max: number
  value: number | null
}) {
  const filled = Math.min(Math.max(value ?? 0, 0), max)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-semibold">
          {value ?? '—'} / {max}
        </span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, index) => (
          <span
            key={index}
            className={cn('h-2.5 flex-1 rounded-sm', {
              'bg-primary': index < filled,
              'bg-muted': index >= filled,
            })}
          />
        ))}
      </div>
    </div>
  )
}

function ZoneLetter({
  className,
  color,
  letter,
}: {
  className?: string
  color?: string
  letter?: string
}) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded text-xs font-bold text-white',
        className
      )}
      style={{ backgroundColor: color }}
    >
      {letter}
    </span>
  )
}
