import type {
  PartyActionResponse,
  PartyInfo,
  PartyMemberInfo,
} from '../../../types/party-info'

import { useEffect, useRef, useState } from 'react'
import { UpdateIcon } from '@radix-ui/react-icons'
import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { stwFeatureAvailability } from '../../../config/constants/feature-availability'
import { partyRetrySeconds } from '../../../config/constants/friends'

import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { useConfirmDialog } from '../../../components/ui/extended/confirm-dialog'
import { Label } from '../../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { Switch } from '../../../components/ui/switch'

import { useGetSelectedAccount } from '../../../hooks/accounts'

import { toast } from '../../../lib/notifications'
import { cn, parseCustomDisplayName } from '../../../lib/utils'

type PartyStatusAction = 'promote' | 'kick' | 'privacy' | 'fix-invite'

function usePartyStatus() {
  const { t } = useTranslation(['stw-operations'])
  const { selected } = useGetSelectedAccount()

  const [info, setInfo] = useState<PartyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [pendingAction, setPendingAction] =
    useState<PartyStatusAction | null>(null)
  const [memberId, setMemberId] = useState('')
  const requestId = useRef(0)
  // Changes with the account: late action results of the previous one are
  // dropped
  const generation = useRef(0)

  const loadInfo = async () => {
    if (!selected) {
      return
    }

    const current = ++requestId.current

    setIsLoading(true)

    const result = await window.electronAPI.getPartyInfo(selected)

    if (current !== requestId.current) {
      return
    }

    setInfo(result)
    setIsLoading(false)
  }

  useEffect(() => {
    requestId.current += 1
    generation.current += 1

    setInfo(null)
    setIsLoading(false)
    setPendingAction(null)
    setMemberId('')

    loadInfo()
  }, [selected?.accountId])

  // Without a party, look again every few seconds until there is one
  useEffect(() => {
    if (!selected || isLoading || !info || (info.success && info.party)) {
      setCountdown(null)

      return
    }

    let remaining = partyRetrySeconds

    setCountdown(remaining)

    const timer = setInterval(() => {
      remaining -= 1

      if (remaining > 0) {
        setCountdown(remaining)

        return
      }

      clearInterval(timer)
      setCountdown(null)
      loadInfo()
    }, 1_000)

    return () => clearInterval(timer)
  }, [info, isLoading, selected?.accountId])

  const otherMembers =
    info?.party?.members.filter(
      (member) => member.accountId !== selected?.accountId,
    ) ?? []
  const selectedMember =
    otherMembers.find((member) => member.accountId === memberId) ?? null

  const memberName = (member: Pick<PartyMemberInfo, 'displayName'>) =>
    member.displayName ?? t('party.status.player')

  const run = async (
    action: PartyStatusAction,
    request: () => Promise<PartyActionResponse>,
    successMessage: string,
  ) => {
    if (!selected || pendingAction !== null) {
      return
    }

    const current = generation.current

    setPendingAction(action)

    const response = await request()

    if (current !== generation.current) {
      return
    }

    setPendingAction(null)
    toast(
      response.success
        ? successMessage
        : t('party.status.results.error', { error: response.error }),
    )
    loadInfo()
  }

  const memberAction = (type: 'kick' | 'promote') => {
    if (!selected || !selectedMember) {
      return
    }

    run(
      type,
      () =>
        window.electronAPI.partyMemberAction(
          selected,
          type,
          selectedMember.accountId,
        ),
      t(`party.status.results.${type}`, { name: memberName(selectedMember) }),
    )

    if (type === 'kick') {
      setMemberId('')
    }
  }

  const setPrivacy = (makePrivate: boolean) => {
    if (!selected) {
      return
    }

    run(
      'privacy',
      () => window.electronAPI.partySetPrivacy(selected, makePrivate),
      t(`party.status.results.${makePrivate ? 'private' : 'public'}`),
    )
  }

  const fixInvite = () => {
    if (!selected) {
      return
    }

    run(
      'fix-invite',
      () => window.electronAPI.partyFixInvite(selected),
      t('party.status.results.fix-invite'),
    )
  }

  return {
    countdown,
    info,
    isLoading,
    memberId,
    otherMembers,
    pendingAction,
    selected,
    selectedMember,

    fixInvite,
    loadInfo,
    memberAction,
    memberName,
    setMemberId,
    setPrivacy,
  }
}

/**
 * Party of the account selected in the header, with the leader actions.
 */
