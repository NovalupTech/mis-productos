import { titleFont } from '@/config/fonts';
import { middleware } from "@/auth.config";
import { redirect } from "next/navigation";
import { AdminLoginForm } from './ui/AdminLoginForm';
import { getCurrentCompanyId } from '@/lib/domain';
import prisma from '@/lib/prisma';
import Image from 'next/image';

export default async function AdminLoginPage() {
  const session = await middleware();

  // Si el usuario ya está autenticado, redirigir al dashboard
  if(session?.user){
    redirect('/gestion/dashboard')
  }

  // Obtener información de la compañía por dominio
  const companyId = await getCurrentCompanyId();
  let company = null;
  
  if (companyId) {
    company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo y nombre de la compañía */}
        {(company?.logo || company?.name) && (
          <div className="flex flex-col items-center mb-8">
            {company.logo && (
              <div className="relative w-20 h-20 mb-4 flex-shrink-0">
                <Image
                  src={company.logo.startsWith('http') || company.logo.startsWith('https') 
                    ? company.logo 
                    : `/logos/${company.logo}`}
                  alt={company.name || 'Logo'}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            {company.name && (
              <h2 className={`${titleFont.className} text-2xl font-bold text-center`}>
                {company.name}
              </h2>
            )}
          </div>
        )}
        
        {/* Título del login */}
        <h1 className={`${titleFont.className} text-3xl sm:text-4xl mb-8 text-center`}>
          Ingresar al panel de gestión
        </h1>
        
        {/* Formulario de login */}
        <AdminLoginForm />
      </div>
    </div>
  );
}
