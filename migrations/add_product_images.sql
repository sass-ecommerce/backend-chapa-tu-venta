CREATE TABLE product_images (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID         NOT NULL,
  product_id  UUID         NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  s3_key      VARCHAR(500) NOT NULL,
  is_primary  BOOLEAN      NOT NULL DEFAULT false,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ,
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_product_images_product
  ON product_images(product_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_product_images_tenant
  ON product_images(tenant_id) WHERE deleted_at IS NULL;

-- Solo una imagen primaria por producto
CREATE UNIQUE INDEX idx_product_images_primary_product
  ON product_images(product_id)
  WHERE is_primary = true AND deleted_at IS NULL;
