"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Edit3, PawPrint, Plus, Search } from "lucide-react"
import { AnimalForm } from "@/components/forms/animal-form"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { ApiErrorState, EmptyState, LoadingCards } from "@/components/data-states"
import { PageHeading } from "@/components/page-heading"
import { PetCard } from "@/components/pet-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAnimales, useRefreshResources } from "@/lib/api/hooks"
import { API_PATHS, createAnimal, deleteAnimal, updateAnimal } from "@/lib/api/resources"
import { ApiError } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-context"
import type { Animal, EntityId } from "@/lib/types"
import type { AnimalWriteValues } from "@/lib/validation"
import { isAnimalOwner } from "@/lib/utils/petfinder"

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "No se pudo completar la operación. Inténtalo de nuevo."
}

export default function MascotasPage() {
  const { session } = useSession()
  const animalsQuery = useAnimales()
  const refreshResources = useRefreshResources()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  const animals = animalsQuery.data ?? []
  const term = search.trim().toLocaleLowerCase("es")
  const filteredAnimals = animals.filter((animal) =>
    !term || `${animal.nombre} ${animal.comentario ?? ""}`.toLocaleLowerCase("es").includes(term),
  )

  function openCreate() {
    setSelectedAnimal(undefined)
    setDialogOpen(true)
  }

  function openEdit(animal: Animal) {
    setSelectedAnimal(animal)
    setDialogOpen(true)
  }

  async function saveAnimal(values: AnimalWriteValues) {
    setIsSaving(true)
    try {
      if (selectedAnimal) {
        await updateAnimal(selectedAnimal.idAnimal, values)
        toast.success("Los cambios de la mascota se guardaron.")
      } else {
        await createAnimal(values)
        toast.success("La mascota se registró correctamente.")
      }
      setDialogOpen(false)
      await refreshResources([API_PATHS.animals, API_PATHS.notices])
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function removeAnimal(id: EntityId) {
    try {
      await deleteAnimal(id)
      toast.success("La mascota se marcó como eliminada.")
      await refreshResources([API_PATHS.animals, API_PATHS.notices])
      return true
    } catch (error) {
      toast.error(errorMessage(error))
      return false
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeading
        eyebrow="Tu comunidad"
        title="Mascotas"
        description="Consulta las mascotas registradas y mantén sus datos de identificación al día."
        action={<Button onClick={openCreate}><Plus aria-hidden="true" data-icon="inline-start" /> Añadir mascota</Button>}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:p-4">
        <Search aria-hidden="true" className="ml-1 size-4 shrink-0 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o descripción" aria-label="Buscar mascotas" className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
        <span className="px-2 text-xs text-muted-foreground">{animalsQuery.data ? `${filteredAnimals.length} de ${animals.length}` : ""}</span>
      </div>

      {animalsQuery.error ? <ApiErrorState error={animalsQuery.error} onRetry={() => void animalsQuery.mutate()} /> : null}
      {animalsQuery.isLoading ? <LoadingCards /> : null}
      {animalsQuery.data && animals.length === 0 ? (
        <EmptyState icon={PawPrint} title="Todavía no hay mascotas" description="Registra una mascota para crear su ficha y poder asociarla a un aviso." action={<Button onClick={openCreate}><Plus aria-hidden="true" data-icon="inline-start" /> Añadir mascota</Button>} />
      ) : null}
      {animalsQuery.data && animals.length > 0 && filteredAnimals.length === 0 ? (
        <EmptyState icon={Search} title="No encontramos coincidencias" description="Prueba con otro nombre o descripción." action={<Button variant="outline" onClick={() => setSearch("")}>Limpiar búsqueda</Button>} />
      ) : null}
      {filteredAnimals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAnimals.map((animal) => {
            const canManage = isAnimalOwner(animal, session?.userId)
            return (
              <PetCard
                key={animal.idAnimal}
                animal={animal}
                actions={canManage ? (
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar ${animal.nombre}`} onClick={() => openEdit(animal)}>
                      <Edit3 aria-hidden="true" />
                    </Button>
                    <ConfirmDeleteDialog itemLabel={animal.nombre} onConfirm={() => removeAnimal(animal.idAnimal)} iconOnly />
                  </div>
                ) : null}
              />
            )
          })}
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={(open) => !isSaving && setDialogOpen(open)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedAnimal ? "Editar mascota" : "Registrar mascota"}</DialogTitle>
            <DialogDescription>
              {selectedAnimal ? "Actualiza la información de esta ficha." : "Completa los datos que ayudarán a reconocerla."}
            </DialogDescription>
          </DialogHeader>
          <AnimalForm
            key={selectedAnimal?.idAnimal ?? "new-animal"}
            initial={selectedAnimal}
            onSubmit={saveAnimal}
            onCancel={() => setDialogOpen(false)}
            isSaving={isSaving}
            submitLabel={selectedAnimal ? "Guardar cambios" : "Registrar mascota"}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
