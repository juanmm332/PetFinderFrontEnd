import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowUpRight, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PetPhoto } from "@/components/pet-photo"
import type { Animal } from "@/lib/types"

export function PetCard({ animal, actions }: { animal: Animal; actions?: ReactNode }) {
  return (
    <Card className="group overflow-hidden rounded-3xl border-border/80 bg-card py-0 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/mascotas/${animal.idAnimal}`} className="block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset">
        <PetPhoto
          src={animal.foto}
          alt={`Foto de ${animal.nombre}`}
          className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.02]"
          imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </Link>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight">{animal.nombre}</h2>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
            {animal.comentario?.trim() || "Sin descripción publicada."}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
          <Link href={`/mascotas/${animal.idAnimal}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
            Ver ficha <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
          {actions}
        </div>
      </CardContent>
    </Card>
  )
}

export function PetIdentity({ animal }: { animal: Animal | null | undefined }) {
  if (!animal) return <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><MapPin aria-hidden="true" className="size-4" />Mascota asociada #{"—"}</span>
  return (
    <Link href={`/mascotas/${animal.idAnimal}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
      <PetPhoto src={animal.foto} alt="" className="size-8 overflow-hidden rounded-full" imageClassName="size-8 rounded-full object-cover" />
      <span>{animal.nombre}</span>
    </Link>
  )
}
