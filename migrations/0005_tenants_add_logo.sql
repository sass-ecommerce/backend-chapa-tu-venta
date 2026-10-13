-- ==============================================================================
-- 0005_tenants_add_logo.sql
--
-- Logo de la tienda: key en S3 y URL pública de CloudFront resuelta al momento
-- de asignarla (mismo patrón que collections.cover_image_key/url). Nullable:
-- no toda tienda tiene logo.
-- ==============================================================================

BEGIN;

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_key VARCHAR(500);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url VARCHAR(1000);

COMMIT;
