"use client"

import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react"
import { ApiErrorState } from "@/components/data-states"
import { PageHeading } from "@/components/page-heading"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRefreshResources } from "@/lib/api/hooks"
import { API_PATHS, restoreResource } from "@/lib/api/resources"
import { ApiError } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-context"
import type { RestoreResource } from "@/lib/types"
import { restoreIdSchema } from "@/lib/validation"

const restoreTargets: { value: RestoreResource; label: string; path: string }[] = [
  { value: "Animal", label: "Mascota", path: API_PATHS.animals },
  { value: "Aviso", label: "Aviso", path: API_PATHS.notices },
  { value: "Comentario", label: "Comentario", path: API_PATHS.comments },
  { value: "Usuario", label: "Usuario", path: API_PATHS.users },
]

export default function AdministracionPage() {
  const { session } = useSession()
  const refreshResources = useRefreshResources()
  const [resource, setResource] = useState<RestoreResource>("Animal")
  const [id, setId] = useState("")
  const [idError, setIdError] = useState("")
  const [requestError, setRequestError] = useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedId = restoreIdSchema.safeParse(id)
    if (!parsedId.success) {
      setIdError(parsedId.error.issues[0]?.message ?? "Introduce un ID válido.")
      return
    }

    setIdError("")
    setRequestError(null)
    setIsSubmitting(true)
    try {
      await restoreResource(resource, Number(parsedId.data))
      toast.success(`${restoreTargets.find((target) => target.value === resource)?.label ?? "Registro"} restaurado.`)
      setId("")
      const target = restoreTargets.find((item) => item.value === resource)
      if (target) await refreshResources([target.path])
    } catch (error) {
      setRequestError(error)
      toast.error(error instanceof ApiError ? error.message : "No se pudo restaurar el registro.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.isAdmin) {
    return (
      <Alert variant="destructive" role="alert" className="rounded-2xl">
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>Acceso restringido</AlertTitle>
        <AlertDescription>Esta pantalla está disponible únicamente para cuentas cuyo token indique rol de administrador.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeading eyebrow="Herramientas de cuenta" title="Administración" description="Acciones administrativas documentadas por la API." />
      {requestError ? <ApiErrorState error={requestError} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <Card className="rounded-3xl border-border/80 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><RotateCcw aria-hidden="true" className="size-5 text-primary" />Restaurar un registro</CardTitle>
            <CardDescription>Ejecuta el endpoint PATCH de restauración para un tipo de recurso e ID.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="restore-resource">Tipo de recurso</FieldLabel>
                  <Select value={resource} onValueChange={(value) => value && setResource(value as RestoreResource)}>
                    <SelectTrigger id="restore-resource" className="w-full" aria-label="Tipo de recurso a restaurar"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectGroup>{restoreTargets.map((target) => <SelectItem key={target.value} value={target.value}>{target.label}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </Field>
                <Field data-invalid={Boolean(idError)}>
                  <FieldLabel htmlFor="restore-id">ID del registro</FieldLabel>
                  <Input id="restore-id" name="id" inputMode="numeric" autoComplete="off" value={id} onChange={(event) => setId(event.target.value)} placeholder="Introduce el ID" aria-invalid={Boolean(idError)} required />
                  <FieldDescription>La API no ofrece un endpoint para listar registros eliminados. No se muestra un listado simulado.</FieldDescription>
                  {idError ? <FieldError>{idError}</FieldError> : null}
                </Field>
              </FieldGroup>
              <p className="rounded-xl bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">PATCH /api/{resource}/&#123;id&#125;/restore</p>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" data-icon="inline-start" /> : <RotateCcw aria-hidden="true" data-icon="inline-start" />}
                Restaurar registro
              </Button>
            </form>
          </CardContent>
        </Card>

        <Alert className="h-fit rounded-3xl border-primary/15 bg-secondary/60 text-secondary-foreground">
          <ShieldCheck aria-hidden="true" />
          <AlertTitle>Acceso de administrador</AlertTitle>
          <AlertDescription className="leading-relaxed">
            El rol se verifica desde los claims del token para mostrar esta herramienta. La autorización definitiva sigue siendo responsabilidad de la API.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
