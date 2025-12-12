export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './src/auth.config';

// Crear el middleware de NextAuth
const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  // Esta función se ejecuta después de que NextAuth procesa la autenticación
  // req.auth contiene la sesión si existe

  //obtener url actual
  const url = req.nextUrl;

  if (url.hostname.startsWith('www.')) {
    const url = req.nextUrl.clone();
    url.hostname = url.hostname.replace('www.', '');
    return NextResponse.redirect(url);
  }
  
  // El middleware solo maneja NextAuth
  // La lógica de búsqueda del dominio y redirección se maneja en el layout de (shop)
  return NextResponse.next();
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
