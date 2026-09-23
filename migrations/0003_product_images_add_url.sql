-- ==============================================================================
-- 0003_product_images_add_url.sql
--
-- Guarda la URL pública de CloudFront de cada imagen de producto, resuelta al
-- momento de registrarla. Nullable: las filas existentes se completan luego
-- con un script de backfill.
-- ==============================================================================

BEGIN;

ALTER TABLE product_images ADD COLUMN IF NOT EXISTS url VARCHAR(1000);

COMMIT;
