"use client"

import { useEffect, useRef, useState } from "react"
import { ExternalLink, LoaderCircle, MapPin } from "lucide-react"
import { cleanAddress, getOpenStreetMapUrl, parseCoordinates, searchOpenStreetMap, type GeoCoordinates } from "@/lib/utils/osm"

interface LocationMapProps {
  location: string
  title?: string
  className?: string
  zoom?: number
}

export function LocationMap({
  location,
  title = "Última ubicación vista",
  className = "h-72 w-full",
  zoom = 15,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const [coords, setCoords] = useState<GeoCoordinates | null>(() => parseCoordinates(location))
  const [loading, setLoading] = useState<boolean>(!coords)
  const [error, setError] = useState<string | null>(null)

  const displayName = cleanAddress(location)

  // Resolve coordinates if not directly in the string
  useEffect(() => {
    const directCoords = parseCoordinates(location)
    if (directCoords) {
      setCoords(directCoords)
      setLoading(false)
      setError(null)
      return
    }

    if (!location.trim()) {
      setLoading(false)
      setError("No se indicó una ubicación.")
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    const controller = new AbortController()
    searchOpenStreetMap(location, controller.signal)
      .then((results) => {
        if (!isMounted) return
        if (results.length > 0 && results[0]) {
          setCoords({ lat: results[0].lat, lng: results[0].lng })
        } else {
          setError("No se pudieron determinar las coordenadas en OpenStreetMap.")
        }
      })
      .catch(() => {
        if (!isMounted) return
        setError("Error al consultar OpenStreetMap.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [location])

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!coords || !containerRef.current) return

    let isMounted = true

    // Dynamically load Leaflet on client side
    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return

      // Clean up previous map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(containerRef.current, {
        center: [coords.lat, coords.lng],
        zoom,
        scrollWheelZoom: false,
      })

      mapInstanceRef.current = map

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      const pinIcon = L.divIcon({
        className: "bg-transparent border-0",
        html: `
          <div style="transform: translate(-50%, -100%);">
            <div style="background-color: #28513f; color: white; padding: 7px; border-radius: 9999px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2.5px solid white; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 10a8 8 0 0 1 16 0"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -36],
      })

      const marker = L.marker([coords.lat, coords.lng], { icon: pinIcon }).addTo(map)
      marker
        .bindPopup(
          `<div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
            <p style="font-weight: 600; margin: 0 0 4px 0; color: #1d2d24;">${title}</p>
            <p style="margin: 0; color: #68776d;">${displayName}</p>
          </div>`,
        )
        .openPopup()

      // Ensure proper tile rendering
      setTimeout(() => {
        map.invalidateSize()
      }, 200)
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [coords, zoom, title, displayName])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/40 shadow-sm">
      <div ref={containerRef} className={`${className} z-0`} />

      {loading ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-xs text-sm text-muted-foreground">
          <LoaderCircle className="size-6 animate-spin text-primary" />
          <span>Localizando en OpenStreetMap...</span>
        </div>
      ) : null}

      {error && !coords ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground bg-background/90">
          <MapPin className="size-8 text-muted-foreground/60" />
          <p className="font-medium text-foreground">{displayName || "Ubicación"}</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      ) : null}

      {coords ? (
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <a
            href={getOpenStreetMapUrl(coords, zoom)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-xs backdrop-blur-sm hover:bg-card hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>Abrir en OpenStreetMap</span>
            <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </div>
  )
}

