export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './src/auth.config';
import { getCompanyIdByDomain, getDomainFromRequest } from './src/lib/domain';

// Crear el middleware de NextAuth
const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  // Esta función se ejecuta después de que NextAuth procesa la autenticación
  // req.auth contiene la sesión si existe
  
  // Obtener el dominio actual
  let domain: string = '';
  let companyId: string | null = null;
  
  try {
    const host = req.headers.get('host') || req.headers.get('x-forwarded-host');
    domain = getDomainFromRequest(host);

    // Verificar si el dominio existe en la base de datos
    companyId = await getCompanyIdByDomain(domain);
    
    const pathname = req.nextUrl.pathname;
    
    if (!companyId) {
      // Si no se encuentra el dominio, loguear warning
      console.warn(`Domain ${domain} not found in database`);
      
      // Si no estamos ya en "/", redirigir a "/" para mostrar la landing page
      if (pathname !== '/') {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    // Crear respuesta y agregar headers
    // La lógica de renderizado de landing/shop se maneja en el layout de (shop)
    const response = NextResponse.next();
    response.headers.set('x-company-id', companyId || '');
    response.headers.set('x-domain', domain);

    return response;
  } catch (error) {
    console.error('Error in domain middleware:', error);
    
    const pathname = req.nextUrl.pathname;
    
    // Si hay error y no estamos en "/", redirigir a "/"
    if (pathname !== '/') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    const response = NextResponse.next();
    response.headers.set('x-company-id', '');
    response.headers.set('x-domain', domain || '');
    return response;
  }
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
