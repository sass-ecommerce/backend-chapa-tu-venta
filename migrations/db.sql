-- ==============================================================================
-- 1. TABLA DE TENANTS (INQUILINOS)
-- ==============================================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);




-- ==============================================================================
-- 2. TABLA DE CATEGORÍAS (LISTA DE ADYACENCIA)
-- ==============================================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);




-- ==============================================================================
-- 3. TABLA DE PRODUCTOS (ENTIDAD BASE)
-- ==============================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);


-- ==============================================================================
-- 4. TABLA DE VARIANTES (SKUs Y ATRIBUTOS JSONB)
-- ==============================================================================
CREATE TABLE product_variants (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    sku VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);




-- ==============================================================================
-- 5. TABLA DE USUARIOS (ESPEJO DE AWS COGNITO)
-- ==============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);




-- ==============================================================================
-- 6. TABLA DE ROLES (CATÁLOGO ESTÁTICO)
-- ==============================================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);




-- ==============================================================================
-- 7. TABLA INTERMEDIA: USUARIOS POR INQUILINO (TENANT_USERS)
-- ==============================================================================
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);




-- ==============================================================================
-- INSERCIÓN DE DATOS DE EJEMPLO (SEEDING)
-- ==============================================================================

-- 1. Insertar Tenant
INSERT INTO tenants (id, name, domain) VALUES ('11111111-1111-1111-1111-111111111111', 'Comercial SJL', 'comercialsjl.mitiendita.com');

-- 2. Insertar Categorías
INSERT INTO categories (id, tenant_id, parent_id, name, slug) VALUES 
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', NULL, 'Ropa', 'ropa'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Polos', 'polos');

-- 3. Insertar Producto
INSERT INTO products (id, tenant_id, category_id, name, description, base_price) VALUES 
    ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Polo Clásico Estampado', 'Polo 100% algodón', 45.00);

-- 4. Insertar Variante
INSERT INTO product_variants (id, product_id, sku, price, stock, attributes) VALUES 
    ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'POLO-BLA-M', 45.00, 50, '{"talla": "M", "color": "Blanco"}');

-- 5. Insertar Roles
INSERT INTO roles (id, name, description) VALUES 
    ('55555555-5555-5555-5555-555555555551', 'ADMINISTRADOR', 'Acceso total'),
    ('55555555-5555-5555-5555-555555555552', 'AYUDANTE', 'Acceso limitado');

-- 6. Insertar Usuarios
INSERT INTO users (id, email, first_name, last_name) VALUES 
    ('66666666-6666-6666-6666-666666666661', 'dueno@mitiendita.pe', 'Carlos', 'Mendoza'),
    ('66666666-6666-6666-6666-666666666662', 'ayudante@gmail.com', 'Luis', 'Pérez');

-- 7. Asignar Roles a Usuarios en el Tenant
INSERT INTO tenant_users (id, tenant_id, user_id, role_id) VALUES 
    ('77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551'),
    ('77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555552');