export function PartyStatusCard() {
  const { t } = useTranslation(['stw-operations', 'general'])
  const { confirm, dialog } = useConfirmDialog()

  const {
    countdown,
    info,
    isLoading,
    memberId,
    otherMembers,
    pendingAction,
    selected,
    selectedMember,

    fixInvite,
    loadInfo,
    memberAction,
    memberName,
    setMemberId,
    setPrivacy,
  } = usePartyStatus()

  const party = info?.success ? info.party : null
  const isLeader = info?.isLeader === true
  const actionsDisabled = !party || !isLeader || pendingAction !== null
  const accountName = parseCustomDisplayName(selected)

  const confirmMemberAction = (type: 'kick' | 'promote') => {
    if (!selectedMember) {
      return
    }

    confirm({
      title: t(`party.status.confirm.${type}.title`),
      description: t(`party.status.confirm.${type}.description`, {
        name: memberName(selectedMember),
        account: accountName,
      }),
      confirmLabel: t(`party.status.actions.${type}`),
      cancelLabel: t('party.status.confirm.keep'),
      destructive: true,
      onConfirm: () => memberAction(type),
    })
  }

  const statusText = () => {
    if (!info) {
      return t('party.status.loading')
    }

    if (!info.success) {
      return info.errorCode?.endsWith('party_not_found')
        ? t('party.status.not-found')
        : t('party.status.error', { error: info.error })
    }

    return t('party.status.no-party')
  }

  return (
    <Card className="max-w-lg w-full">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">{t('party.status.title')}</CardTitle>
          <CardDescription>
            {selected
              ? t('party.status.description')
              : t('party.status.no-account')}
          </CardDescription>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="shrink-0"
          onClick={() => loadInfo()}
          disabled={!selected || isLoading}
          title={t('party.status.refresh')}
        >
          <UpdateIcon className={cn({ 'animate-spin': isLoading })} />
        </Button>
      </CardHeader>

      {selected && (
        <CardContent className="grid gap-4">
          {party ? (
            <div className="grid gap-2">
              <p className="text-sm">
                {t('party.status.summary', {
                  count: party.size,
                  max: party.maxSize,
                })}{' '}
                ·{' '}
                {party.isPrivate
                  ? t('party.status.private')
                  : t('party.status.public')}
              </p>
              <div className="flex flex-wrap gap-2">
                {party.members.map((member) => (
                  <span
                    key={member.accountId}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs',
                      {
                        'border-yellow-500/60': member.isLeader,
                        italic: member.displayName === null,
                      },
                    )}
                    title={member.accountId}
                  >
                    {member.isLeader && (
                      <Crown
                        className="size-3 text-yellow-500"
                        aria-label={t('party.status.leader')}
                      />
                    )}
                    {memberName(member)}
                    {member.accountId === selected.accountId && (
                      <span className="text-muted-foreground">
                        ({t('party.status.you')})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p
              className={cn('text-sm text-muted-foreground', {
                'text-red-400': info && !info.success,
              })}
              role="status"
            >
              {statusText()}
              {countdown !== null && (
                <span className="block text-xs text-muted-foreground tabular-nums">
                  {t('party.status.retry-in', { seconds: countdown })}
                </span>
              )}
            </p>
          )}

          {party && !isLeader && (
            <p className="text-xs text-muted-foreground">
              {t('party.status.leader-only')}
            </p>
          )}

          {party && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="party-status-member">
                  {t('party.status.member.label')}
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={memberId}
                    onValueChange={setMemberId}
                    disabled={actionsDisabled || otherMembers.length === 0}
                  >
                    <SelectTrigger
                      id="party-status-member"
                      className="flex-grow w-auto min-w-40"
                    >
                      <SelectValue
                        placeholder={
                          otherMembers.length === 0
                            ? t('party.status.member.empty')
                            : t('party.status.member.placeholder')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {otherMembers.map((member) => (
                        <SelectItem
                          key={member.accountId}
                          value={member.accountId}
                        >
                          {memberName(member)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ActionButton
                    isPending={pendingAction === 'promote'}
                    disabled={actionsDisabled || !selectedMember}
                    onClick={() => confirmMemberAction('promote')}
                  >
                    {t('party.status.actions.promote')}
                  </ActionButton>
                  <ActionButton
                    isPending={pendingAction === 'kick'}
                    disabled={
                      !stwFeatureAvailability.partyKick ||
                      actionsDisabled ||
                      !selectedMember
                    }
                    variant="destructive"
                    onClick={() => confirmMemberAction('kick')}
                  >
                    {t('party.status.actions.kick')}
                  </ActionButton>
                </div>
                {!stwFeatureAvailability.partyKick && (
                  <p className="text-xs text-muted-foreground">
                    {t('party.status.actions.kick')}:{' '}
                    {t('general:feature-unavailable')}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="party-status-privacy">
                  {t('party.status.actions.privacy')}
                </Label>
                <div className="flex items-center gap-2">
                  {pendingAction === 'privacy' && (
                    <UpdateIcon className="animate-spin" />
                  )}
                  <Switch
                    id="party-status-privacy"
                    checked={party.isPrivate}
                    onCheckedChange={setPrivacy}
                    disabled={actionsDisabled}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  {t('party.status.fix-invite-description')}
                </p>
                <ActionButton
                  isPending={pendingAction === 'fix-invite'}
                  disabled={actionsDisabled}
                  variant="outline"
                  onClick={fixInvite}
                >
                  {t('party.status.actions.fix-invite')}
                </ActionButton>
              </div>
            </>
          )}
        </CardContent>
      )}

      {dialog}
    </Card>
  )
}

function ActionButton({
  children,
  disabled,
  isPending,
  onClick,
  variant,
}: {
  children: string
  disabled: boolean
  isPending: boolean
  onClick: () => void
  variant?: 'destructive' | 'outline'
}) {
  return (
    <Button
      className="relative shrink-0"
      size="sm"
      variant={variant}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={cn('absolute', { hidden: !isPending })}>
        <UpdateIcon className="animate-spin" />
      </span>
      <span className={cn({ invisible: isPending })}>{children}</span>
    </Button>
  )
}
