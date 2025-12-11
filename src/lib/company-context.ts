import { headers } from 'next/headers';
import { getCurrentCompanyId } from './domain';

/**
 * Obtiene el companyId del contexto actual (desde headers del middleware)
 * Si no está disponible en headers, intenta obtenerlo del dominio
 */
export async function getCompanyIdFromContext(): Promise<string | null> {
  try {
    const headersList = await headers();
    const companyIdFromHeader = headersList.get('x-company-id');
    
    if (companyIdFromHeader) {
      return companyIdFromHeader;
    }

    // Fallback: obtener del dominio si no está en headers
    return await getCurrentCompanyId();
  } catch (error) {
    console.error('Error getting companyId from context:', error);
    return null;
  }
}

/**
 * Requiere que haya un companyId, lanza error si no existe
 */
export async function requireCompanyId(): Promise<string> {
  const companyId = await getCompanyIdFromContext();
  
  if (!companyId) {
    throw new Error('Company ID is required but not found in context');
  }
  
  return companyId;
}

