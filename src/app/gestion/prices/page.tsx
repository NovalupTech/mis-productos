import { redirect } from 'next/navigation';
import { middleware } from '@/auth.config';
import { getCompanyConfig } from '@/actions/company-config/get-company-config';
import { PricesForm } from './ui/PricesForm';

export default async function PricesPage() {
  const session = await middleware();

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Precios</h1>
        <p className="text-gray-600 mt-1">
          Configura la moneda, formato y visibilidad de los precios en tu tienda
        </p>
      </div>

      <PricesForm initialConfig={configs || {}} />
    </div>
  );
}
