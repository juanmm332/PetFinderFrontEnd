import { z } from "zod"
import { ApiError, apiRequest } from "@/lib/api/client"
import { NOTICE_STATES, type Animal, type AnimalRequest, type Aviso, type AvisoRequest, type AvisoUpdateRequest, type Comentario, type ComentarioRequest, type CreateUsuarioRequest, type EntityId, type LoginRequest, type LoginResponse, type RestoreResource, type Usuario, type UpdateUsuarioRequest } from "@/lib/types"

export const API_PATHS = {
  login: "/api/Auth/login",
  users: "/api/Usuario",
  animals: "/api/Animal",
  notices: "/api/Aviso",
  comments: "/api/Comentario",
} as const

const entityIdSchema = z.union([z.number().int(), z.string().min(1)])

function withIdAlias(raw: unknown, targetKey: string, dateKey?: string): unknown {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const record = { ...(raw as Record<string, unknown>) }
    if (record[targetKey] === undefined && record.id !== undefined) {
      record[targetKey] = record.id
    }
    if (dateKey && record.fecha !== undefined) {
      if (record.fechaCreacion === undefined) {
        record.fechaCreacion = record.fecha
      }
      if (record.createdAt === undefined) {
        record.createdAt = record.fecha
      }
    }
    return record
  }
  return raw
}

const userSummarySchema = z.preprocess(
  (val) => withIdAlias(val, "idUsuario"),
  z.object({
    idUsuario: entityIdSchema.optional(),
    nombre: z.string().optional(),
    correo: z.string().optional(),
    telefono: z.string().nullish(),
    rol: z.string().nullish(),
  }),
)

const animalSummarySchema = z.preprocess(
  (val) => withIdAlias(val, "idAnimal"),
  z.object({
    idAnimal: entityIdSchema,
    nombre: z.string(),
    foto: z.string().nullish().transform((value) => value ?? null),
    comentario: z.string().nullish(),
    idUsuario: entityIdSchema.optional(),
    usuario: userSummarySchema.nullish(),
  }),
)

const usuarioSchema = z.preprocess(
  (val) => withIdAlias(val, "idUsuario"),
  z.object({
    idUsuario: entityIdSchema,
    nombre: z.string(),
    correo: z.string(),
    telefono: z.string().nullable(),
    rol: z.string().nullish(),
  }),
)

const animalSchema = animalSummarySchema

const avisoSummarySchema = z.preprocess(
  (val) => withIdAlias(val, "idAviso", "fecha"),
  z.object({
    idAviso: entityIdSchema,
    idAnimal: entityIdSchema,
    estado: z.enum(NOTICE_STATES),
    ultimaUbicacionVista: z.string(),
  }),
)

const avisoSchema = z.preprocess(
  (val) => withIdAlias(val, "idAviso", "fecha"),
  z.object({
    idAviso: entityIdSchema,
    idAnimal: entityIdSchema,
    estado: z.enum(NOTICE_STATES),
    ultimaUbicacionVista: z.string(),
    comentario: z.string().nullish(),
    idUsuario: entityIdSchema.optional(),
    usuario: userSummarySchema.nullish(),
    animal: animalSummarySchema.nullish(),
    fechaCreacion: z.string().nullish(),
    createdAt: z.string().nullish(),
  }),
)

const comentarioSchema = z.preprocess(
  (val) => withIdAlias(val, "idComentario", "fecha"),
  z.object({
    idComentario: entityIdSchema,
    idAviso: entityIdSchema,
    idUsuario: entityIdSchema.optional(),
    texto: z.string(),
    usuario: userSummarySchema.nullish(),
    aviso: avisoSummarySchema.nullish(),
    fechaCreacion: z.string().nullish(),
    createdAt: z.string().nullish(),
  }),
)

const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.string().min(1),
  expiresAt: z.string().min(1),
})

function contractError(resource: string, detail: string) {
  return new ApiError(
    `La respuesta de ${resource} no coincide con el contrato esperado (${detail}). Revisa la versión de la API.`,
    502,
  )
}

function parseList<T>(payload: unknown, property: string, schema: z.ZodType<T>, resource: string): T[] {
  if (!payload || typeof payload !== "object" || !(property in payload)) {
    throw contractError(resource, `falta la lista "${property}"`)
  }

  const rows = (payload as Record<string, unknown>)[property]
  if (!Array.isArray(rows)) throw contractError(resource, `"${property}" no es una lista`)

  const parsed = z.array(schema).safeParse(rows)
  if (!parsed.success) throw contractError(resource, "uno o más elementos tienen campos incompatibles")
  return parsed.data
}

