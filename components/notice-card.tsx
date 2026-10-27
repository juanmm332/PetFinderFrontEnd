import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowUpRight, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PetPhoto } from "@/components/pet-photo"
import type { AnimalSummary, Aviso } from "@/lib/types"
import { getCreatedDate, noticeStateVariant } from "@/lib/utils/petfinder"
import { cleanAddress } from "@/lib/utils/osm"

export function NoticeCard({
  notice,
  animal,
  actions,
}: {
  notice: Aviso
  animal?: AnimalSummary | null
  actions?: ReactNode
}) {
  const displayAnimal = animal ?? notice.animal
  const createdDate = getCreatedDate(notice)

  return (
    <Card className="overflow-hidden rounded-3xl border-border/80 bg-card py-0 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="grid sm:grid-cols-[10rem_minmax(0,1fr)]">
        <Link href={`/avisos/${notice.idAviso}`} className="block min-h-40 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:min-h-0">
          <PetPhoto
            src={displayAnimal?.foto}
            alt={displayAnimal?.nombre ? `Foto de ${displayAnimal.nombre}` : "Foto asociada al aviso"}
            className="h-full min-h-40 w-full"
          />
        </Link>
        <CardContent className="flex min-w-0 flex-col justify-between gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant={noticeStateVariant(notice.estado)}>{notice.estado}</Badge>
              {createdDate ? <span className="text-xs text-muted-foreground">Publicado el {createdDate}</span> : null}
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {displayAnimal?.nombre ?? `Aviso de mascota #${notice.idAnimal}`}
              </h2>
              <p className="mt-2 inline-flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{cleanAddress(notice.ultimaUbicacionVista)}</span>
              </p>
              {notice.comentario?.trim() ? (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{notice.comentario}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <Link href={`/avisos/${notice.idAviso}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              Ver aviso <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
            {actions}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
