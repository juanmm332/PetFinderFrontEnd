import type { ReactNode } from "react"
import { ProtectedLayout } from "@/components/protected-layout"

export const instant = false

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
