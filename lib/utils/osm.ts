export interface GeoCoordinates {
  lat: number
  lng: number
}

export interface GeocodingResult {
  placeId: number
  displayName: string
  lat: number
  lng: number
  address?: {
    road?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
  }
}

/**
 * Extracts latitude and longitude from location text if present.
 * Matches patterns like:
 * - "Parque Sarmiento (-31.4321, -64.1852)"
 * - "Plaza San Martín [-31.4167, -64.1833]"
 * - "-31.4167, -64.1833"
 * - "Córdoba @ -31.4167,-64.1833"
 */
export function parseCoordinates(locationText?: string | null): GeoCoordinates | null {
  if (!locationText?.trim()) return null

  const trimmed = locationText.trim()
  const regex = /(?:\[|\(|\@)?\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*(?:\]|\))?/
  const match = trimmed.match(regex)
  if (!match) return null

  const lat = Number(match[1])
  const lng = Number(match[2])

  if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { lat, lng }
  }

  return null
}

/**
 * Cleans the location text by removing the embedded coordinates for user-friendly display.
 */
export function cleanAddress(locationText?: string | null): string {
  if (!locationText?.trim()) return ""
  const cleaned = locationText.replace(/\s*(?:\[|\(|\@)\s*-?\d{1,2}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?\s*(?:\]|\))?\s*$/, "").trim()
  return cleaned || locationText.trim()
}

/**
 * Formats a location string with address and coordinates.
 */
export function formatLocationWithCoordinates(address: string, coords: GeoCoordinates): string {
  const clean = cleanAddress(address)
  const coordsFormatted = `(${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)})`
  return clean ? `${clean} ${coordsFormatted}` : coordsFormatted
}

/**
 * Searches locations using OpenStreetMap Nominatim API.
 */
export async function searchOpenStreetMap(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  if (!query.trim() || query.trim().length < 2) return []

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("q", query.trim())
    url.searchParams.set("format", "json")
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("limit", "5")
    url.searchParams.set("accept-language", "es")

    const res = await fetch(url.toString(), {
      signal,
      headers: {
        Accept: "application/json",
      },
    })

    if (!res.ok) return []

    const data = await res.json()
    if (!Array.isArray(data)) return []

    return data.map((item: any) => ({
      placeId: Number(item.place_id),
      displayName: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
      address: item.address,
    }))
  } catch (error) {
    if (signal?.aborted) return []
    console.warn("Error searching OpenStreetMap Nominatim:", error)
    return []
  }
}

/**
 * Reverse geocodes coordinates to a human-readable address using OpenStreetMap Nominatim.
 */
export async function reverseGeocodeOpenStreetMap(coords: GeoCoordinates, signal?: AbortSignal): Promise<string | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse")
    url.searchParams.set("lat", String(coords.lat))
    url.searchParams.set("lon", String(coords.lng))
    url.searchParams.set("format", "json")
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("accept-language", "es")

    const res = await fetch(url.toString(), {
      signal,
      headers: {
        Accept: "application/json",
      },
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data || !data.display_name) return null

    // Format shorter clean address if address details are present
    const addr = data.address
    if (addr) {
      const parts = [
        addr.road ? `${addr.road}${addr.house_number ? ` ${addr.house_number}` : ""}` : null,
        addr.neighbourhood || addr.suburb || addr.quarter,
        addr.city || addr.town || addr.village || addr.municipality,
        addr.state,
      ].filter(Boolean)

      if (parts.length >= 2) {
        return parts.join(", ")
      }
    }

    return data.display_name
  } catch (error) {
    if (signal?.aborted) return null
    console.warn("Error reverse geocoding OpenStreetMap Nominatim:", error)
    return null
  }
}

/**
 * Generates an OpenStreetMap web URL for direct viewing / navigation.
 */
export function getOpenStreetMapUrl(coords: GeoCoordinates, zoom = 16): string {
  return `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=${zoom}/${coords.lat}/${coords.lng}`
}

