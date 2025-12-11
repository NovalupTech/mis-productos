export const runtime = 'nodejs';

import { headers } from 'next/headers';
import prisma from './prisma';

/**
 * Obtiene el dominio desde los headers (para uso en Server Components/Actions)
 */
export async function getCurrentDomain(): Promise<string> {
  const env = process.env.ENV || 'dev';
  
  if (env === 'dev') {
    const devDomain = process.env.DOMAIN;
    if (!devDomain) {
      throw new Error('DOMAIN environment variable is required in dev mode');
    }
    return devDomain;
  }

  // Producción: obtener del header de la request
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  
  if (!host) {
    throw new Error('Could not determine host from request headers');
  }

  // Remover puerto si existe (localhost:3000 -> localhost)
  return host.split(':')[0];
}

/**
 * Obtiene el dominio desde un NextRequest (para uso en Middleware)
 */
export function getDomainFromRequest(host: string | null): string {
  const env = process.env.ENV || 'dev';
  
  if (env === 'dev') {
    const devDomain = process.env.DOMAIN;
    if (!devDomain) {
      return 'localhost';
    }
    return devDomain;
  }

  // Producción: usar el host de la request
  if (!host) {
    throw new Error('Could not determine host from request');
  }

  // Remover puerto si existe
  return host.split(':')[0];
}

/**
 * Obtiene el companyId asociado a un dominio
 */
export async function getCompanyIdByDomain(domain: string): Promise<string | null> {
  try {
    const domainRecord = await prisma.domain.findUnique({
      where: { domain },
      select: { companyId: true },
    });

    return domainRecord?.companyId || null;
  } catch (error) {
    console.error('Error getting companyId by domain:', error);
    return null;
  }
}

/**
 * Obtiene el companyId del dominio actual
 */
export async function getCurrentCompanyId(): Promise<string | null> {
  try {
    const domain = await getCurrentDomain();
    return await getCompanyIdByDomain(domain);
  } catch (error) {
    console.error('Error getting current companyId:', error);
    return null;
  }
}

