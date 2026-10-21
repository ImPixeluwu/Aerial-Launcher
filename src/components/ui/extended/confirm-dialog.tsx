import type { ReactNode } from 'react'

import { useState } from 'react'

import { Button } from '../button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../dialog'

export type ConfirmRequest = {
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  onConfirm: () => void
}

/**
 * Asks before running an action that changes the account. Keep one per page
 * and open it with `confirm(request)`.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)

  const dialog = (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) {
          setRequest(null)
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{request?.title}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">{request?.description}</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setRequest(null)}
          >
            {request?.cancelLabel}
          </Button>
          <Button
            variant={request?.destructive ? 'destructive' : 'default'}
            onClick={() => {
              request?.onConfirm()
              setRequest(null)
            }}
          >
            {request?.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return { confirm: setRequest, dialog }
}
