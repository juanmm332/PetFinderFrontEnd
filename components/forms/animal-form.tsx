"use client"

import { useState, type FormEvent } from "react"
import { LoaderCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PetPhoto } from "@/components/pet-photo"
import type { Animal } from "@/lib/types"
import { animalWriteSchema, type AnimalWriteValues } from "@/lib/validation"

export function AnimalForm({
  initial,
  onSubmit,
  onCancel,
  isSaving,
  submitLabel,
}: {
  initial?: Animal
  onSubmit: (values: AnimalWriteValues) => Promise<void>
  onCancel: () => void
  isSaving: boolean
  submitLabel: string
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photo, setPhoto] = useState(initial?.foto ?? "")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = animalWriteSchema.safeParse({
      nombre: formData.get("nombre"),
      foto: formData.get("foto"),
      comentario: formData.get("comentario") ?? "",
    })

    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      return
    }

    setErrors({})
    await onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.nombre)}>
          <FieldLabel htmlFor="animal-nombre">Nombre</FieldLabel>
          <Input
            id="animal-nombre"
            name="nombre"
            autoComplete="off"
            placeholder="Ej. Luna"
            defaultValue={initial?.nombre ?? ""}
            required
            aria-invalid={Boolean(errors.nombre)}
          />
          {errors.nombre ? <FieldError>{errors.nombre}</FieldError> : null}
        </Field>

        <Field data-invalid={Boolean(errors.foto)}>
          <FieldLabel htmlFor="animal-foto">Foto (URL)</FieldLabel>
          <Input
            id="animal-foto"
            name="foto"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://..."
            defaultValue={initial?.foto ?? ""}
            onChange={(event) => setPhoto(event.currentTarget.value)}
            required
            aria-invalid={Boolean(errors.foto)}
          />
          <FieldDescription>Usa una dirección de imagen http o https. Si una foto deja de estar disponible, se mostrará un icono de mascota.</FieldDescription>
          {errors.foto ? <FieldError>{errors.foto}</FieldError> : null}
          {photo.trim() ? (
            <PetPhoto src={photo} alt="Vista previa de la foto de la mascota" className="mt-2 aspect-[4/3] max-h-36 w-44 overflow-hidden rounded-2xl border border-border" />
          ) : null}
        </Field>

        <Field data-invalid={Boolean(errors.comentario)}>
          <FieldLabel htmlFor="animal-comentario">Descripción</FieldLabel>
          <Textarea
            id="animal-comentario"
            name="comentario"
            placeholder="Cuéntanos algo que ayude a identificarla."
            defaultValue={initial?.comentario ?? ""}
            rows={4}
            aria-invalid={Boolean(errors.comentario)}
          />
          {errors.comentario ? <FieldError>{errors.comentario}</FieldError> : null}
        </Field>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" data-icon="inline-start" /> : <Save aria-hidden="true" data-icon="inline-start" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
