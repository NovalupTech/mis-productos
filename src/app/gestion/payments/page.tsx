import { redirect } from 'next/navigation';
import { middleware } from '@/auth.config';
import { getPayments } from '@/actions/payments/get-payments';
import { PaymentsTable } from './ui/PaymentsTable';

export default async function PaymentsPage() {
  const session = await middleware();

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'companyAdmin')) {
    redirect('/gestion');
  }

  const { ok, payments = [] } = await getPayments();

  if (!ok) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600">No se pudieron cargar los pagos</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pagos</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Historial de todos los pagos realizados
        </p>
      </div>

      <PaymentsTable payments={payments} />
    </div>
  );
}
