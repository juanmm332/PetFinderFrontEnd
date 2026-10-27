"use client"

import { useState, type FormEvent } from "react"
import { LoaderCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import type { Comentario } from "@/lib/types"
import { comentarioWriteSchema, type ComentarioWriteValues } from "@/lib/validation"

export function CommentForm({
  noticeId,
  initial,
  onSubmit,
  onCancel,
  isSaving,
  submitLabel = "Publicar comentario",
}: {
  noticeId: number
  initial?: Comentario
  onSubmit: (values: ComentarioWriteValues) => Promise<void>
  onCancel?: () => void
  isSaving: boolean
  submitLabel?: string
}) {
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = comentarioWriteSchema.safeParse({
      idAviso: noticeId,
      texto: formData.get("texto"),
    })

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Revisa el comentario.")
      return
    }

    setError("")
    await onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <FieldGroup>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor={initial ? `comentario-${initial.idComentario}` : "nuevo-comentario"}>
            {initial ? "Editar comentario" : "Aportar una pista"}
          </FieldLabel>
          <Textarea
            id={initial ? `comentario-${initial.idComentario}` : "nuevo-comentario"}
            name="texto"
            rows={3}
            placeholder="Comparte información útil y respetuosa."
            defaultValue={initial?.texto ?? ""}
            required
            aria-invalid={Boolean(error)}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
      </FieldGroup>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button> : null}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" data-icon="inline-start" /> : <Send aria-hidden="true" data-icon="inline-start" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
