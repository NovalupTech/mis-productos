import { titleFont } from '@/config/fonts';
import { LoginForm } from './ui/LoginForm';
import { getCurrentCompanyId } from '@/lib/domain';
import prisma from '@/lib/prisma';
import Image from 'next/image';

export default async function LoginPage() {
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
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 w-full py-8">
      {/* Sección del Logo */}
      {company?.logo && (
        <div className="flex flex-col items-center justify-center flex-1 max-w-md">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 mb-6">
            <Image
              src={company.logo.startsWith('http') || company.logo.startsWith('https') 
                ? company.logo 
                : `/logos/${company.logo}`}
              alt={company.name || 'Logo'}
              fill
              className="object-contain"
              priority
            />
          </div>
          {company.name && (
            <h2 className={`${titleFont.className} text-2xl sm:text-3xl font-bold text-gray-800 text-center`}>
              {company.name}
            </h2>
          )}
        </div>
      )}

      {/* Sección del Formulario */}
      <div className="flex flex-col w-full max-w-md">
        <h1 className={`${titleFont.className} text-3xl sm:text-4xl mb-6 text-center lg:text-left`}>
          Ingresar
        </h1>
        <LoginForm/>
      </div>
    </div>
  );
}
