'use client';

import { useEffect, useState } from 'react';
import { logout } from '@/actions';

export const SignOutHandler = () => {
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  useEffect(() => {
    // Ejecutar el signout automáticamente al cargar la página solo una vez
    // Esto es un fallback por si alguien accede directamente a /auth/signout
    if (!hasLoggedOut) {
      setHasLoggedOut(true);
      logout().catch((error) => {
        console.error('Error al cerrar sesión:', error);
      });
    }
  }, [hasLoggedOut]);

  return null;
};
