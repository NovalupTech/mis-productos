
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Configuración de Prisma para migraciones
 * La URL de conexión se obtiene de la variable de entorno DATABASE_URL
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

