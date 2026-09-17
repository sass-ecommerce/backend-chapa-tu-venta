-- ==============================================================================
-- 0002_collections.sql
--
-- Agrega el módulo de colecciones: agrupaciones de productos (muchos-a-muchos)
-- gestionadas por el vendedor, independientes de las categorías.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 9. COLLECTIONS
-- ==============================================================================
CREATE TABLE collections (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID         NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name              VARCHAR(255) NOT NULL,
    cover_image_key   VARCHAR(500),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ,
    deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_collections_tenant ON collections(tenant_id) WHERE deleted_at IS NULL;

-- ==============================================================================
-- 10. COLLECTION_PRODUCTS (RELACIÓN N:M ENTRE COLLECTIONS Y PRODUCTS)
--
-- Sin soft delete: la fila representa la asociación en sí, no una entidad de
-- negocio con historial — quitar un producto de una colección borra la fila.
-- ==============================================================================
CREATE TABLE collection_products (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL,
    collection_id UUID        NOT NULL REFERENCES collections(id) ON DELETE RESTRICT,
    product_id    UUID        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collection_products_collection ON collection_products(collection_id);
CREATE INDEX idx_collection_products_product ON collection_products(product_id);
CREATE INDEX idx_collection_products_tenant ON collection_products(tenant_id);
-- Un producto no puede repetirse dentro de la misma colección
CREATE UNIQUE INDEX idx_collection_products_unique ON collection_products (collection_id, product_id);

COMMIT;
