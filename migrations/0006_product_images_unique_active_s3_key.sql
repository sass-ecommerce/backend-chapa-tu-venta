-- ==============================================================================
-- 0006_product_images_unique_active_s3_key.sql
--
-- Una misma foto (s3_key) solo puede estar registrada una vez mientras esté
-- activa. Si la app reintenta un registro (o llegan dos a la vez), con este
-- índice el segundo falla y el backend devuelve la imagen existente en lugar
-- de duplicarla.
-- ==============================================================================

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_images_s3_key_active
    ON product_images(s3_key)
    WHERE deleted_at IS NULL;

COMMIT;
