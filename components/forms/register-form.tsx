"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Eye, EyeOff, LoaderCircle, UserRoundPlus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createUsuario } from "@/lib/api/resources"
import { ApiError } from "@/lib/api/client"
import { registerSchema } from "@/lib/validation"

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [isCreated, setIsCreated] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = registerSchema.safeParse({
      nombre: formData.get("nombre"),
      correo: formData.get("correo"),
      telefono: formData.get("telefono"),
      contraseña: formData.get("contraseña"),
    })

    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      setFormError("")
      return
    }

    setErrors({})
    setFormError("")
    setIsSubmitting(true)
    try {
      await createUsuario(result.data)
      setIsCreated(true)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "No se pudo crear la cuenta. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCreated) {
    return (
      <div className="flex flex-col gap-5">
        <Alert role="status">
          <AlertTitle>Cuenta creada</AlertTitle>
          <AlertDescription>Tu registro se confirmó con la API. Ya puedes iniciar sesión con el correo y la contraseña que elegiste.</AlertDescription>
        </Alert>
        <Button nativeButton={false} role="link" render={<Link href="/login" />} className="w-full">Ir a iniciar sesión</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {formError ? (
        <Alert variant="destructive" role="alert" aria-live="polite">
          <AlertTitle>No se pudo crear la cuenta</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FieldGroup>
          <Field data-invalid={Boolean(errors.nombre)}>
            <FieldLabel htmlFor="registro-nombre">Nombre</FieldLabel>
            <Input id="registro-nombre" name="nombre" autoComplete="name" placeholder="Tu nombre" required aria-invalid={Boolean(errors.nombre)} />
            {errors.nombre ? <FieldError>{errors.nombre}</FieldError> : null}
          </Field>
          <Field data-invalid={Boolean(errors.correo)}>
            <FieldLabel htmlFor="registro-correo">Correo electrónico</FieldLabel>
            <Input id="registro-correo" name="correo" type="email" autoComplete="email" placeholder="tu@correo.com" required aria-invalid={Boolean(errors.correo)} />
            {errors.correo ? <FieldError>{errors.correo}</FieldError> : null}
          </Field>
          <Field data-invalid={Boolean(errors.telefono)}>
            <FieldLabel htmlFor="registro-telefono">Teléfono</FieldLabel>
            <Input id="registro-telefono" name="telefono" type="tel" autoComplete="tel" placeholder="Tu número de contacto" required aria-invalid={Boolean(errors.telefono)} />
            {errors.telefono ? <FieldError>{errors.telefono}</FieldError> : null}
          </Field>
          <Field data-invalid={Boolean(errors.contraseña)}>
            <FieldLabel htmlFor="registro-contrasena">Contraseña</FieldLabel>
            <div className="relative">
              <Input
                id="registro-contrasena"
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
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute top-1/2 right-1 -translate-y-1/2"
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            </div>
            <FieldDescription>Al menos 5 caracteres.</FieldDescription>
            {errors.contraseña ? <FieldError>{errors.contraseña}</FieldError> : null}
          </Field>
        </FieldGroup>
        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" data-icon="inline-start" /> : <UserRoundPlus aria-hidden="true" data-icon="inline-start" />}
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta? <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">Inicia sesión</Link>
      </p>
    </div>
  )
}
