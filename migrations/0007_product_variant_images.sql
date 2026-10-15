-- ==============================================================================
-- 0007_product_variant_images.sql
--
-- Fotos de cada variante, separadas de product_images: cada variante tiene su
-- propia portada y su propio orden. product_id se guarda junto a variant_id
-- para validar la key de S3 ({tenant}/products/{productId}/variants/{variantId}/…)
-- y listar las fotos de un producto sin joins.
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS product_variant_images (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL,
    product_id  UUID         NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id  UUID         NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    s3_key      VARCHAR(500) NOT NULL,
    url         VARCHAR(1000),
    is_primary  BOOLEAN      NOT NULL DEFAULT false,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_variant_images_variant
    ON product_variant_images(variant_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_variant_images_tenant
    ON product_variant_images(tenant_id)
    WHERE deleted_at IS NULL;

-- Una misma foto solo puede estar registrada una vez mientras esté activa.
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variant_images_s3_key_active
    ON product_variant_images(s3_key)
    WHERE deleted_at IS NULL;

COMMIT;
