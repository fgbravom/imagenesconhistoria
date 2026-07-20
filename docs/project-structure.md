# Imágenes con Historia — Estructura del Proyecto

Galería web de fotografías históricas deportivas (chilenas y mundiales). Cada foto tiene título, historia narrativa, atleta, año, lugar, fotógrafo y deporte.

---

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 + Vite 8 |
| Routing | React Router v7 |
| Estilos | TailwindCSS 3.4 |
| Íconos | lucide-react |
| Backend / DB / Auth / Storage | InsForge SDK (`@insforge/sdk`) |
| Deploy | Vercel |

---

## InsForge

- **Project ID:** `d9e4d2ee-e584-4c95-81cc-c9e136c94968`
- **App key:** `fmzdk5fj`
- **Región:** `us-east`
- **OSS host:** `https://fmzdk5fj.us-east.insforge.app`
- **Cliente:** `src/lib/insforge.js` — `createClient({ baseUrl, anonKey })`

### Variables de entorno (`.env`, no commiteado)

```
VITE_INSFORGE_URL=https://fmzdk5fj.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=<jwt anon token>
```

---

## Base de datos

### `sports`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| name | text | Ej: "Fútbol" |
| slug | text UNIQUE | Ej: "futbol" |
| created_at | timestamptz | |

Seed inicial: Fútbol, Tenis, Boxeo, Atletismo, Ciclismo, Natación, Esquí, Basquetbol, Voleibol, Otro.

### `photos`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| title | text | Obligatorio |
| story | text | Narrativa larga, obligatorio |
| sport_id | uuid FK → sports | ON DELETE SET NULL |
| year | integer | CHECK 1900–2100 |
| athlete_name | text | Opcional |
| photographer | text | Opcional |
| location | text | Opcional |
| image_url | text | URL pública del archivo en storage |
| image_key | text | Key en bucket `photos` (para borrar) |
| featured | boolean | Solo una activa como portada del hero |
| created_at | timestamptz | |

**Índices:** `sport_id`, `year`, `featured`, `athlete_name`

### RLS
- `SELECT` público en ambas tablas
- `INSERT / UPDATE / DELETE` solo para usuarios autenticados (admin)

### Storage
- **Bucket:** `photos`
- **Key pattern:** `${Date.now()}-${random}.${ext}`

---

## Autenticación

Email + contraseña via InsForge Auth. Un solo admin.

- `src/lib/AuthContext.jsx` — Context `AuthProvider` + hook `useAuth()`
- Estado: `user` (`undefined` = cargando, `null` = sin sesión, objeto = logueado)
- Métodos: `signIn(email, password)`, `signOut()`
- La ruta `/admin` redirige a `/login` si no hay sesión

---

## Rutas

| Ruta | Página | Notas |
|---|---|---|
| `/` | `Home` | Hero + galería paginada |
| `/foto/:id` | `PhotoDetail` | Detalle + historia completa |
| `/login` | `Login` | Solo email/password |
| `/admin` | `Admin` | Protegida, requiere auth |

---

## Estructura de archivos

```
src/
├── lib/
│   ├── insforge.js        # cliente InsForge
│   └── AuthContext.jsx    # contexto de auth global
├── components/
│   ├── Navbar.jsx         # sticky transparente, links condicionales por auth
│   └── PhotoCard.jsx      # card de galería (grayscale → color on hover)
├── pages/
│   ├── Home.jsx           # hero + galería
│   ├── PhotoDetail.jsx    # vista detalle
│   ├── Login.jsx          # formulario login
│   └── Admin.jsx          # panel admin (3 secciones)
├── App.jsx                # router + AuthProvider
├── main.jsx               # punto de entrada
└── App.css                # estilos globales (incluye .input-field)

migrations/
└── 20260423005545_create-sports-and-photos.sql

docs/
└── project-structure.md   # este archivo
```

---

## Páginas en detalle

### `Home`
- **Hero:** imagen de la foto con `featured=true` de fondo (blanco y negro, opacidad 30%). Si no hay ninguna, gradiente radial oscuro.
- **Galería:** grid 1→2→3→4 cols. Paginación "load more" de 12 en 12 (`PAGE_SIZE = 12`).
- **Filtros:** búsqueda por `athlete_name` (ilike), pills de deporte, pills de década (1940s–2020s).
- **Décadas disponibles:** array `DECADES` hardcodeado en el componente.

### `PhotoDetail`
- Layout 2 columnas en desktop: imagen sticky a la izquierda, historia a la derecha.
- Botón "Eliminar" visible solo si hay usuario autenticado.
- Borrado: primero storage (`insforge.storage.from('photos').remove([image_key])`), luego DB.

### `Admin`
Tres secciones independientes en la misma página:

1. **`FeaturedManager`** — grid de miniaturas para seleccionar foto de portada. La activa tiene borde dorado. Cambio: desmarcar `featured=true` en todas → marcar la nueva.
2. **`PhotoManager`** — lista editable de todas las fotos. Inline `EditForm` expandible por fila. Edita: title, story, sport_id, year, athlete_name, photographer, location.
3. **`UploadForm`** — subida de nueva foto. Drag & drop o click. Flujo: upload a storage → insert en DB. Dispara `CustomEvent('photo-uploaded')` al terminar para que FeaturedManager y PhotoManager se actualicen.

Comunicación entre secciones vía `window.dispatchEvent(new CustomEvent('photo-uploaded' | 'photo-updated'))`.

---

## Estilos

- **Fondo:** `stone-950` (casi negro)
- **Color de acento:** `brand-red` (rojo, definido en Tailwind config)
- **Tipografía:** `font-serif` para títulos, `font-sans` para cuerpo y UI
- **Clase reutilizable:** `.input-field` definida en `App.css` — input/select/textarea con estilo dark consistente
- **Patrón de imágenes:** grayscale por defecto, color al hover (tanto en cards como en FeaturedManager)

---

## Deploy

- **Plataforma:** Vercel
- **`vercel.json`:** rewrite `/(.*) → /index.html` para que React Router funcione en todas las rutas
- **`.env` está en `.gitignore`** — las vars se configuran manualmente en Vercel Dashboard
- **Build:** `npm run build` → salida en `dist/`
