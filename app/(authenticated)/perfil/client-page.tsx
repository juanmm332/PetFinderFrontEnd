"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ShieldCheck, UserRound } from "lucide-react"
import { ApiErrorState, LoadingPanel } from "@/components/data-states"
import { ProfileForm } from "@/components/forms/profile-form"
import { PageHeading } from "@/components/page-heading"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRefreshResources, useUsuario } from "@/lib/api/hooks"
import { API_PATHS, updateUsuario } from "@/lib/api/resources"
import { ApiError } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-context"
import type { ProfileUpdateValues } from "@/lib/validation"
import { initials } from "@/lib/utils/petfinder"

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "No se pudo actualizar el perfil. Inténtalo de nuevo."
}

export default function PerfilPage() {
  const { session } = useSession()
  const userQuery = useUsuario(session?.userId)
  const refreshResources = useRefreshResources()
  const [isSaving, setIsSaving] = useState(false)
  const [formVersion, setFormVersion] = useState(0)

  async function saveProfile(values: ProfileUpdateValues) {
    if (!userQuery.data) return
    setIsSaving(true)
    try {
      await updateUsuario(userQuery.data.idUsuario, values)
      toast.success("El perfil se actualizó correctamente.")
      await refreshResources([API_PATHS.users])
      setFormVersion((version) => version + 1)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeading eyebrow="Tu cuenta" title="Perfil" description="Actualiza tus datos de contacto y la contraseña de tu cuenta." />

      {!session?.userId ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
          El token no contiene un identificador de usuario; no se puede cargar ni editar un perfil de forma segura.
        </div>
      ) : null}
      {userQuery.isLoading ? <LoadingPanel label="Cargando perfil" /> : null}
      {userQuery.error ? <ApiErrorState error={userQuery.error} onRetry={() => void userQuery.mutate()} /> : null}
      {userQuery.data ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Card className="h-fit rounded-3xl border-border/80 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Resumen de la cuenta</CardTitle>
              <CardDescription>Datos que devuelve el servicio para esta sesión.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <Avatar className="size-14 border border-border">
                  <AvatarFallback className="bg-secondary text-primary">{initials(userQuery.data.nombre)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{userQuery.data.nombre}</p>
                  <p className="truncate text-sm text-muted-foreground">{userQuery.data.correo}</p>
                </div>
              </div>
              <div className="grid gap-3 border-t border-border pt-5 text-sm">
                <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Teléfono</span><span className="text-right font-medium">{userQuery.data.telefono || "No indicado"}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Identificador</span><span className="font-mono text-xs">{userQuery.data.idUsuario}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Rol</span><span className="inline-flex items-center gap-1.5 font-medium">{session?.isAdmin ? <ShieldCheck aria-hidden="true" className="size-4 text-primary" /> : <UserRound aria-hidden="true" className="size-4 text-muted-foreground" />}{session?.role ?? "Usuario"}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/80 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Editar datos</CardTitle>
              <CardDescription>El contrato de actualización requiere nombre, contraseña, correo y teléfono.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm key={`${userQuery.data.idUsuario}-${formVersion}`} user={userQuery.data} onSubmit={saveProfile} isSaving={isSaving} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
