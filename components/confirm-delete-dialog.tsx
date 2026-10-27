"use client"

import { useState } from "react"
import { LoaderCircle, Trash2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function ConfirmDeleteDialog({
  itemLabel,
  onConfirm,
  iconOnly = false,
}: {
  itemLabel: string
  onConfirm: () => Promise<boolean>
  iconOnly?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function confirm() {
    setPending(true)
    try {
      if (await onConfirm()) setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !pending && setOpen(nextOpen)}>
      <AlertDialogTrigger render={
        <Button
          type="button"
          variant="ghost"
          size={iconOnly ? "icon-sm" : "sm"}
          aria-label={`Eliminar ${itemLabel}`}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        />
      }>
        <Trash2 aria-hidden="true" data-icon="inline-start" />
        {!iconOnly ? "Eliminar" : null}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar {itemLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            El registro se eliminará lógicamente. No se borrará de forma permanente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault()
              void confirm()
            }}
            disabled={pending}
          >
            {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" aria-hidden="true" /> : <Trash2 data-icon="inline-start" aria-hidden="true" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
