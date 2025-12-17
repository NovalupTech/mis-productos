import { redirect } from 'next/navigation';
import { middleware } from '@/auth.config';
import { getPaymentMethods } from '@/actions/payment-methods/get-payment-methods';
import { PaymentMethodsForm } from './ui/PaymentMethodsForm';
import { PaymentMethod } from '@prisma/client';

export default async function PaymentsPage() {
  const session = await middleware();

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
    redirect('/gestion');
  }

  const { ok, paymentMethods = [] } = await getPaymentMethods();

  if (!ok) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600">No se pudieron cargar los métodos de pago</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Métodos de Pago</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Configura los métodos de pago disponibles para tus clientes
        </p>
      </div>

      <PaymentMethodsForm initialPaymentMethods={paymentMethods as PaymentMethod[]} />
    </div>
  );
}