function parseOne<T>(payload: unknown, schema: z.ZodType<T>, resource: string): T {
  const parsed = schema.safeParse(payload)
  if (!parsed.success) throw contractError(resource, "faltan campos requeridos o sus tipos no coinciden")
  return parsed.data
}

function idPath(base: string, id: EntityId) {
  return `${base}/${encodeURIComponent(String(id))}`
}

export async function loginUser(body: LoginRequest): Promise<LoginResponse> {
  const payload = await apiRequest<unknown>(API_PATHS.login, {
    method: "POST",
    body,
    auth: false,
  })
  return parseOne(payload, loginResponseSchema, "inicio de sesión")
}

export async function createUsuario(body: CreateUsuarioRequest): Promise<void> {
  await apiRequest<unknown>(API_PATHS.users, { method: "POST", body, auth: false })
}

export async function getUsuarios(): Promise<Usuario[]> {
  const payload = await apiRequest<unknown>(API_PATHS.users)
  return parseList(payload, "usuarioList", usuarioSchema, "usuarios")
}

export async function getUsuario(id: EntityId): Promise<Usuario> {
  const payload = await apiRequest<unknown>(idPath(API_PATHS.users, id))
  return parseOne(payload, usuarioSchema, "usuario")
}

export async function updateUsuario(id: EntityId, body: UpdateUsuarioRequest): Promise<void> {
  await apiRequest<unknown>(idPath(API_PATHS.users, id), { method: "PUT", body })
}

export async function getAnimales(): Promise<Animal[]> {
  const payload = await apiRequest<unknown>(API_PATHS.animals)
  return parseList(payload, "animalList", animalSchema, "mascotas")
}

export async function getAnimal(id: EntityId): Promise<Animal> {
  const payload = await apiRequest<unknown>(idPath(API_PATHS.animals, id))
  return parseOne(payload, animalSchema, "mascota")
}

export async function createAnimal(body: AnimalRequest): Promise<void> {
  await apiRequest<unknown>(API_PATHS.animals, { method: "POST", body })
}

export async function updateAnimal(id: EntityId, body: AnimalRequest): Promise<void> {
  await apiRequest<unknown>(idPath(API_PATHS.animals, id), { method: "PUT", body })
}

export async function deleteAnimal(id: EntityId): Promise<void> {
  await apiRequest<unknown>(idPath(API_PATHS.animals, id), { method: "DELETE" })
}

export async function getAvisos(): Promise<Aviso[]> {
  const payload = await apiRequest<unknown>(API_PATHS.notices)
  return parseList(payload, "avisoList", avisoSchema, "avisos")
}

export async function getAviso(id: EntityId): Promise<Aviso> {
  const payload = await apiRequest<unknown>(idPath(API_PATHS.notices, id))
  return parseOne(payload, avisoSchema, "aviso")
}

export async function createAviso(body: AvisoRequest): Promise<void> {
  await apiRequest<unknown>(API_PATHS.notices, { method: "POST", body })
}

export async function updateAviso(id: EntityId, body: AvisoUpdateRequest): Promise<void> {
  await apiRequest<unknown>(idPath(API_PATHS.notices, id), { method: "PUT", body })
}

export async function deleteAviso(id: EntityId): Promise<void> {
  await apiRequest<unknown>(idPath(API_PATHS.notices, id), { method: "DELETE" })
}

export async function getComentarios(): Promise<Comentario[]> {
  const payload = await apiRequest<unknown>(API_PATHS.comments)
  return parseList(payload, "comentarioList", comentarioSchema, "comentarios")
}

export async function createComentario(body: ComentarioRequest): Promise<void> {
  await apiRequest<unknown>(API_PATHS.comments, { method: "POST", body })
}

export async function updateComentario(id: EntityId, body: ComentarioRequest): Promise<void> {
  await apiRequest<unknown>(idPath(API_PATHS.comments, id), { method: "PUT", body })
}

export async function deleteComentario(id: EntityId): Promise<void> {
  await apiRequest<unknown>(idPath(API_PATHS.comments, id), { method: "DELETE" })
}

export async function restoreResource(resource: RestoreResource, id: EntityId): Promise<void> {
  await apiRequest<unknown>(`${idPath(`/api/${resource}`, id)}/restore`, { method: "PATCH" })
}
