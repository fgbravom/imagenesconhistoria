-- Cola de fotos pre-cargadas para la automatización de publicación semanal.
-- El dueño del sitio sube fotos reales (con derechos verificados) directamente
-- al bucket de storage `photos` existente y llena esta tabla en lotes; una
-- Schedule de InsForge llama a publish_next_queued_photo() una vez por semana
-- para "publicar" (mover a la tabla pública `photos`) la fila pendiente más
-- antigua. Ver docs/reactivacion-tras-pausa.md para el motivo de la automatización.

CREATE TABLE photo_queue (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  story               text NOT NULL,
  sport_id            uuid REFERENCES sports(id) ON DELETE SET NULL,
  year                integer CHECK (year BETWEEN 1900 AND 2100),
  athlete_name        text,
  photographer        text,
  location            text,
  image_url           text NOT NULL,
  image_key           text NOT NULL,
  queue_order         integer,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'skipped')),
  published_at        timestamptz,
  published_photo_id  uuid REFERENCES photos(id) ON DELETE SET NULL,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE photo_queue ENABLE ROW LEVEL SECURITY;

-- Sin política de SELECT público: la cola es solo para el admin, a diferencia de `photos`.
CREATE POLICY "admin_select_photo_queue"
  ON photo_queue FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_insert_photo_queue"
  ON photo_queue FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_photo_queue"
  ON photo_queue FOR UPDATE TO authenticated USING (true);

CREATE POLICY "admin_delete_photo_queue"
  ON photo_queue FOR DELETE TO authenticated USING (true);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON photo_queue TO authenticated;

CREATE INDEX idx_photo_queue_status_order ON photo_queue (status, queue_order, created_at);

-- Publica atómicamente la fila pendiente más antigua de la cola: la copia a
-- `photos` y marca la fila de la cola como publicada. SECURITY DEFINER para
-- que tanto el botón "Publicar ahora" del panel admin (rol authenticated)
-- como la Schedule semanal (rol project_admin, vía API_KEY) puedan invocarla
-- con el mismo resultado. FOR UPDATE SKIP LOCKED evita doble publicación si
-- dos ejecuciones se solapan.
CREATE OR REPLACE FUNCTION publish_next_queued_photo()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  q public.photo_queue%ROWTYPE;
  new_id uuid;
BEGIN
  SELECT * INTO q FROM public.photo_queue
    WHERE status = 'pending'
    ORDER BY queue_order NULLS LAST, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.photos
    (title, story, sport_id, year, athlete_name, photographer, location, image_url, image_key, featured)
    VALUES
    (q.title, q.story, q.sport_id, q.year, q.athlete_name, q.photographer, q.location, q.image_url, q.image_key, false)
    RETURNING id INTO new_id;

  UPDATE public.photo_queue
    SET status = 'published', published_at = now(), published_photo_id = new_id
    WHERE id = q.id;

  RETURN new_id;
END;
$$;

-- Solo `authenticated` puede invocar la función (el botón "Publicar ahora" del
-- admin); un visitante anónimo con la anon key pública no debe poder forzar
-- publicaciones fuera de horario llamando el RPC directamente.
REVOKE EXECUTE ON FUNCTION publish_next_queued_photo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION publish_next_queued_photo() TO authenticated;
