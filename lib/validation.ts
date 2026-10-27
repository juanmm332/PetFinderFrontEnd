import { z } from "zod"
import { NOTICE_STATES } from "@/lib/types"

export const loginSchema = z.object({
  correo: z.string().trim().email("Escribe un correo válido."),
  contraseña: z.string().min(1, "Escribe tu contraseña."),
})

export const registerSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe tu nombre."),
  correo: z.string().trim().email("Escribe un correo válido."),
  telefono: z.string().trim().min(1, "Escribe tu teléfono."),
  contraseña: z.string().min(5, "La contraseña debe tener al menos 5 caracteres."),
})

export const animalWriteSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe el nombre de la mascota."),
  foto: z
    .string()
    .trim()
    .url("Introduce una URL de imagen válida.")
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
      message: "La imagen debe usar una URL http o https.",
    }),
  comentario: z.string().trim(),
})

export const avisoWriteSchema = z.object({
  idAnimal: z.union([z.number().int().positive(), z.string().regex(/^\d+$/, "Elige una mascota válida.")]).refine((value) => Number(value) > 0, "Elige una mascota válida."),
  estado: z.enum(NOTICE_STATES),
  ultimaUbicacionVista: z.string().trim().min(1, "Indica dónde se vio por última vez."),
  comentario: z.string().trim(),
})

export const comentarioWriteSchema = z.object({
  idAviso: z.union([z.number().int().positive(), z.string().min(1)]),
  texto: z.string().trim().min(1, "Escribe un comentario."),
})

export const profileUpdateSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe tu nombre."),
  contraseña: z.string().min(5, "La nueva contraseña debe tener al menos 5 caracteres."),
  correo: z.string().trim().email("Escribe un correo válido."),
  telefono: z.string().trim().min(1, "Escribe tu teléfono."),
})

export const restoreIdSchema = z.string().trim().regex(/^\d+$/, "Introduce un ID numérico.").refine(
  (value) => Number(value) > 0,
  "El ID debe ser mayor que cero.",
)

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type AnimalWriteValues = z.infer<typeof animalWriteSchema>
export type AvisoWriteValues = z.infer<typeof avisoWriteSchema>
export type ComentarioWriteValues = z.infer<typeof comentarioWriteSchema>
export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>
