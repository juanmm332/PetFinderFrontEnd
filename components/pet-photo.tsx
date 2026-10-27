"use client"

import Image from "next/image"
import { useState } from "react"
import { PawPrint } from "lucide-react"
import { getSafeImageUrl } from "@/lib/utils/petfinder"
import { cn } from "@/lib/utils"

export function PetPhoto({
  src,
  alt,
  className,
  imageClassName,
}: {
  src?: string | null
  alt: string
  className?: string
  imageClassName?: string
}) {
  const [failed, setFailed] = useState(false)
  const safeSrc = getSafeImageUrl(src)
  const containerClassName = cn("relative flex items-center justify-center overflow-hidden bg-secondary", className)

  if (!safeSrc || failed) {
    return (
      <div
        role="img"
        aria-label={alt ? `${alt}. Foto no disponible` : "Foto no disponible"}
        className={containerClassName}
      >
        <div className="flex flex-col items-center gap-2 text-primary/60">
          <PawPrint aria-hidden="true" className="size-10" />
          <span className="text-xs font-medium">Foto no disponible</span>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      <Image
        src={safeSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px"
        unoptimized
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  )
}
