# Reactivación tras pausa del proyecto InsForge

Cuando el proyecto InsForge se pausa y se vuelve a activar, PostgREST tarda en reinicializar su cache de tablas. Durante ese período muestra `0 Relations` y el API no expone `photos` ni `sports`, por lo que el sitio no carga imágenes ni deportes.

## Síntoma

- El sitio en producción no muestra imágenes.
- La galería aparece vacía aunque los datos existen en la base de datos.

## Causa

PostgREST arranca pero no carga las relaciones del schema `public`. Los logs muestran:

```
Schema cache loaded 0 Relations, 0 Relationships, 21 Functions
```

## Solución

Forzar un reload del schema cache de PostgREST:

```bash
npx @insforge/cli db query "NOTIFY pgrst, 'reload schema';"
```

Después de ejecutarlo, el sitio vuelve a funcionar en segundos sin necesidad de redesplegar.

## Verificación

Para confirmar que PostgREST cargó las tablas correctamente:

```bash
npx @insforge/cli logs postgREST.logs --limit 5
```

La línea de éxito debe decir algo como:

```
Schema cache loaded 2 Relations, 1 Relationships, 21 Functions
```
