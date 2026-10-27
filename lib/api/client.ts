import {
  clearStoredSession,
  getStoredAccessToken,
  SESSION_EXPIRED_EVENT,
} from "@/lib/auth/token"

export const DEFAULT_API_BASE_URL = "https://localhost:7197"
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, "")

export class ApiError extends Error {
  readonly status: number
  readonly cause?: unknown

  constructor(message: string, status: number, cause?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.cause = cause
  }
}

interface ApiRequestOptions {
  method?: string
  body?: unknown
  auth?: boolean
  headers?: HeadersInit
}

function friendlyMessage(payload: unknown, status: number, path: string) {
  if (status === 409) {
    return "Ese correo ya está registrado. Prueba con otra dirección de correo."
  }

  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>
    const directMessage = [value.detail, value.message, value.title, value.error].find(
      (candidate) => typeof candidate === "string" && candidate.trim().length > 0,
    )

    if (typeof directMessage === "string") return directMessage

    const errors = value.errors
    if (errors && typeof errors === "object") {
      const messages = Object.values(errors as Record<string, unknown>)
        .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
        .filter((entry): entry is string => typeof entry === "string")
      if (messages.length > 0) return messages.join(" ")
    }
  }

  if (status === 401 && path.toLowerCase().includes("/auth/login")) {
    return "El correo o la contraseña no son correctos."
  }
  if (status === 401) return "Tu sesión ya no es válida. Inicia sesión de nuevo."
  if (status === 403) return "No tienes permiso para realizar esta acción."
  if (status === 404) return "No se encontró el recurso solicitado."
  if (status === 400) return "Revisa los datos e inténtalo de nuevo."
  if (status >= 500) return "El servicio no pudo completar la solicitud. Inténtalo más tarde."
  return "No se pudo completar la solicitud."
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET"
  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  if (options.auth !== false) {
    const accessToken = getStoredAccessToken()
    if (!accessToken) {
      throw new ApiError("Inicia sesión para continuar.", 401)
    }
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    })
  } catch (error) {
    throw new ApiError(
      `No se pudo conectar con la API en ${API_BASE_URL}. Comprueba la URL y que el servicio esté disponible.`,
      0,
      error,
    )
  }

  const payload = await readPayload(response)

  if (response.status === 401 && options.auth !== false) {
    clearStoredSession()
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
  }

  if (!response.ok) {
    throw new ApiError(friendlyMessage(payload, response.status, path), response.status, payload)
  }

  return payload as T
}
