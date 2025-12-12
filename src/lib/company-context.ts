import { getCurrentCompanyId } from './domain';

/**
 * Obtiene el companyId del dominio actual
 * @deprecated Usar getCurrentCompanyId directamente
 */
export async function getCompanyIdFromContext(): Promise<string | null> {
  try {
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

