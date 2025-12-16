import { titleFont } from '@/config/fonts';
import { getCurrentCompanyId } from '@/lib/domain';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { SignOutHandler } from './ui/SignOutHandler';

export default async function SignOutPage() {
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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-8 bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg text-center">
        {/* Logo y nombre de la compañía */}
        {(company?.logo || company?.name) && (
          <div className="flex flex-col items-center mb-8">
            {company.logo && (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-4 flex-shrink-0">
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
              <h2 className={`${titleFont.className} text-xl sm:text-2xl font-bold text-gray-800`}>
                {company.name}
              </h2>
            )}
          </div>
        )}

        {/* Mensaje de despedida */}
        <div className="mb-8">
          <h1 className={`${titleFont.className} text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-800`}>
            Sesión cerrada
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Has cerrado sesión correctamente. Gracias por usar nuestro sistema.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-md font-semibold text-sm sm:text-base text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 items-center justify-center text-center"
          >
            Volver al inicio
          </Link>
          <Link
            href="/gestion"
            className="flex-1 py-3 px-4 rounded-md font-semibold text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 items-center justify-center text-center"
          >
            Iniciar sesión nuevamente
          </Link>
        </div>
      </div>
      
      {/* Handler para ejecutar el signout automáticamente */}
      <SignOutHandler />
    </div>
  );
}
