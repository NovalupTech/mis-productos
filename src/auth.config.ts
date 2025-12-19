export const runtime = 'nodejs';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { z } from 'zod';
import prisma from './lib/prisma';
import bcryptjs from 'bcryptjs';
import { getCurrentCompanyId } from './lib/domain';

const url_denied = [
  '/checkout/address',
  '/checkout'
]

export const authConfig = {
  pages: {
    signIn: '/login',
    signOut: '/login/signout',
    newUser: '/login/new-account',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Si el usuario se autentica con Google
      if (account?.provider === 'google') {
        try {
          const email = user.email?.toLowerCase();
          if (!email) return false;

          // Buscar si el usuario ya existe
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            // Si existe, actualizar datos si es necesario
            await prisma.user.update({
              where: { email },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: new Date(),
                provider: 'google',
                // Solo actualizar phone si viene de Google y no está vacío
                phone: (profile?.phone_number as string) || existingUser.phone,
              },
            });
          } else {
            // Si no existe, crear nuevo usuario con role "user" y companyId null (cliente)
            // Google OAuth no proporciona teléfono por defecto, así que se deja null
            await prisma.user.create({
              data: {
                email,
                name: user.name || '',
                image: user.image || null,
                emailVerified: new Date(),
                provider: 'google',
                phone: null, // Google no proporciona teléfono, se pedirá después
                role: 'user',
                companyId: null,
              },
            });
          }
        } catch (error) {
          console.error('Error en signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    jwt: async ({token, user, account}) => {
      if(user){
        // Si el usuario se autenticó con Google, obtener el ID real de la base de datos
        if (account?.provider === 'google' && user.email) {
          const userDB = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { 
              id: true,
              email: true,
              name: true,
              image: true,
              role: true,
              emailVerified: true,
              phone: true
            },
          });
          
          if (userDB) {
            // Usar el ID real de la base de datos
            token.data = {
              id: userDB.id,
              email: userDB.email,
              name: userDB.name,
              image: userDB.image,
              role: userDB.role,
              emailVerified: userDB.emailVerified
            };
            
            // Marcar en el token si necesita completar su perfil (no tiene teléfono)
            if (!userDB.phone) {
              token.needsPhone = true;
            }
          } else {
            // Fallback si no se encuentra el usuario (no debería pasar)
            token.data = user;
          }
        } else {
          // Para otros proveedores (credentials), usar el user directamente
          token.data = user;
        }
      }
      // Agregar provider al token si viene de la cuenta
      if (account?.provider) {
        token.provider = account.provider;
      }
      return token;
    },
    session: ({session, token}) => {
      session.user = token.data as any;
      // Agregar flag de necesita teléfono a la sesión
      if (token.needsPhone) {
        (session as any).needsPhone = true;
      }
      return session;
    },

    authorized: async ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user;
      const isDenied = url_denied.includes(nextUrl.pathname);
      const isCompleteProfilePage = nextUrl.pathname === '/login/complete-profile';
      const isLoginPage = nextUrl.pathname === '/login' || nextUrl.pathname.startsWith('/login/');
      
      // Si el usuario está logueado y se autenticó con Google, verificar si tiene teléfono
      if (isLoggedIn && auth?.user?.email && !isCompleteProfilePage && !isLoginPage) {
        try {
          const userDB = await prisma.user.findUnique({
            where: { email: (auth.user.email as string).toLowerCase() },
            select: { phone: true, provider: true },
          });
          
          // Si el usuario se autenticó con Google y no tiene teléfono, redirigir a completar perfil
          if (userDB?.provider === 'google' && !userDB?.phone) {
            return Response.redirect(new URL('/login/complete-profile', nextUrl));
          }
        } catch (error) {
          console.error('Error al verificar teléfono del usuario:', error);
        }
      }
      
      // Si el usuario está en la página de completar perfil pero ya tiene teléfono, redirigir a home
      if (isCompleteProfilePage && isLoggedIn && auth?.user?.email) {
        try {
          const userDB = await prisma.user.findUnique({
            where: { email: (auth.user.email as string).toLowerCase() },
            select: { phone: true },
          });
          
          if (userDB?.phone) {
            return Response.redirect(new URL('/', nextUrl));
          }
        } catch (error) {
          console.error('Error al verificar teléfono del usuario:', error);
        }
      }
      
      if (isDenied) {
        if (isLoggedIn) return true;
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    },
  },
  providers: [
    Credentials({
        id: 'credentials',
        async authorize(credentials) {
          const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials);

            if (!parsedCredentials.success) {
              return null;
            }

            const { email, password } = parsedCredentials.data;

            // Obtener el companyId del dominio actual
            const companyId = await getCurrentCompanyId();

            // Construir las condiciones de búsqueda según si hay companyId o no
            const whereClause: any = {
              email: email.toLowerCase(),
            };

            if (companyId) {
              // Si hay companyId, buscar usuario con role "companyAdmin" y ese companyId
              whereClause.companyId = companyId;
              whereClause.role = 'companyAdmin';
            } else {
              // Si no hay companyId, buscar admin superior con role "admin" y companyId null
              whereClause.role = 'admin';
              whereClause.companyId = null;
            }

            const userDB = await prisma.user.findFirst({
                where: whereClause,
            });

            if(!userDB) return null
            if(!userDB.password || !bcryptjs.compareSync(password, userDB.password)) return null

            // Actualizar provider si no está establecido
            if (!userDB.provider || userDB.provider === 'credentials') {
              await prisma.user.update({
                where: { id: userDB.id },
                data: { provider: 'credentials' },
              });
            }

            return { email: userDB.email, id: userDB.id, name: userDB.name, image: userDB.image, role: userDB.role, emailVerified: userDB.emailVerified };
        },
      }),
    Credentials({
        id: 'user-credentials',
        async authorize(credentials) {
          const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials);

            if (!parsedCredentials.success) {
              return null;
            }

            const { email, password } = parsedCredentials.data;

            // Buscar usuario con role "user" y companyId null
            const userDB = await prisma.user.findFirst({
                where: {
                  email: email.toLowerCase(),
                  role: 'user',
                  companyId: null,
                  provider: 'credentials',
                },
            });

            if(!userDB) return null
            if(!userDB.password || !bcryptjs.compareSync(password, userDB.password)) return null

            // Actualizar provider si no está establecido
            if (!userDB.provider || userDB.provider === 'credentials') {
              await prisma.user.update({
                where: { id: userDB.id },
                data: { provider: 'credentials' },
              });
            }

            return { email: userDB.email, id: userDB.id, name: userDB.name, image: userDB.image, role: userDB.role, emailVerified: userDB.emailVerified };
        },
      }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    ],
} satisfies NextAuthConfig;

export const { signIn, signOut, auth:middleware, handlers  } = NextAuth(authConfig);