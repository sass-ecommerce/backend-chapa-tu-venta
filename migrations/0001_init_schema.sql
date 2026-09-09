-- ==============================================================================
-- 0001_init_schema.sql
--
-- Baseline schema migration. Consolidates everything previously spread across
-- db.sql, add-category-type-column.sql, add_product_images.sql, unique.sql,
-- seed-roles.sql and add_product_attributes.sql (now removed), plus the
-- `users.sub` column which existed in the live database but had never been
-- captured in a migration file.
--
-- This file is CLOSED: it must never be edited again once applied to any
-- environment. Every future schema change is a new numbered file in this
-- directory — see "Database migrations" in CLAUDE.md for the convention.
-- ==============================================================================

BEGIN;

-- gen_random_uuid() is built into core on Postgres 13+; pgcrypto provides it
-- on older versions. Safe / idempotent either way.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- 1. TENANTS
-- ==============================================================================
CREATE TABLE tenants (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    domain      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ
);

-- Permite que un dominio liberado (eliminado lógicamente) pueda volver a usarse
CREATE UNIQUE INDEX idx_tenants_domain ON tenants (domain) WHERE deleted_at IS NULL;

-- ==============================================================================
-- 2. USERS (ESPEJO DE AWS COGNITO)
-- ==============================================================================
CREATE TABLE users (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    sub         UUID         UNIQUE,
    email       VARCHAR(255) NOT NULL,
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- Si un usuario es eliminado, su email queda disponible para un nuevo registro en Cognito
CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;

-- ==============================================================================
-- 3. ROLES (CATÁLOGO ESTÁTICO)
-- ==============================================================================
CREATE TABLE roles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50)  NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_roles_name ON roles (name) WHERE deleted_at IS NULL;

-- ==============================================================================
-- 4. TENANT_USERS (USUARIOS POR INQUILINO)
-- ==============================================================================
CREATE TABLE tenant_users (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role_id     UUID         NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ
);

-- Evita que un mismo usuario tenga roles duplicados en la misma tienda, respetando el soft delete
CREATE UNIQUE INDEX idx_tenant_users_unique ON tenant_users (tenant_id, user_id) WHERE deleted_at IS NULL;

-- ==============================================================================
-- 5. CATEGORIES (LISTA DE ADYACENCIA)
-- ==============================================================================
CREATE TABLE categories (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    parent_id   UUID         REFERENCES categories(id) ON DELETE RESTRICT,
    type        VARCHAR(20)  NOT NULL DEFAULT 'BASE',
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ
);

-- Permite reutilizar un slug dentro de un tenant si la categoría anterior fue eliminada
CREATE UNIQUE INDEX idx_categories_tenant_slug ON categories (tenant_id, slug) WHERE deleted_at IS NULL;

-- ==============================================================================
-- 6. PRODUCTS (ENTIDAD BASE)
-- ==============================================================================
CREATE TABLE products (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID           NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    category_id UUID           NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name        VARCHAR(255)   NOT NULL,
    description TEXT,
    base_price  DECIMAL(10, 2) NOT NULL,
    is_active   BOOLEAN        NOT NULL DEFAULT true,
    attributes  JSONB          NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ
);

-- ==============================================================================
-- 7. PRODUCT_VARIANTS (SKUs Y ATRIBUTOS JSONB)
-- ==============================================================================
CREATE TABLE product_variants (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    sku         VARCHAR(100)   NOT NULL,
    price       DECIMAL(10, 2) NOT NULL,
    stock       INTEGER        NOT NULL DEFAULT 0,
    attributes  JSONB          NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ
);

-- Un SKU debe ser único por producto, pero si se elimina lógicamente, el SKU se libera
CREATE UNIQUE INDEX idx_product_variants_sku ON product_variants (product_id, sku) WHERE deleted_at IS NULL;
-- Índice GIN para búsquedas dinámicas sobre atributos
CREATE INDEX idx_product_variants_attributes ON product_variants USING GIN (attributes);

-- ==============================================================================
-- 8. PRODUCT_IMAGES
-- ==============================================================================
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

CREATE INDEX idx_product_images_product ON product_images(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_tenant ON product_images(tenant_id) WHERE deleted_at IS NULL;
-- Solo una imagen primaria por producto
CREATE UNIQUE INDEX idx_product_images_primary_product
  ON product_images(product_id)
  WHERE is_primary = true AND deleted_at IS NULL;

-- ==============================================================================
-- SEED: ROLES (catálogo estático requerido por la aplicación)
-- ==============================================================================
INSERT INTO roles (id, name, description) VALUES
    ('9eb6e2f4-209a-4caf-a0ae-9e014d7d8e49', 'ADMINISTRADOR', 'Acceso total al tenant'),
    ('f5015829-a6f5-47b3-8abf-756829c28fbd', 'AYUDANTE',      'Acceso limitado al tenant')
ON CONFLICT DO NOTHING;

COMMIT;
