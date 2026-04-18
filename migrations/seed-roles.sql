-- ==============================================================================
-- SEED: TABLA DE ROLES
-- Roles del catálogo estático. Inserción idempotente con ON CONFLICT DO NOTHING.
-- ==============================================================================

INSERT INTO roles (id, name, description) VALUES
    ('55555555-5555-5555-5555-555555555551', 'ADMINISTRADOR', 'Acceso total al tenant'),
    ('55555555-5555-5555-5555-555555555552', 'AYUDANTE',      'Acceso limitado al tenant')
ON CONFLICT DO NOTHING;
