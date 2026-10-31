# Imágenes con Historia — Estructura del Proyecto

Galería personal de fotografías elegidas por su autor, cada una con su historia. Cada foto tiene título, historia narrativa y, opcionalmente, año, lugar y fotógrafo. (Las columnas `sport_id` y `athlete_name` siguen en la BD por las fotos antiguas, pero la UI ya no las pide ni las muestra.)

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

### `photo_queue`
Fotos cargadas por adelantado para la publicación automática semanal. Mismas columnas de contenido que `photos` más:

| Columna | Tipo | Notas |
|---|---|---|
| queue_order | integer | Orden manual; menor se publica antes, `NULL` = por `created_at` |
| status | text | `pending` / `published` / `skipped` |
| published_at | timestamptz | Momento en que se publicó |
| published_photo_id | uuid FK → photos | ON DELETE SET NULL |

`publish_next_queued_photo()` (RPC, `SECURITY DEFINER`) copia la pendiente siguiente a `photos` y la marca como publicada. La llama una Schedule semanal de InsForge y el botón "Publicar la siguiente ahora" del admin.

### RLS
- `SELECT` público en `sports` y `photos`; `photo_queue` solo para autenticados
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
- Las rutas `/admin/*` redirigen a `/login` si no hay sesión (lo hace `AdminLayout`)

---

## Rutas

| Ruta | Página | Notas |
|---|---|---|
| `/` | `Home` | Hero + galería con scroll infinito |
| `/foto/:id` | `PhotoDetail` | Detalle + historia completa |
| `/login` | `Login` | Solo email/password |
| `/admin` | `admin/Overview` | Resumen. Protegida, requiere auth |
| `/admin/fotos` | `admin/Photos` | Lista, búsqueda, edición, portada, borrado |
| `/admin/publicar` | `admin/Publish` | Publicar ahora o agregar a la cola |
| `/admin/cola` | `admin/Queue` | Cola pendiente e historial de publicadas |

Las rutas públicas comparten `PublicLayout` (Navbar + `Outlet`, en `App.jsx`); las de admin usan `AdminLayout`, sin el Navbar público.

---

## Estructura de archivos

```
src/
├── lib/
│   ├── insforge.js        # cliente InsForge
│   ├── AuthContext.jsx    # contexto de auth global
│   ├── photoRecords.js    # subir/borrar imágenes y actualizar/borrar filas con su archivo
│   └── useStatus.js       # estado de StatusBanner
├── components/
│   ├── Navbar.jsx         # sticky transparente, links condicionales por auth
│   ├── PhotoCard.jsx      # card de galería (grayscale → color on hover)
│   └── admin/
│       ├── AdminLayout.jsx  # drawer lateral + guard de auth + Outlet
│       ├── PhotoForm.jsx    # formulario de foto (publicar y edición inline)
│       └── ui.jsx           # PageHeader, StatusBanner, Field, ListSkeleton
├── pages/
│   ├── Home.jsx           # hero + galería
│   ├── PhotoDetail.jsx    # vista detalle
│   ├── Login.jsx          # formulario login
│   └── admin/
│       ├── Overview.jsx   # resumen
│       ├── Photos.jsx     # fotografías publicadas
│       ├── Publish.jsx    # publicar / agregar a la cola
│       └── Queue.jsx      # cola
├── App.jsx                # router + AuthProvider + PublicLayout
├── main.jsx               # punto de entrada
└── index.css              # estilos globales (incluye .input-field)

migrations/
├── 20260423005545_create-sports-and-photos.sql
├── 20260718000000_restore-data.sql
└── 20260720210813_create-photo-queue.sql

docs/
└── project-structure.md   # este archivo
```

---

## Páginas en detalle

### `Home`
- **Hero:** imagen de la foto con `featured=true` de fondo (blanco y negro, opacidad 30%). Si no hay ninguna, gradiente radial oscuro.
- **Galería:** masonry 2→3→4 cols, ordenada por `created_at` desc. Carga 30 fotos (`PAGE_SIZE = 30`) y las siguientes 30 automáticamente al acercarse al final (`IntersectionObserver` sobre un sentinel bajo la grilla). Sin filtros.

### `PhotoDetail`
- Layout 2 columnas en desktop: imagen sticky a la izquierda, historia a la derecha.
- Botón "Eliminar" visible solo si hay usuario autenticado.
- Borrado: primero storage (`insforge.storage.from('photos').remove([image_key])`), luego DB.

### Admin
Layout con drawer a la izquierda (`AdminLayout`): fijo en desktop (`lg+`), off-canvas en móvil con botón hamburguesa, overlay y cierre con Esc. Muestra el conteo de la cola pendiente, el email del usuario, "Ver sitio" y "Cerrar sesión".

1. **Resumen** — conteo de publicadas y en cola, portada actual, próxima en publicarse y última publicada.
2. **Fotografías** — lista con búsqueda (título, lugar, fotógrafo, año, filtrado en cliente). Portada: se marca la nueva y luego se desmarcan las demás, para no quedar nunca sin portada. Edición inline con `PhotoForm`. Al reemplazar o borrar, el archivo de storage se toca solo después de que la fila quedó guardada o borrada.
3. **Publicar** — toggle "Publicar ahora" (insert en `photos`) / "Agregar a la cola" (insert en `photo_queue`). Si el insert falla, se borra la imagen recién subida.
4. **Cola** — pestañas Pendientes (orden manual, editar, quitar, "Publicar la siguiente ahora") y Publicadas (historial con link a la foto).

Cada vista carga sus datos al montarse. Las vistas que cambian la cola disparan `CustomEvent('queue-updated')` para refrescar el conteo del drawer.

---

## Estilos

- **Fondo:** `stone-950` (casi negro)
- **Color de acento:** `brand-red` (rojo, definido en Tailwind config)
- **Tipografía:** `font-serif` para títulos, `font-sans` para cuerpo y UI
- **Clase reutilizable:** `.input-field` definida en `index.css` — input/select/textarea con estilo dark consistente
- **Patrón de imágenes:** grayscale por defecto, color al hover (cards de la galería y del resumen del admin)

---

## Deploy

- **Plataforma:** Vercel
- **`vercel.json`:** rewrite `/(.*) → /index.html` para que React Router funcione en todas las rutas
- **`.env` está en `.gitignore`** — las vars se configuran manualmente en Vercel Dashboard
- **Build:** `npm run build` → salida en `dist/`
