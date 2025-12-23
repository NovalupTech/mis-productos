import { middleware } from "@/auth.config";
import { redirect } from "next/navigation";
import { getAllCompanies } from "@/actions/admin/get-all-companies";
import { CompaniesList } from "./ui/CompaniesList";
import { AdminLoginForm } from "./ui/AdminLoginForm";
import { titleFont } from '@/config/fonts';
import Image from 'next/image';

export default async function AdminPage() {
  const session = await middleware();

  // Si no hay sesión o el usuario no es admin, mostrar login
  if (!session?.user || session.user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-20 h-20 mb-4 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="misproductos"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <h2 className={`${titleFont.className} text-2xl font-bold text-center`}>
              misproductos
            </h2>
          </div>
          
          {/* Título del login */}
          <h1 className={`${titleFont.className} text-3xl sm:text-4xl mb-2 text-center`}>
            Panel de Administración
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Ingresa con tu cuenta de administrador
          </p>
          
          {/* Formulario de login */}
          <AdminLoginForm />
        </div>
      </div>
    );
  }

  const { ok, companies = [] } = await getAllCompanies();

  if (!ok) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-4xl">
          <h1 className={`${titleFont.className} text-3xl sm:text-4xl mb-8 text-center`}>
            Panel de Administración
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{companies.length === 0 ? 'No se pudieron cargar las empresas' : 'Error al cargar empresas'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gray-50">
      <div className="w-full max-w-6xl">
        <h1 className={`${titleFont.className} text-3xl sm:text-4xl mb-2 text-center`}>
          Panel de Administración
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Selecciona una empresa para gestionarla
        </p>
        
        <CompaniesList companies={companies} />
      </div>
    </div>
  );
}

