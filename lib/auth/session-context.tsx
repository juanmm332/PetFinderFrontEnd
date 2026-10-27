"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import {
  clearStoredSession,
  readSession,
  saveSession,
  SESSION_EXPIRED_EVENT,
  type AppSession,
} from "@/lib/auth/token"
import type { LoginResponse } from "@/lib/types"

interface SessionContextValue {
  session: AppSession | null
  isReady: boolean
  startSession: (response: LoginResponse) => AppSession
  signOut: () => void
}

interface SessionSnapshot {
  session: AppSession | null
  isReady: boolean
}

const SessionContext = createContext<SessionContextValue | null>(null)
const serverSnapshot: SessionSnapshot = { session: null, isReady: false }
let sessionSnapshot = serverSnapshot
let hasInitialized = false
const sessionListeners = new Set<() => void>()

function subscribeToSession(listener: () => void) {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

function getSessionSnapshot() {
  return sessionSnapshot
}

function getServerSessionSnapshot() {
  return serverSnapshot
}

function publishSession(nextSnapshot: SessionSnapshot) {
  sessionSnapshot = nextSnapshot
  sessionListeners.forEach((listener) => listener())
}

function initializeSessionStore() {
  if (typeof window === "undefined" || hasInitialized) return
  hasInitialized = true
  publishSession({ session: readSession(), isReady: true })
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { session, isReady } = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  )

  useEffect(() => {
    initializeSessionStore()
  }, [])

  useEffect(() => {
    const handleExpired = () => {
      clearStoredSession()
      hasInitialized = true
      publishSession({ session: null, isReady: true })
      router.replace("/login?expired=1")
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired)
  }, [router])

  const startSession = useCallback((response: LoginResponse) => {
    const nextSession = saveSession(response)
    hasInitialized = true
    publishSession({ session: nextSession, isReady: true })
    return nextSession
  }, [])

  const signOut = useCallback(() => {
    clearStoredSession()
    hasInitialized = true
    publishSession({ session: null, isReady: true })
    router.replace("/")
  }, [router])

  const value = useMemo(
    () => ({ session, isReady, startSession, signOut }),
    [session, isReady, startSession, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error("useSession debe usarse dentro de SessionProvider")
  return context
}
