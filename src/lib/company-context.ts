import { getCurrentCompanyId } from './domain';
import { cookies } from 'next/headers';
import { middleware } from '@/auth.config';

/**
 * Obtiene el companyId del contexto:
 * 1. Si hay un companyId en cookies (admin gestionando empresa específica), lo usa
 * 2. Si no, obtiene el companyId del dominio actual
 */
export async function getCompanyIdFromContext(): Promise<string | null> {
  try {
    const session = await middleware();
    
    // Si el usuario es admin, verificar si hay un companyId en cookies
    if (session?.user?.role === 'admin') {
      const cookieStore = await cookies();
      const adminCompanyId = cookieStore.get('admin-selected-company-id')?.value;
      if (adminCompanyId) {
        return adminCompanyId;
      }
    }
    
    // Por defecto, obtener del dominio
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

