export type EntityId = number | string

export const NOTICE_STATES = ["Activo", "Encontrado", "Cerrado"] as const
export type NoticeState = (typeof NOTICE_STATES)[number]

export interface UsuarioSummary {
  idUsuario?: EntityId
  nombre?: string
  correo?: string
  telefono?: string | null
  rol?: string | null
}

export interface Usuario extends UsuarioSummary {
  idUsuario: EntityId
  nombre: string
  correo: string
  telefono: string | null
}

export interface AnimalSummary {
  idAnimal: EntityId
  nombre: string
  foto?: string | null
  comentario?: string | null
  idUsuario?: EntityId
  usuario?: UsuarioSummary | null
}

export interface Animal extends AnimalSummary {
  foto: string | null
}

export interface AvisoSummary {
  idAviso: EntityId
  idAnimal: EntityId
  estado: NoticeState
  ultimaUbicacionVista: string
}

export interface Aviso extends AvisoSummary {
  comentario?: string | null
  idUsuario?: EntityId
  usuario?: UsuarioSummary | null
  animal?: AnimalSummary | null
  fechaCreacion?: string | null
  createdAt?: string | null
}

export interface Comentario {
  idComentario: EntityId
  idAviso: EntityId
  idUsuario?: EntityId
  texto: string
  usuario?: UsuarioSummary | null
  aviso?: AvisoSummary | null
  fechaCreacion?: string | null
  createdAt?: string | null
}

export interface LoginRequest {
  correo: string
  contraseña: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresAt: string
}

export interface CreateUsuarioRequest {
  nombre: string
  contraseña: string
  correo: string
  telefono: string
}

export type UpdateUsuarioRequest = CreateUsuarioRequest

export interface AnimalRequest {
  nombre: string
  foto: string
  comentario: string
}

export interface AvisoRequest {
  idAnimal: EntityId
  estado: NoticeState
  ultimaUbicacionVista: string
  comentario: string
}

export interface ComentarioRequest {
  idAviso: EntityId
  texto: string
}

export type RestoreResource = "Usuario" | "Animal" | "Aviso" | "Comentario"
