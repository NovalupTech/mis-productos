// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const createPrisma = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // ⚠️ Esto fuerza TRANSACTION MODE en lugar de SESSION MODE
    // que es compatible con PgBouncer
    pg: {
      application_name: "next-app",
      ssl: { rejectUnauthorized: false }
    }
  });

  return new PrismaClient({
    adapter,
    // Muy importante evitar logs excesivos en producción
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare global {
  // evita tipos incorrectos
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma ?? createPrisma();

// Solo en desarrollo guardamos la instancia en global para evitar recrearla por hot-reload
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;