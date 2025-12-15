-- Eliminar el índice único antiguo que solo estaba en 'name'
-- Este índice fue creado antes de agregar companyId y ahora causa conflictos
-- porque tenemos un constraint único en (name, companyId)
DROP INDEX IF EXISTS "Tag_name_key";
