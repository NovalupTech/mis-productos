export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified?: Date | null;
    role: 'admin' | 'user' | 'companyAdmin' | 'companyAdmin';
    image?: string | null;
    companyId?: string | null;
  }