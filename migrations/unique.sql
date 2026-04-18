-- Permite que un dominio liberado (eliminado lógicamente) pueda volver a usarse
CREATE UNIQUE INDEX idx_tenants_domain ON tenants (domain) WHERE deleted_at IS NULL;
-- Permite reutilizar un slug dentro de un tenant si la categoría anterior fue eliminada
CREATE UNIQUE INDEX idx_categories_tenant_slug ON categories (tenant_id, slug) WHERE deleted_at IS NULL;
-- Un SKU debe ser único por producto, pero si se elimina lógicamente, el SKU se libera
CREATE UNIQUE INDEX idx_product_variants_sku ON product_variants (product_id, sku) WHERE deleted_at IS NULL;

-- ÍNDICE GIN PARA BÚSQUEDAS DINÁMICAS
CREATE INDEX idx_product_variants_attributes ON product_variants USING GIN (attributes);
-- Si un usuario es eliminado, su email queda disponible para un nuevo registro en Cognito
CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_roles_name ON roles (name) WHERE deleted_at IS NULL;
-- Evita que un mismo usuario tenga roles duplicados en la misma tienda, respetando el soft delete
CREATE UNIQUE INDEX idx_tenant_users_unique ON tenant_users (tenant_id, user_id) WHERE deleted_at IS NULL;