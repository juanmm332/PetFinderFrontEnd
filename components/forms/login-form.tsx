"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { loginUser } from "@/lib/api/resources"
import { useSession } from "@/lib/auth/session-context"
import { ApiError } from "@/lib/api/client"
import { loginSchema } from "@/lib/validation"

export function LoginForm() {
  const router = useRouter()
  const { startSession } = useSession()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = loginSchema.safeParse({
      correo: formData.get("correo"),
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
      const response = await loginUser(result.data)
      startSession(response)
      router.replace("/inicio")
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "No se pudo iniciar sesión. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {formError ? (
        <Alert variant="destructive" role="alert" aria-live="polite">
          <AlertTitle>No se pudo iniciar sesión</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FieldGroup>
          <Field data-invalid={Boolean(errors.correo)}>
            <FieldLabel htmlFor="login-correo">Correo electrónico</FieldLabel>
            <Input id="login-correo" name="correo" type="email" autoComplete="email" placeholder="tu@correo.com" required aria-invalid={Boolean(errors.correo)} />
            {errors.correo ? <FieldError>{errors.correo}</FieldError> : null}
          </Field>
          <Field data-invalid={Boolean(errors.contraseña)}>
            <FieldLabel htmlFor="login-contrasena">Contraseña</FieldLabel>
            <div className="relative">
              <Input
                id="login-contrasena"
                name="contraseña"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
            {errors.contraseña ? <FieldError>{errors.contraseña}</FieldError> : null}
          </Field>
        </FieldGroup>
        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" data-icon="inline-start" /> : <LogIn aria-hidden="true" data-icon="inline-start" />}
          {isSubmitting ? "Validando acceso…" : "Iniciar sesión"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta? <Link href="/registro" className="font-medium text-primary underline-offset-4 hover:underline">Regístrate</Link>
      </p>
    </div>
  )
}
