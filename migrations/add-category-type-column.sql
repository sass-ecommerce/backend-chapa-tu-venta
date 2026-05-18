-- Opción A: sin synchronize (agrega columna manualmente)
ALTER TABLE categories
  ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'BASE';

UPDATE categories
  SET type = 'CHILDREN'
  WHERE parent_id IS NOT NULL;

ALTER TABLE categories
  ALTER COLUMN type DROP DEFAULT;

-- Opción B: con synchronize=true (TypeORM ya creó la columna con default 'BASE')
-- Solo ejecutar el backfill:
-- UPDATE categories SET type = 'CHILDREN' WHERE parent_id IS NOT NULL;
