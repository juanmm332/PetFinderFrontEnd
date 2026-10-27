"use client"

import { useState, type FormEvent } from "react"
import { Eye, EyeOff, LoaderCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Usuario } from "@/lib/types"
import { profileUpdateSchema, type ProfileUpdateValues } from "@/lib/validation"

export function ProfileForm({
  user,
  onSubmit,
  isSaving,
}: {
  user: Usuario
  onSubmit: (values: ProfileUpdateValues) => Promise<void>
  isSaving: boolean
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = profileUpdateSchema.safeParse({
      nombre: formData.get("nombre"),
      contraseña: formData.get("contraseña"),
      correo: formData.get("correo"),
      telefono: formData.get("telefono"),
    })

    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      return
    }

    setErrors({})
    await onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.nombre)}>
          <FieldLabel htmlFor="perfil-nombre">Nombre</FieldLabel>
          <Input id="perfil-nombre" name="nombre" autoComplete="name" defaultValue={user.nombre} required aria-invalid={Boolean(errors.nombre)} />
          {errors.nombre ? <FieldError>{errors.nombre}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(errors.correo)}>
          <FieldLabel htmlFor="perfil-correo">Correo electrónico</FieldLabel>
          <Input id="perfil-correo" name="correo" type="email" autoComplete="email" defaultValue={user.correo} required aria-invalid={Boolean(errors.correo)} />
          {errors.correo ? <FieldError>{errors.correo}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(errors.telefono)}>
          <FieldLabel htmlFor="perfil-telefono">Teléfono</FieldLabel>
          <Input id="perfil-telefono" name="telefono" type="tel" autoComplete="tel" defaultValue={user.telefono ?? ""} required aria-invalid={Boolean(errors.telefono)} />
          {errors.telefono ? <FieldError>{errors.telefono}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(errors.contraseña)}>
          <FieldLabel htmlFor="perfil-contrasena">Nueva contraseña</FieldLabel>
          <div className="relative">
            <Input
              id="perfil-contrasena"
              name="contraseña"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={5}
              required
              className="pr-11"
              aria-invalid={Boolean(errors.contraseña)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={showPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute top-1/2 right-1 -translate-y-1/2"
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
          </div>
          <FieldDescription>La API exige una contraseña al actualizar el perfil. Al guardar, se reemplazará por esta nueva; la contraseña actual no se muestra.</FieldDescription>
          {errors.contraseña ? <FieldError>{errors.contraseña}</FieldError> : null}
        </Field>
      </FieldGroup>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" data-icon="inline-start" /> : <Save aria-hidden="true" data-icon="inline-start" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}
