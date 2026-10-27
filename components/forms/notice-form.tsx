"use client"

import { useMemo, useState, type FormEvent } from "react"
import { LoaderCircle, MapPin, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Animal, Aviso } from "@/lib/types"
import { NOTICE_STATES } from "@/lib/types"
import { avisoWriteSchema, type AvisoWriteValues } from "@/lib/validation"
import { sameId } from "@/lib/utils/petfinder"
import { LocationPicker } from "@/components/map/location-picker"

export function NoticeForm({
  animals,
  initial,
  onSubmit,
  onCancel,
  isSaving,
  submitLabel,
}: {
  animals: Animal[]
  initial?: Aviso
  onSubmit: (values: AvisoWriteValues) => Promise<void>
  onCancel: () => void
  isSaving: boolean
  submitLabel: string
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [animalId, setAnimalId] = useState(initial ? String(initial.idAnimal) : "")
  const [status, setStatus] = useState<Aviso["estado"]>(initial?.estado ?? "Activo")
  const currentAnimalAvailable = initial && !animals.some((animal) => sameId(animal.idAnimal, initial.idAnimal))
  const animalOptions = useMemo(() => {
    const map: Record<string, string> = {}
    if (currentAnimalAvailable && initial) {
      map[String(initial.idAnimal)] = initial.animal?.nombre ?? `Mascota asociada #${initial.idAnimal}`
    }
    for (const animal of animals) {
      map[String(animal.idAnimal)] = animal.nombre
    }
    return map
  }, [animals, currentAnimalAvailable, initial])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = avisoWriteSchema.safeParse({
      idAnimal: animalId,
      estado: status,
      ultimaUbicacionVista: formData.get("ubicacion"),
      comentario: formData.get("comentario") ?? "",
    })

    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      return
    }

    setErrors({})
    await onSubmit({ ...result.data, idAnimal: Number(result.data.idAnimal) })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {animals.length === 0 && !initial ? (
        <div className="rounded-2xl border border-accent bg-accent/40 p-4 text-sm text-accent-foreground">
          No hay mascotas disponibles para asociar. Registra una mascota antes de publicar un aviso.
        </div>
      ) : null}

      <FieldGroup>
        <Field data-invalid={Boolean(errors.idAnimal)}>
          <FieldLabel htmlFor="aviso-animal">Mascota</FieldLabel>
          <Select
            value={animalId || null}
            onValueChange={(value) => setAnimalId(value ?? "")}
            items={animalOptions}
            disabled={Boolean(initial)}
          >
            <SelectTrigger id="aviso-animal" aria-label="Mascota" className="w-full" aria-invalid={Boolean(errors.idAnimal)}>
              <SelectValue placeholder="Elige una mascota">
                {(value) => {
                  if (!value) return "Elige una mascota"
                  return animalOptions[String(value)] ?? String(value)
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {currentAnimalAvailable ? (
                  <SelectItem value={String(initial.idAnimal)} label={initial.animal?.nombre ?? `Mascota asociada #${initial.idAnimal}`}>
                    {initial.animal?.nombre ?? `Mascota asociada #${initial.idAnimal}`}
                  </SelectItem>
                ) : null}
                {animals.map((animal) => (
                  <SelectItem key={animal.idAnimal} value={String(animal.idAnimal)} label={animal.nombre}>
                    {animal.nombre}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            {initial
              ? "La mascota asociada no se puede cambiar al editar un aviso."
              : "Solo puedes elegir mascotas propias; los administradores pueden asociar cualquier mascota activa."}
          </FieldDescription>
          {errors.idAnimal ? <FieldError>{errors.idAnimal}</FieldError> : null}
        </Field>

        <Field data-invalid={Boolean(errors.estado)}>
          <FieldLabel htmlFor="aviso-estado">Estado</FieldLabel>
          <Select value={status} onValueChange={(value) => value && setStatus(value as Aviso["estado"])}>
            <SelectTrigger id="aviso-estado" aria-label="Estado del aviso" className="w-full" aria-invalid={Boolean(errors.estado)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {NOTICE_STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.estado ? <FieldError>{errors.estado}</FieldError> : null}
        </Field>

        <Field data-invalid={Boolean(errors.ultimaUbicacionVista)}>
          <FieldLabel>Última ubicación vista (OpenStreetMap)</FieldLabel>
          <LocationPicker
            initialValue={initial?.ultimaUbicacionVista ?? ""}
            error={errors.ultimaUbicacionVista}
          />
          <FieldDescription className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5" />
            Haz clic en el mapa para marcar el punto exacto o busca una dirección.
          </FieldDescription>
          {errors.ultimaUbicacionVista ? <FieldError>{errors.ultimaUbicacionVista}</FieldError> : null}
        </Field>

        <Field data-invalid={Boolean(errors.comentario)}>
          <FieldLabel htmlFor="aviso-comentario">Información adicional</FieldLabel>
          <Textarea
            id="aviso-comentario"
            name="comentario"
            placeholder="Características, señas o indicaciones útiles."
            defaultValue={initial?.comentario ?? ""}
            rows={4}
            aria-invalid={Boolean(errors.comentario)}
          />
          {errors.comentario ? <FieldError>{errors.comentario}</FieldError> : null}
        </Field>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
        <Button type="submit" disabled={isSaving || (!initial && animals.length === 0)}>
          {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" data-icon="inline-start" /> : <Save aria-hidden="true" data-icon="inline-start" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
