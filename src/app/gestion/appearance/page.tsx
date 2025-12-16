import { redirect } from 'next/navigation';
import { middleware } from '@/auth.config';
import { getCompanyConfig } from '@/actions/company-config/get-company-config';
import { AppearanceForm } from './ui/AppearanceForm';

export default async function AppearancePage() {
  const session = await middleware();

  if (!session?.user || session.user.role !== 'admin' && session.user.role !== 'companyAdmin') {
    redirect('/gestion');
  }

  const { ok, configs } = await getCompanyConfig();

  if (!ok) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600">No se pudieron cargar las configuraciones</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Apariencia</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Personaliza los colores y la visualización de tu tienda
        </p>
      </div>

      <AppearanceForm initialConfig={configs || {}} />
    </div>
  );
}
