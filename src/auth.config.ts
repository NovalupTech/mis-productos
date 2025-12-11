export const runtime = 'nodejs';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from './lib/prisma';
import bcryptjs from 'bcryptjs';

const url_denied = [
  '/checkout/address',
  '/checkout'
]

export const authConfig = {
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/new-account',
  },
  callbacks: {
    jwt: ({token, user}) => {
      if(user){
        token.data = user;
      }
      return token;
    },
    session: ({session, token}) => {
      session.user = token.data as any;
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDenied = url_denied.includes(nextUrl.pathname);
      if (isDenied) {
        if (isLoggedIn) return true;
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    },
  },
  providers: [
    Credentials({
        async authorize(credentials) {
          const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials);

            if (!parsedCredentials.success) {
              return null;
            }

            const { email, password } = parsedCredentials.data;

            const userDB = await prisma.user.findFirst({
                where: {
                    email: email.toLowerCase(),
                },
            });

            if(!userDB) return null
            if(!bcryptjs.compareSync(password, userDB.password)) return null

            return { email: userDB.email, id: userDB.id, name: userDB.name, image: userDB.image, role: userDB.role, emailVerified: userDB.emailVerified };
        },
      }),
    ],
} satisfies NextAuthConfig;

export const { signIn, signOut, auth:middleware, handlers  } = NextAuth(authConfig);