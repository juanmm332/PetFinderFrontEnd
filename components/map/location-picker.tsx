"use client"

import { useEffect, useRef, useState } from "react"
import { Crosshair, LoaderCircle, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  cleanAddress,
  formatLocationWithCoordinates,
  parseCoordinates,
  reverseGeocodeOpenStreetMap,
  searchOpenStreetMap,
  type GeoCoordinates,
  type GeocodingResult,
} from "@/lib/utils/osm"

interface LocationPickerProps {
  initialValue?: string
  onChange?: (value: string, coords: GeoCoordinates | null) => void
  name?: string
  required?: boolean
  error?: string
}

// Default fallback coordinates (e.g., Córdoba / Argentina center or neutral coordinate)
const DEFAULT_CENTER: GeoCoordinates = { lat: -31.420083, lng: -64.188776 }

export function LocationPicker({
  initialValue = "",
  onChange,
  name = "ubicacion",
  required = true,
  error,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const isDraggingOrClicking = useRef(false)

  const initialCoords = parseCoordinates(initialValue)
  const [coords, setCoords] = useState<GeoCoordinates | null>(initialCoords)
  const [addressText, setAddressText] = useState<string>(() => cleanAddress(initialValue))
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
  const [isLocatingUser, setIsLocatingUser] = useState(false)

  // Full value to submit: e.g. "Plaza San Martín (-31.416700, -64.183300)"
  const finalValue = coords
    ? formatLocationWithCoordinates(addressText || "Ubicación seleccionada", coords)
    : addressText

  // Notify parent of changes
  useEffect(() => {
    onChange?.(finalValue, coords)
  }, [finalValue, coords, onChange])

  // Initialize Leaflet map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let isMounted = true

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current || mapRef.current) return

      const initialCenter = initialCoords || DEFAULT_CENTER
      const map = L.map(containerRef.current, {
        center: [initialCenter.lat, initialCenter.lng],
        zoom: initialCoords ? 16 : 13,
      })
      mapRef.current = map

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      const createPin = () =>
        L.divIcon({
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

      if (initialCoords) {
        const marker = L.marker([initialCoords.lat, initialCoords.lng], {
          icon: createPin(),
          draggable: true,
        }).addTo(map)

        marker.on("dragend", (e: any) => {
          const newPos = e.target.getLatLng()
          updatePosition({ lat: newPos.lat, lng: newPos.lng }, true)
        })

        markerRef.current = marker
      }

      // Handle map clicks to place marker
      map.on("click", (e: any) => {
        const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng }
        if (!markerRef.current) {
          const marker = L.marker([newCoords.lat, newCoords.lng], {
            icon: createPin(),
            draggable: true,
          }).addTo(map)

          marker.on("dragend", (event: any) => {
            const dragPos = event.target.getLatLng()
            updatePosition({ lat: dragPos.lat, lng: dragPos.lng }, true)
          })

          markerRef.current = marker
        } else {
          markerRef.current.setLatLng([newCoords.lat, newCoords.lng])
        }

        updatePosition(newCoords, true)
      })

      setTimeout(() => {
        map.invalidateSize()
      }, 250)
    })

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Helper to update coords and optionally reverse-geocode
  async function updatePosition(newCoords: GeoCoordinates, fetchAddress = false) {
    setCoords(newCoords)

    if (fetchAddress) {
      setIsReverseGeocoding(true)
      try {
        const address = await reverseGeocodeOpenStreetMap(newCoords)
        if (address) {
          setAddressText(address)
        }
      } catch (err) {
        console.warn("Reverse geocode error:", err)
      } finally {
        setIsReverseGeocoding(false)
      }
    }
  }

  // Handle autocomplete search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      setIsSearching(true)
      searchOpenStreetMap(searchQuery)
        .then((results) => {
          setSuggestions(results)
        })
        .finally(() => {
          setIsSearching(false)
        })
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  function selectSuggestion(result: GeocodingResult) {
    const newCoords = { lat: result.lat, lng: result.lng }
    setCoords(newCoords)
    setAddressText(result.displayName)
    setSearchQuery("")
    setSuggestions([])

    if (mapRef.current) {
      mapRef.current.flyTo([newCoords.lat, newCoords.lng], 16)
      if (markerRef.current) {
        markerRef.current.setLatLng([newCoords.lat, newCoords.lng])
      } else {
        import("leaflet").then((L) => {
          const pin = L.divIcon({
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
          const marker = L.marker([newCoords.lat, newCoords.lng], { icon: pin, draggable: true }).addTo(mapRef.current)
          marker.on("dragend", (event: any) => {
            const dragPos = event.target.getLatLng()
            updatePosition({ lat: dragPos.lat, lng: dragPos.lng }, true)
          })
          markerRef.current = marker
        })
      }
    }
  }

  function handleLocateMe() {
    if (!navigator.geolocation) return
    setIsLocatingUser(true)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        if (mapRef.current) {
          mapRef.current.flyTo([newCoords.lat, newCoords.lng], 16)
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([newCoords.lat, newCoords.lng])
        }
        updatePosition(newCoords, true)
        setIsLocatingUser(false)
      },
      (err) => {
        console.warn("Geolocation error:", err)
        setIsLocatingUser(false)
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search and locate bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar dirección, parque o barrio en OpenStreetMap..."
              className="pl-9 pr-8"
              aria-label="Buscar ubicación en OpenStreetMap"
            />
            {isSearching ? (
              <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleLocateMe}
            disabled={isLocatingUser}
            title="Usar mi ubicación actual"
            className="shrink-0 gap-1.5"
          >
            {isLocatingUser ? <LoaderCircle className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
            <span className="hidden sm:inline">Mi ubicación</span>
          </Button>
        </div>

        {/* Nominatim Search Suggestions */}
        {suggestions.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
            {suggestions.map((item) => (
              <button
                key={item.placeId}
                type="button"
                onClick={() => selectSuggestion(item)}
                className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="line-clamp-2 leading-relaxed">{item.displayName}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Interactive Map */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-xs">
        <div ref={containerRef} className="h-64 sm:h-72 w-full z-0 cursor-crosshair" />

        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-xs backdrop-blur-xs">
          Haz clic o arrastra el marcador para fijar el punto exacto
        </div>

        {isReverseGeocoding ? (
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-card/90 px-2.5 py-1 text-xs text-muted-foreground shadow-xs backdrop-blur-xs">
            <LoaderCircle className="size-3 animate-spin text-primary" />
            <span>Consultando dirección en OpenStreetMap...</span>
          </div>
        ) : null}
      </div>

      {/* Editable address field */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="ubicacion-direccion" className="text-xs font-medium text-muted-foreground">
            Dirección o punto de referencia
          </label>
          {coords ? (
            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">Punto aún no marcado en el mapa</span>
          )}
        </div>
        <Input
          id="ubicacion-direccion"
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder="Ej. Parque Sarmiento, cerca de la estatua"
          required={required}
          aria-invalid={Boolean(error)}
          className="text-sm"
        />
      </div>

      {/* Hidden input storing the synchronized composite value for form submission */}
      <input type="hidden" name={name} value={finalValue} />
    </div>
  )
}

