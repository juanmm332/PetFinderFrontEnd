import { API_BASE_URL } from "@/lib/api/client"
import type { Animal, AnimalSummary, Aviso, EntityId, NoticeState } from "@/lib/types"

export function sameId(left: EntityId | null | undefined, right: EntityId | null | undefined) {
  return left !== null && left !== undefined && right !== null && right !== undefined
    && String(left) === String(right)
}

export function getAnimalOwnerId(animal: Pick<AnimalSummary, "idUsuario" | "usuario">) {
  return animal.idUsuario ?? animal.usuario?.idUsuario ?? null
}

export function getNoticeOwnerId(notice: Aviso, animal?: AnimalSummary | null) {
  return notice.idUsuario ?? notice.usuario?.idUsuario ?? animal?.idUsuario ?? animal?.usuario?.idUsuario ?? null
}

export function isAnimalOwner(animal: AnimalSummary, userId: EntityId | null | undefined) {
  return sameId(getAnimalOwnerId(animal), userId)
}

export function isNoticeOwner(
  notice: Aviso,
  animal: AnimalSummary | null | undefined,
  userId: EntityId | null | undefined,
) {
  return sameId(getNoticeOwnerId(notice, animal), userId)
}

export function getSafeImageUrl(value?: string | null) {
  if (!value?.trim()) return null

  try {
    const resolved = new URL(value.trim(), `${API_BASE_URL}/`)
    return ["https:", "http:"].includes(resolved.protocol) ? resolved.toString() : null
  } catch {
    return null
  }
}

export function noticeStateVariant(state: NoticeState) {
  if (state === "Activo") return "default" as const
  if (state === "Encontrado") return "secondary" as const
  return "outline" as const
}

export function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(date)
}

export function getCreatedDate(value: { fechaCreacion?: string | null; createdAt?: string | null }) {
  return formatDate(value.fechaCreacion ?? value.createdAt)
}

export function initials(value?: string | null) {
  const words = value?.trim().split(/\s+/).filter(Boolean) ?? []
  if (words.length === 0) return "PF"
  return words.slice(0, 2).map((word) => word[0]?.toLocaleUpperCase("es") ?? "").join("")
}

export function getAnimalForNotice(notice: Aviso, animals: Animal[] | undefined) {
  return animals?.find((animal) => sameId(animal.idAnimal, notice.idAnimal)) ?? notice.animal ?? null
}
