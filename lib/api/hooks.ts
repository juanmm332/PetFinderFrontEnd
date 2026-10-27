"use client"

import { useCallback } from "react"
import useSWR, { useSWRConfig } from "swr"
import { useSession } from "@/lib/auth/session-context"
import {
  API_PATHS,
  getAnimal,
  getAnimales,
  getAviso,
  getAvisos,
  getComentarios,
  getUsuario,
} from "@/lib/api/resources"
import type { EntityId } from "@/lib/types"

const swrOptions = {
  revalidateOnFocus: true,
  dedupingInterval: 10_000,
}

export function useAnimales() {
  const { session } = useSession()
  return useSWR(
    session ? ([API_PATHS.animals, session.accessToken] as const) : null,
    () => getAnimales(),
    swrOptions,
  )
}

export function useAnimal(id: EntityId | null | undefined) {
  const { session } = useSession()
  const key = session && id !== null && id !== undefined
    ? ([`${API_PATHS.animals}/${encodeURIComponent(String(id))}`, session.accessToken] as const)
    : null
  return useSWR(key, () => getAnimal(id as EntityId), swrOptions)
}

export function useAvisos() {
  const { session } = useSession()
  return useSWR(
    session ? ([API_PATHS.notices, session.accessToken] as const) : null,
    () => getAvisos(),
    swrOptions,
  )
}

export function useAviso(id: EntityId | null | undefined) {
  const { session } = useSession()
  const key = session && id !== null && id !== undefined
    ? ([`${API_PATHS.notices}/${encodeURIComponent(String(id))}`, session.accessToken] as const)
    : null
  return useSWR(key, () => getAviso(id as EntityId), swrOptions)
}

export function useComentarios() {
  const { session } = useSession()
  return useSWR(
    session ? ([API_PATHS.comments, session.accessToken] as const) : null,
    () => getComentarios(),
    swrOptions,
  )
}

export function useUsuario(id: EntityId | null | undefined) {
  const { session } = useSession()
  const key = session && id !== null && id !== undefined
    ? ([`${API_PATHS.users}/${encodeURIComponent(String(id))}`, session.accessToken] as const)
    : null
  return useSWR(key, () => getUsuario(id as EntityId), swrOptions)
}

export function useRefreshResources() {
  const { mutate } = useSWRConfig()
  return useCallback(
    (routes: string[]) =>
      mutate((key) => {
        if (!Array.isArray(key) || typeof key[0] !== "string") return false
        return routes.some((route) => key[0] === route || key[0].startsWith(`${route}/`))
      }),
    [mutate],
  )
}
