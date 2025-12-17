import { redirect } from 'next/navigation';
import { middleware } from '@/auth.config';
import { getShippingConfig } from '@/actions/shipping/get-shipping-config';
import { ShippingForm } from './ui/ShippingForm';

export default async function ShippingsPage() {
  const session = await middleware();

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
    redirect('/gestion');
  }

  const { ok, config } = await getShippingConfig();

  if (!ok || !config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600">No se pudo cargar la configuración de envíos</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Configuración de Envíos</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Configura cómo tu empresa maneja los envíos de productos
        </p>
      </div>

      <ShippingForm initialConfig={config} />
    </div>
  );
}
