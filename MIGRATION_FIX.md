# Solución para el Error de Migración en Producción

## Error
```
ERROR: column "address" of relation "OrderAddress" contains null values
Migration name: 20251220170325_reset
```

## Problema
La migración está intentando agregar columnas `NOT NULL` a tablas que ya tienen datos, pero esos datos tienen valores `NULL`.

## Solución

He actualizado la migración `20251220170325_reset` para que maneje correctamente los datos existentes. La migración ahora:

1. **Agrega las columnas como nullable primero**
2. **Actualiza los datos existentes** desde `UserAddress` usando `addressId`
3. **Usa valores por defecto** para registros sin `addressId`
4. **Hace las columnas NOT NULL** después de asegurar que no hay NULLs

## Pasos para Aplicar en Producción

### ⚠️ IMPORTANTE: Haz un backup de tu base de datos antes de continuar

### Paso 1: Resolver la migración fallida (si existe)

Si tienes una migración `20251220170325_reset_fix` que falló, márcala como resuelta:

```bash
npx prisma migrate resolve --rolled-back 20251220170325_reset_fix
```

### Paso 2: Ejecutar el script SQL corregido (RECOMENDADO)

1. **Conecta a tu base de datos de producción** usando tu cliente SQL preferido (psql, pgAdmin, DBeaver, etc.)

2. **Ejecuta el script SQL corregido**:
   - Abre el archivo `fix_migration_production.sql` 
   - Ejecuta todo el contenido del script en tu base de datos de producción
   - **IMPORTANTE**: El script primero actualiza `UserAddress` y luego `OrderAddress` (orden correcto)

3. **Marca la migración como aplicada**:
   ```bash
   npx prisma migrate resolve --applied 20251220170325_reset
   ```

4. **Verifica que todo esté correcto** ejecutando las queries de verificación al final del script

### Paso 3: Continuar con las migraciones

```bash
npx prisma migrate deploy
```

## Orden Correcto de Operaciones

La migración corregida ahora sigue este orden (CRÍTICO):

1. ✅ **Primero**: Agregar y actualizar `UserAddress` (firstName, lastName, phone)
2. ✅ **Segundo**: Agregar columnas a `OrderAddress` 
3. ✅ **Tercero**: Copiar datos desde `UserAddress` a `OrderAddress` (ahora UserAddress ya tiene las columnas)
4. ✅ **Cuarto**: Hacer las columnas NOT NULL

### Opción 3: Si necesitas hacer rollback primero

Si la migración falló parcialmente, puedes necesitar hacer rollback:

1. **Verifica qué cambios se aplicaron**:
   ```sql
   -- En tu base de datos, verifica si las columnas ya existen
   SELECT column_name, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'OrderAddress';
   ```

2. **Si las columnas ya existen pero son nullable, ejecuta solo la parte de UPDATE y ALTER**:
   - Ejecuta los pasos 2-4 y 6-7 de la migración corregida

3. **Si necesitas revertir completamente**:
   ```sql
   -- CUIDADO: Solo si es absolutamente necesario
   ALTER TABLE "OrderAddress" DROP COLUMN IF EXISTS "address";
   ALTER TABLE "OrderAddress" DROP COLUMN IF EXISTS "address2";
   -- ... etc
   ```

## Verificación Post-Migración

Después de aplicar la migración, verifica que todo esté correcto:

```sql
-- Verificar que no hay NULLs en OrderAddress
SELECT COUNT(*) 
FROM "OrderAddress" 
WHERE "address" IS NULL 
   OR "city" IS NULL 
   OR "countryId" IS NULL 
   OR "firstName" IS NULL 
   OR "lastName" IS NULL 
   OR "phone" IS NULL 
   OR "postalCode" IS NULL;
-- Debe retornar 0

-- Verificar que no hay NULLs en UserAddress
SELECT COUNT(*) 
FROM "UserAddress" 
WHERE "firstName" IS NULL 
   OR "lastName" IS NULL 
   OR "phone" IS NULL;
-- Debe retornar 0
```

## Notas Importantes

- **Backup**: Siempre haz un backup de tu base de datos antes de ejecutar migraciones en producción
- **Valores por defecto**: Los valores por defecto usados son:
  - `address`: "Dirección no especificada"
  - `city`: "Ciudad no especificada"
  - `firstName`: "Usuario"
  - `lastName`: "Sin apellido"
  - `phone`: "0000000000"
  - `postalCode`: "00000"
  - `countryId`: El primer país disponible en la tabla Country

- **Revisa los datos**: Después de la migración, revisa los datos para asegurarte de que los valores por defecto sean apropiados para tu caso de uso
