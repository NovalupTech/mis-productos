'use client';

import { useEffect, useState } from 'react';
import { getShippingConfigPublic } from '@/actions/shipping/get-shipping-config-public';

export function useShippingConfig() {
  const [handlesShipping, setHandlesShipping] = useState(true); // Por defecto true para evitar redirecciones incorrectas
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShippingConfig = async () => {
      try {
        // Obtener companyId del dominio actual
        const response = await fetch('/api/company-id');
        if (!response.ok) {
          setHandlesShipping(false);
          setLoading(false);
          return;
        }
        
        const { companyId } = await response.json();
        if (!companyId) {
          setHandlesShipping(false);
          setLoading(false);
          return;
        }

        const result = await getShippingConfigPublic(companyId);
        if (result.ok && result.config) {
          setHandlesShipping(result.config.handlesShipping);
        } else {
          // Si hay error, asumir que no se manejan envíos
          setHandlesShipping(false);
        }
      } catch (error) {
        console.error('Error al obtener configuración de envíos:', error);
        setHandlesShipping(false);
      } finally {
        setLoading(false);
      }
    };

    fetchShippingConfig();
  }, []);

  return { handlesShipping, loading };
}
