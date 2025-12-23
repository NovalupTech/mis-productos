'use server'

import { signOut } from "@/auth.config"
import { cookies } from 'next/headers'
import { middleware } from '@/auth.config'

export const logout = async () => {
  // Obtener la sesión antes de hacer signOut para verificar si es admin
  const session = await middleware()
  
  // Si el usuario es admin, eliminar la cookie de empresa seleccionada
  if (session?.user?.role === 'admin') {
    const cookieStore = await cookies()
    cookieStore.delete('admin-selected-company-id')
  }
  
  await signOut({ 
    redirect: false
  });
}
