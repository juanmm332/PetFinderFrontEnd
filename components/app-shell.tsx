"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import {
  Heart,
  House,
  LogOut,
  Menu,
  PawPrint,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/utils/petfinder"
import { useSession } from "@/lib/auth/session-context"

const navigation = [
  { href: "/inicio", label: "Inicio", icon: House },
  { href: "/mascotas", label: "Mascotas", icon: PawPrint },
  { href: "/avisos", label: "Avisos", icon: Heart },
  { href: "/mis-publicaciones", label: "Mis publicaciones", icon: UsersRound },
  { href: "/perfil", label: "Perfil", icon: UserRound },
] as const

function activeLink(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Brand() {
  return (
    <Link href="/inicio" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-foreground/12 text-primary-foreground">
        <PawPrint aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-semibold tracking-tight">PetFinder</span>
        <span className="text-xs text-primary-foreground/65">Comunidad que reúne</span>
      </span>
    </Link>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { session } = useSession()
  const items = session?.isAdmin
    ? [...navigation, { href: "/administracion", label: "Administración", icon: ShieldCheck }]
    : navigation

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = activeLink(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-foreground text-primary shadow-sm"
                : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function AccountFooter() {
  const { session, signOut } = useSession()
  const displayName = session?.name || session?.email || "Mi cuenta"

  return (
    <div className="flex items-center gap-3 border-t border-primary-foreground/15 pt-4">
      <Avatar className="size-9 border border-primary-foreground/15">
        <AvatarFallback className="bg-primary-foreground/10 text-xs text-primary-foreground">
          {initials(session?.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="truncate text-xs text-primary-foreground/60">
          {session?.isAdmin ? "Administrador" : session?.email || "Cuenta personal"}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={signOut}
        aria-label="Cerrar sesión"
        className="text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
      >
        <LogOut aria-hidden="true" />
        <span className="sr-only lg:not-sr-only">Cerrar sesión</span>
      </Button>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-8 p-5">
      <Brand />
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-4">
        <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Heart aria-hidden="true" className="size-4" />
            <span>Un encuentro cambia todo</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-primary-foreground/65">
            Comparte información clara y ayuda a que cada mascota vuelva a casa.
          </p>
        </div>
        <AccountFooter />
      </div>
    </div>
  )
}

function pageTitle(pathname: string) {
  const item = navigation.find(({ href }) => activeLink(pathname, href))
  if (pathname.startsWith("/administracion")) return "Administración"
  if (pathname.startsWith("/avisos/")) return "Detalle del aviso"
  if (pathname.startsWith("/mascotas/")) return "Ficha de mascota"
  return item?.label ?? "PetFinder"
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { session, signOut } = useSession()

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-primary text-primary-foreground lg:block">
        <SidebarContent />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur-sm sm:px-6 lg:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Abrir navegación" />}>
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(20rem,85vw)] border-0 bg-primary p-0 text-primary-foreground">
              <SheetHeader className="sr-only">
                <SheetTitle>Menú de navegación</SheetTitle>
                <SheetDescription>Accesos principales de PetFinder.</SheetDescription>
              </SheetHeader>
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link href="/inicio" className="flex items-center gap-2 font-semibold tracking-tight">
            <PawPrint aria-hidden="true" className="size-5 text-primary" />
            PetFinder
          </Link>
          <Button type="button" variant="ghost" size="sm" onClick={signOut} aria-label="Cerrar sesión">
            <LogOut aria-hidden="true" />
            <span>Cerrar sesión</span>
          </Button>
        </header>

        <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-9">
          <div className="mb-6 hidden items-center justify-between lg:flex">
            <p className="text-sm text-muted-foreground">{pageTitle(pathname)}</p>
            {session?.isAdmin ? <Badge variant="secondary">Administrador</Badge> : null}
          </div>
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
