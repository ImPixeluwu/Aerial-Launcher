import type { MouseEventHandler, PropsWithChildren } from 'react'

import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Link } from '@tanstack/react-router'
import { Copyright } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { forwardRef } from 'react'

import packageJson from '../../../package.json'

import { images } from '../../images'

import {
  repositoryReleasesURL,
  repositoryURL,
  supportURL,
} from '../../config/about/links'
import { AutomationStatusType } from '../../config/constants/automation'

import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from '../ui/tooltip'

import { useGetAutomationDataStatus } from '../../hooks/stw-operations/automation'
import { useGetTaxiServiceDataStatus } from '../../hooks/stw-operations/taxi-service'
import { useCustomizableMenuSettingsVisibility } from '../../hooks/settings'

import { useAccountListStore } from '../../state/accounts/list'

import { numberWithCommaSeparator } from '../../lib/parsers/numbers'
import { cn } from '../../lib/utils'
import { whatIsThis } from '../../lib/callbacks'

const currentClassNameHover =
  'hover:opacity-75 dark:opacity-100 dark:hover:text-white'
const activeClassName = 'opacity-75 dark:text-white'

export function SidebarMenu({
  onOpenChange,
}: {
  onOpenChange?: (open: boolean) => void
}) {
  const { t } = useTranslation(['sidebar'])

  const accounts = useAccountListStore((state) => state.accounts)
  const { status } = useGetAutomationDataStatus()
  const { status: tsStatus } = useGetTaxiServiceDataStatus()
  const { getMenuOptionVisibility } =
    useCustomizableMenuSettingsVisibility()

  const total = Object.keys(accounts).length
  const areThereAccounts = total > 0
  const totalInText = numberWithCommaSeparator(total)

  const goToPage = () => {
    onOpenChange?.(false)
  }
  const gotToPage: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault()
    window.electronAPI.openExternalURL(
      (event.currentTarget as unknown as HTMLAnchorElement).href,
    )
  }
  const goToSupportURL: MouseEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    event.preventDefault()
    window.electronAPI.openExternalURL(supportURL)
  }
  const goToRepositoryURL: MouseEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    event.preventDefault()
    window.electronAPI.openExternalURL(repositoryURL)
  }
  const goToReleasesURL: MouseEventHandler<HTMLAnchorElement> = (
    event,
  ) => {
    event.preventDefault()
    window.electronAPI.openExternalURL(repositoryReleasesURL)
  }

  return (
    <ScrollArea className="h-full max-h-[calc(100vh-var(--header-height))]">
      <div className="flex-1 pb-6">
        <nav className="grid items-start p-2 text-sm font-medium select-none lg:p-4 lg:pb-2">
          {getMenuOptionVisibility('currentAlerts') && (
            <Link
              to="/"
              className={cn(
                'pl-3 py-2 text-muted-foreground',
                currentClassNameHover,
              )}
              activeProps={{
                className: cn(activeClassName),
              }}
            >
              {t('general:go-to-current-alerts')}
            </Link>
          )}

          {getMenuOptionVisibility('stwOperations', true) && (
            <>
              <Title className="pb-0">{t('stw-operations.title')}</Title>
              <div
                className={cn(
                  'pl-3 py-2 text-muted-foreground',
                  '[&_.item>a]:flex',
                )}
              >
                <ul className="list-disc ml-5">
                  {getMenuOptionVisibility('autoKick') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/automation"
                        className={cn(currentClassNameHover)}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        <span className="flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                          {t('stw-operations.options.auto-kick')}
                          {status !== null && (
                            <span
                              className={cn(
                                'border flex font-bold items-center leading-none px-2 rounded text-[0.65rem] uppercase',
                                status === AutomationStatusType.ISSUE
                                  ? 'border-yellow-600 text-yellow-600'
                                  : 'border-green-600 text-green-600',
                              )}
                            >
                              {status === AutomationStatusType.ISSUE
                                ? t(
                                    'stw-operations.auto-kick-status.issue',
                                  )
                                : t(
                                    'stw-operations.auto-kick-status.active',
                                  )}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('taxiService') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/taxi-service"
                        className={cn(currentClassNameHover)}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        <span className="flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                          {t('stw-operations.options.taxi-service')}
                          {tsStatus !== null && (
                            <span
                              className={cn(
                                'border flex font-bold items-center leading-none px-2 rounded text-[0.65rem] uppercase',
                                tsStatus === AutomationStatusType.ISSUE
                                  ? 'border-yellow-600 text-yellow-600'
                                  : 'border-green-600 text-green-600',
                              )}
                            >
                              {tsStatus === AutomationStatusType.ISSUE
                                ? t(
                                    'stw-operations.auto-kick-status.issue',
                                  )
                                : t(
                                    'stw-operations.auto-kick-status.active',
                                  )}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('party') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/party"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('stw-operations.options.party')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('saveQuests') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/save-quests"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('stw-operations.options.save-quests')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('dailyQuests') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/daily-quests"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('stw-operations.options.daily-quests')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('homebaseName') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/homebase-name"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('stw-operations.options.homebase-name')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('inventory') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/inventory"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('stw-operations.options.inventory')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('schematics') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/schematics"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('stw-operations.options.schematics')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('xpBoosts') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/xpboosts"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('stw-operations.options.xp-boosts')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('autoPinUrns') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/urns"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('stw-operations.options.auto-pin-urns')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('autoLlamas') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/auto-llamas"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('stw-operations.options.auto-llamas')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('unlock') && (
                    <li className="item">
                      <Link
                        to="/stw-operations/unlock"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('stw-operations.options.unlock')}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}

          {getMenuOptionVisibility('accountManagement', true) && (
            <>
              <Title className="pb-0">
                {t('account-management.title')}
              </Title>
              <div
                className={cn(
                  'pl-3 py-2 text-muted-foreground',
                  '[&_.item>a]:flex',
                )}
              >
                <ul className="list-disc ml-5">
                  {getMenuOptionVisibility('vbucksInformation') && (
                    <li className="item">
                      <Link
                        to="/account-management/vbucks-information"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t(
                          'account-management.options.vbucks-information',
                        )}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('friends') && (
                    <li className="item">
                      <Link
                        to="/account-management/friends"
                        className={cn({
                          [currentClassNameHover]: areThereAccounts,
                          'cursor-not-allowed opacity-60':
                            !areThereAccounts,
                        })}
                        activeProps={{
                          className: cn({
                            [activeClassName]: areThereAccounts,
                          }),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                        disabled={!areThereAccounts}
                      >
                        {t('account-management.options.friends')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('redeemCodes') && (
                    <li className="item">
                      <Link
                        to="/account-management/redeem-codes"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('account-management.options.redeem-codes')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('devicesAuth') && (
                    <li className="item">
                      <Link
                        to="/account-management/devices-auth"
                        className={cn({
                          [currentClassNameHover]: areThereAccounts,
                          'cursor-not-allowed opacity-60':
                            !areThereAccounts,
                        })}
                        activeProps={{
                          className: cn({
                            [activeClassName]: areThereAccounts,
                          }),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                        disabled={!areThereAccounts}
                      >
                        {t('account-management.options.devices-auth')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('epicGamesSettings') && (
                    <li className="item">
                      <Link
                        to="/account-management/epic-games-settings"
                        className={cn({
                          [currentClassNameHover]: areThereAccounts,
                          'cursor-not-allowed opacity-60':
                            !areThereAccounts,
                        })}
                        activeProps={{
                          className: cn({
                            [activeClassName]: areThereAccounts,
                          }),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                        disabled={!areThereAccounts}
                      >
                        {t('account-management.options.epic-settings')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('eula') && (
                    <li className="item">
                      <Link
                        to="/account-management/eula"
                        className={cn({
                          [currentClassNameHover]: areThereAccounts,
                          'cursor-not-allowed opacity-60':
                            !areThereAccounts,
                        })}
                        activeProps={{
                          className: cn({
                            [activeClassName]: areThereAccounts,
                          }),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                        disabled={!areThereAccounts}
                      >
                        EULA
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}

          {getMenuOptionVisibility('advancedMode', true) && (
            <>
              <Title className="pb-0">{t('advanced-mode.title')}</Title>
              <div
                className={cn(
                  'pl-3 py-2 text-muted-foreground',
                  '[&_.item>a]:flex',
                )}
              >
                <ul className="list-disc ml-5">
                  {getMenuOptionVisibility('matchmakingTrack') && (
                    <li className="item">
                      <Link
                        to="/advanced-mode/matchmaking-track"
                        className={cn({
                          [currentClassNameHover]: areThereAccounts,
                          'cursor-not-allowed opacity-60':
                            !areThereAccounts,
                        })}
                        activeProps={{
                          className: cn({
                            [activeClassName]: areThereAccounts,
                          }),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                        disabled={!areThereAccounts}
                      >
                        {t('advanced-mode.options.matchmaking-track')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('worldInfo') && (
                    <li className="item">
                      <Link
                        to="/advanced-mode/world-info"
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('advanced-mode.options.world-info')}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}

          {(getMenuOptionVisibility('stwOperations', true) ||
            getMenuOptionVisibility('accountManagement', true) ||
            getMenuOptionVisibility('advancedMode', true)) && (
            <Separator className="my-2" />
          )}

          {getMenuOptionVisibility('myAccounts', true) && (
            <>
              <Title className="pb-0">
                {t('accounts.title')}
                {getMenuOptionVisibility('showTotalAccounts') &&
                totalInText !== '0'
                  ? ` (${totalInText})`
                  : ''}
              </Title>
              <div
                className={cn(
                  'pl-3 py-2 text-muted-foreground',
                  '[&_.item>a]:flex',
                )}
              >
                <ul className="list-disc ml-5">
                  {getMenuOptionVisibility('authorizationCode') && (
                    <li className="item">
                      <Link
                        to="/accounts/add/$type"
                        params={{ type: 'authorization-code' }}
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('accounts.options.auth')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('exchangeCode') && (
                    <li className="item">
                      <Link
                        to="/accounts/add/$type"
                        params={{ type: 'exchange-code' }}
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('accounts.options.exchange')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('deviceAuth') && (
                    <li className="item">
                      <Link
                        to="/accounts/add/$type"
                        params={{ type: 'device-auth' }}
                        className={currentClassNameHover}
                        activeProps={{
                          className: cn(activeClassName),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                      >
                        {t('accounts.options.device')}
                      </Link>
                    </li>
                  )}
                  {getMenuOptionVisibility('removeAccount') && (
                    <li className="item">
                      <Link
                        to="/accounts/remove"
                        className={cn({
                          [currentClassNameHover]: areThereAccounts,
                          'cursor-not-allowed opacity-60':
                            !areThereAccounts,
                        })}
                        activeProps={{
                          className: cn({
                            [activeClassName]: areThereAccounts,
                          }),
                        }}
                        onClick={goToPage}
                        onAuxClick={whatIsThis()}
                        disabled={!areThereAccounts}
                      >
                        {t('accounts.options.remove')}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}

          {getMenuOptionVisibility('myAccounts', true) && (
            <Separator className="my-2" />
          )}

          <div>
            <Button
              className={cn(
                'flex items-center gap-3 justify-center px-3 py-2 rounded-lg transition-all w-full',
                'text-muted-foreground',
                'hover:bg-muted hover:text-primary',
              )}
              size="sm"
              variant="ghost"
              onClick={gotToPage}
              onAuxClick={whatIsThis()}
              asChild
            >
              <a href="https://ko-fi.com/ciensprog">
                <img
                  src={images['ko-fi']}
                  className="flex-shrink-0 h-5"
                  alt="icon"
                />
              </a>
            </Button>
            <Button
              className={cn(
                'flex items-center gap-3 justify-start px-3 py-2 rounded-lg transition-all w-full',
                'text-muted-foreground',
                'hover:bg-muted hover:text-primary',
              )}
              size="sm"
              variant="ghost"
              onClick={gotToPage}
              onAuxClick={whatIsThis()}
              asChild
            >
              <a href="https://stw.news/">
                <img
                  src={images['aerial-stwnews']}
                  className="flex-shrink-0 -ml-0.5 size-5"
                  alt="icon"
                />
                <span className="-ml-1">STW News</span>
              </a>
            </Button>
            <Button
              className={cn(
                'flex items-center gap-3 justify-start px-3 py-2 rounded-lg transition-all w-full',
                'text-muted-foreground',
                'hover:bg-muted hover:text-primary',
              )}
              size="sm"
              variant="ghost"
              onClick={gotToPage}
              onAuxClick={whatIsThis()}
              asChild
            >
              <a href="https://discord.gg/XbGSTuXZdy">
                <img
                  src={images['aerial-ml-corp']}
                  className="flex-shrink-0 -ml-0.5 size-5"
                  alt="icon"
                />
                <span className="-ml-1">ML Corp</span>
              </a>
            </Button>
            <Button
              className={cn(
                'flex items-center gap-3 justify-start px-3 py-2 rounded-lg transition-all w-full',
                'text-muted-foreground',
                'hover:bg-muted hover:text-primary',
              )}
              size="sm"
              variant="ghost"
              onClick={goToSupportURL}
              onAuxClick={whatIsThis()}
              asChild
            >
              <a href={supportURL}>
                <GitHubLogoIcon />
                {t('links.support')}
              </a>
            </Button>
            <Button
              className={cn(
                'flex items-center gap-3 justify-start px-3 py-2 rounded-lg transition-all w-full',
                'text-muted-foreground',
                'hover:bg-muted hover:text-primary',
              )}
              size="sm"
              variant="ghost"
              onClick={goToRepositoryURL}
              onAuxClick={whatIsThis()}
              asChild
            >
              <a href={repositoryURL}>
                <GitHubLogoIcon />
                {t('links.github')}
              </a>
            </Button>
            <Button
              className={cn(
                'flex items-center gap-3 justify-start px-3 py-2 rounded-lg transition-all w-full',
                'text-muted-foreground',
                'hover:bg-muted hover:text-primary',
              )}
              size="sm"
              variant="ghost"
              onClick={goToPage}
              onAuxClick={whatIsThis()}
              asChild
            >
              <Link to="/information/credits">
                <Copyright className="size-4" />
                <span className="-m-0.5">{t('links.credits')}</span>
              </Link>
            </Button>
          </div>
        </nav>
        <div className="px-5 text-center text-xs text-muted-foreground/60 lg:pl-7">
          <p>
            {t('version.release', {
              version: packageJson.version,
            })}
          </p>
          <a
            href={repositoryReleasesURL}
            className="inline-block mt-0.5 underline hover:text-muted-foreground"
            onClick={goToReleasesURL}
            onAuxClick={whatIsThis()}
          >
            {t('version.all-releases')}
          </a>
        </div>
      </div>
    </ScrollArea>
  )
}

const Title = forwardRef<
  HTMLDivElement,
  PropsWithChildren<{ className?: string }>
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-wrap items-center px-3 py-2 rounded-lg',
        'text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})

// function OptionWithComingSoonTooltip({ text }: { text: string }) {
//   return (
//     <TooltipProvider>
//       <Tooltip
//         delayDuration={200}
//         disableHoverableContent
//       >
//         <TooltipTrigger asChild>
//           <Title>{text}</Title>
//         </TooltipTrigger>
//         <TooltipContent>
//           <p>Coming Soon!</p>
//         </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   )
// }
