import { DefaultSession } from "next-auth";


declare module 'next-auth' {
  interface Session {
    user: {
      name: string;
      email: string;
      image: string;
      emailVerified: boolean;
      role: 'admin' | 'user' | 'companyAdmin';
      image: string;
    } & DefaultSession['user'];
  }
}