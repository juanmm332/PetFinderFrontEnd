# PetFinder

Frontend en Next.js para gestionar mascotas, avisos y comentarios mediante la API de PetFinder. No incluye datos de demostración: las listas y acciones reflejan únicamente las respuestas del servicio.

## Configurar la API

Configura `NEXT_PUBLIC_API_BASE_URL` con el origen HTTP(S) del backend, sin añadir `/api` al final. Por ejemplo:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5183
```

Puedes copiar `.env.example` a `.env.local` para desarrollo local y arrancar la API con el perfil `http` de `PresentationLayer/Properties/launchSettings.json`. El perfil `https` escucha en `https://localhost:7197`; si lo usas, configura esa URL en `NEXT_PUBLIC_API_BASE_URL`. En Vercel, define la URL pública de la API como variable de entorno. El frontend usa `http://localhost:5183` si la variable no está definida.

La API debe aceptar peticiones CORS desde el origen del frontend. Todas las rutas protegidas envían `Authorization: Bearer <accessToken>`; el token se mantiene en `sessionStorage` y se elimina al cerrar sesión o recibir un `401`.

## Iniciar el frontend

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:3000`. Para compilar y servir la versión de producción:

```bash
pnpm build
pnpm start
```

## Rutas principales

- `/` — presentación y acceso al listado autenticado.
- `/login` y `/registro` — inicio de sesión y creación de cuenta.
- `/inicio` — resumen y avisos de la comunidad.
- `/mascotas` y `/mascotas/:id` — listado, ficha y operaciones de mascotas propias.
- `/avisos` y `/avisos/:id` — avisos, comentarios y operaciones de autoría.
- `/mis-publicaciones` — mascotas, avisos y comentarios del usuario autenticado.
- `/perfil` — consulta y edición del perfil.
- `/administracion` — restauración por ID, visible solo si el token indica rol administrador.

## Contrato y permisos

Los estados admitidos para un aviso son `Activo`, `Encontrado` y `Cerrado`. Las listas se leen desde `usuarioList`, `animalList`, `avisoList` y `comentarioList`. La restauración usa los endpoints `PATCH /api/{recurso}/{id}/restore`; la API no ofrece un listado de eliminados, por lo que la interfaz solicita un ID en lugar de mostrar registros inventados.

Las restricciones de propiedad y rol de la interfaz son solo una ayuda de experiencia de usuario. La API debe seguir aplicando la autorización definitiva en cada endpoint.
