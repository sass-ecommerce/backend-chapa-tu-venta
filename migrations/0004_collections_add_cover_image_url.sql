-- ==============================================================================
-- 0004_collections_add_cover_image_url.sql
--
-- Guarda la URL pública de CloudFront de la portada de cada colección, resuelta
-- al momento de asignarla. Nullable: no toda colección tiene portada y las
-- filas existentes se completan luego con un script de backfill.
-- ==============================================================================

BEGIN;

ALTER TABLE collections ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(1000);

COMMIT;
