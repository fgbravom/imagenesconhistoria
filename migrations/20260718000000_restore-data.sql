-- Restauracion de datos desde imagenehistoria_20260601_021003.sql.gz
-- Solo datos del schema public. Los schemas internos de InsForge
-- (auth, storage, system, payments) NO se tocan: son propios del proyecto nuevo.

-- Deportes: la migracion 20260423005545 ya los siembra, pero con UUID aleatorios.
-- Aqui se realinean a los UUID originales del respaldo para que las FK de photos
-- calcen. Solo es seguro porque photos aun esta vacia: sports.id no tiene
-- ON UPDATE CASCADE, asi que cambiar el id con fotos ya cargadas fallaria.
INSERT INTO sports (id, name, slug, created_at) VALUES
  ('dc29c846-5d25-46d9-8f7c-7fca72e3f436', 'Fútbol', 'futbol', '2026-04-23 00:56:21.148844+00'),
  ('38095755-f0a7-453c-9bdf-286cf3520ab6', 'Tenis', 'tenis', '2026-04-23 00:56:21.148844+00'),
  ('34aed4fd-5d14-47e2-b568-fc193534f435', 'Boxeo', 'boxeo', '2026-04-23 00:56:21.148844+00'),
  ('ff4454d6-b3e8-4bcb-9703-27c1a111fbeb', 'Atletismo', 'atletismo', '2026-04-23 00:56:21.148844+00'),
  ('6ce862ff-b5e8-4754-be02-6df6fba1fb5b', 'Ciclismo', 'ciclismo', '2026-04-23 00:56:21.148844+00'),
  ('e2489de3-100b-4c54-afb6-1cb44d6bccd2', 'Natación', 'natacion', '2026-04-23 00:56:21.148844+00'),
  ('055b0842-1f68-45a3-9276-d9f1526c4b7f', 'Esquí', 'esqui', '2026-04-23 00:56:21.148844+00'),
  ('3ccd8ffe-9385-4b58-90ff-5d7c33c0f907', 'Basquetbol', 'basquetbol', '2026-04-23 00:56:21.148844+00'),
  ('d0fbc5d2-53b0-4d35-b6cb-43abdddff158', 'Voleibol', 'voleibol', '2026-04-23 00:56:21.148844+00'),
  ('7078a11b-9ddf-44e1-b5d4-966d49ba6314', 'Otro', 'otro', '2026-04-23 00:56:21.148844+00')
ON CONFLICT (slug) DO UPDATE SET
  id         = EXCLUDED.id,
  name       = EXCLUDED.name,
  created_at = EXCLUDED.created_at;

-- Fotografias: se conservan textos y UUID originales.
-- image_url apunta a un placeholder porque los binarios NO venian en el dump
-- y el host antiguo (fmzdk5fj) responde 503. image_key queda vacio a proposito:
-- marca que no hay archivo en storage todavia.
INSERT INTO photos (id, title, story, sport_id, year, athlete_name, photographer, location, image_url, image_key, featured, created_at) VALUES
  ('fcaa32f7-783a-4718-af5e-4daf30d185de', 'Cristiano Ronaldo & Matías Fernández por Champions League 2008', 'Encuentro entre el Manchester United vs Villareal, disputado en Old Traford, valido por el primer partido de la fase de grupos de ese año donde el United quiere defender el titulo obtenido el 2007.', 'dc29c846-5d25-46d9-8f7c-7fca72e3f436', '2008', 'Cristiano Ronald, Matías Fernández ', 'David Ashdown / Getty Images', 'Manchester, Inglaterra.', '/placeholder.svg', '', 'f', '2026-04-23 01:24:29.797781+00'),
  ('8cc683df-5727-4786-b0ef-dff359ca1807', 'Zamorano y Maradona', 'fecha 5', 'dc29c846-5d25-46d9-8f7c-7fca72e3f436', '1993', 'Zamorano, Maradona', '', 'Sevilla, España.', '/placeholder.svg', '', 'f', '2026-04-23 03:01:44.438787+00'),
  ('ef45e178-ee18-4cd4-b5e6-672b1d6c609c', 'Zamorano 1998', 'Prueba de historia', 'dc29c846-5d25-46d9-8f7c-7fca72e3f436', '1998', 'Ivan Zamorano', 'Agencia EFE', 'Francia', '/placeholder.svg', '', 't', '2026-04-23 01:09:40.135283+00'),
  ('743d11c3-0198-4c56-8a80-42f6f741f581', 'Bichi Box', 'oipio', 'dc29c846-5d25-46d9-8f7c-7fca72e3f436', '2007', 'Bichi Borghi', 'Agencia efe', 'Santiago, Chile.', '/placeholder.svg', '', 'f', '2026-04-23 03:06:31.314159+00'),
  ('34b05be1-9da7-4581-a791-984661774a50', 'Carlos Humberto Caszely Garrido', 'Carlos Caszely mirando un Iquique vs Cobreloa en el estadio nacional al borde del terreno de juego, un empate en calama le daba el titulo a Colo Colo.
', 'dc29c846-5d25-46d9-8f7c-7fca72e3f436', '1983', 'Carlos Humberto Caszely Garrido', '', 'Santiago, Chile.', '/placeholder.svg', '', 'f', '2026-04-24 03:49:48.110427+00')
ON CONFLICT (id) DO NOTHING;
