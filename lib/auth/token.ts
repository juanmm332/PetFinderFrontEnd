import type { LoginResponse } from "@/lib/types"

export const SESSION_STORAGE_KEY = "petfinder.session.v1"
export const SESSION_EXPIRED_EVENT = "petfinder:session-expired"

export interface AppSession {
  accessToken: string
  tokenType: string
  expiresAt: string
  userId: string | null
  name: string | null
  email: string | null
  role: string | null
  isAdmin: boolean
}

interface JwtClaims extends Record<string, unknown> {
  sub?: string
  exp?: number
  role?: string | string[]
  roles?: string | string[]
}

function decodeClaims(token: string): JwtClaims {
  try {
    const payload = token.split(".")[1]
    if (!payload) return {}
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtClaims
  } catch {
    return {}
  }
}

function claimString(claims: JwtClaims, keys: string[]) {
  for (const key of keys) {
    const value = claims[key]
    if (typeof value === "string" && value.trim()) return value
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }
  return null
}

function roleValues(claims: JwtClaims) {
  const values = [
    claims.role,
    claims.roles,
    claims.Role,
    claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
    claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"],
  ]
  return values.flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string => typeof value === "string")
}

export function createAppSession(response: LoginResponse): AppSession {
  const claims = decodeClaims(response.accessToken)
  const roles = roleValues(claims)
  const role = roles[0] ?? null
  const normalizedRoles = roles.map((value) => value.trim().toLocaleLowerCase("es"))

  return {
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    expiresAt: response.expiresAt,
    userId: claimString(claims, [
      "sub",
      "idUsuario",
      "id",
      "nameid",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
    ]),
    name: claimString(claims, [
      "name",
      "nombre",
      "unique_name",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    ]),
    email: claimString(claims, ["email", "correo", "email_address"]),
    role,
    isAdmin: normalizedRoles.some((value) =>
      ["admin", "administrator", "administrador"].includes(value),
    ),
  }
}

function isExpired(expiresAt: string) {
  const time = Date.parse(expiresAt)
  return Number.isFinite(time) && time <= Date.now()
}

export function saveSession(response: LoginResponse): AppSession {
  const session = createAppSession(response)
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: response.accessToken,
        tokenType: response.tokenType,
        expiresAt: response.expiresAt,
      }),
    )
  }
  return session
}

export function readSession(): AppSession | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<LoginResponse>
    if (
      typeof value.accessToken !== "string" ||
      typeof value.tokenType !== "string" ||
      typeof value.expiresAt !== "string" ||
      isExpired(value.expiresAt)
    ) {
      clearStoredSession()
      return null
    }
    return createAppSession(value as LoginResponse)
  } catch {
    clearStoredSession()
    return null
  }
}

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<LoginResponse>
    if (typeof value.accessToken !== "string" || typeof value.expiresAt !== "string") return null
    if (isExpired(value.expiresAt)) {
      clearStoredSession()
      return null
    }
    return value.accessToken
  } catch {
    clearStoredSession()
    return null
  }
}

export function clearStoredSession() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }
}
