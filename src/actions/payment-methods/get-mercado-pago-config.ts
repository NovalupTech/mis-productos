'use server';

import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

/**
 * Obtiene la configuración de Mercado Pago para una empresa (accessToken desencriptado)
 * Solo debe usarse en el servidor
 */
export async function getMercadoPagoConfig(companyId: string) {
  try {
    if (!companyId) {
      return {
        ok: false,
        accessToken: null,
        publicKey: null,
      };
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: {
        companyId_type: {
          companyId,
          type: 'MERCADOPAGO',
        },
      },
      select: {
        enabled: true,
        config: true,
      },
    });

    if (!paymentMethod || !paymentMethod.enabled || !paymentMethod.config) {
      return {
        ok: false,
        accessToken: null,
        publicKey: null,
      };
    }

    const config = paymentMethod.config as { 
      clientId: string; 
      accessToken?: string; 
      clientSecret?: string; // Compatibilidad con datos antiguos
    };

    console.log({config})
    
    // Desencriptar el accessToken (o clientSecret para compatibilidad hacia atrás)
    let accessToken: string | null = null;
    try {
      // Intentar primero con accessToken (nuevo formato)
      if (config.accessToken) {
        const parts = config.accessToken.split(':');
        
        // Verificar formato antes de intentar desencriptar
        if (parts.length !== 3) {
          throw new Error(`Formato inválido: se esperaban 3 partes separadas por ':' pero se encontraron ${parts.length}`);
        }
        
        accessToken = decrypt(config.accessToken);
      } 
      // Si no existe accessToken, intentar con clientSecret (formato antiguo)
      else if (config.clientSecret) {
        accessToken = decrypt(config.clientSecret);
      } else {
        return {
          ok: false,
          accessToken: null,
          publicKey: null,
        };
      }
    } catch (error) {
      console.error('Error al desencriptar el accessToken de Mercado Pago:', error);
      console.error('Detalles del error:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      console.error('Config disponible:', {
        hasAccessToken: !!config.accessToken,
        hasClientSecret: !!config.clientSecret,
        accessTokenLength: config.accessToken?.length,
        clientSecretLength: config.clientSecret?.length,
        accessTokenPreview: config.accessToken?.substring(0, 50),
      });
      return {
        ok: false,
        accessToken: null,
        publicKey: null,
      };
    }
    
    return {
      ok: true,
      accessToken: accessToken,
      publicKey: config.clientId || null,
    };
  } catch (error) {
    console.error('Error al obtener configuración de Mercado Pago:', error);
    return {
      ok: false,
      accessToken: null,
      publicKey: null,
    };
  }
}
