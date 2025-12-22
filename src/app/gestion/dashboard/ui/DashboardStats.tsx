import {
  IoCubeOutline,
  IoPeopleOutline,
  IoTicketOutline,
  IoTimeOutline,
  IoCardOutline,
} from 'react-icons/io5';
import Link from 'next/link';
import { PaymentStatus } from '@prisma/client';

interface DashboardStatsProps {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  recentOrders: Array<{
    id: string;
    total: number;
    createdAt: Date;
    customer: {
      name: string | null;
      email: string;
    } | null;
    user: {
      name: string | null;
      email: string;
    } | null;
  }>;
  recentPayments: Array<{
    id: string;
    paymentId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    statusDetail: string | null;
    paymentMethod: string | null;
    createdAt: Date;
    order: {
      id: string;
      customer: {
        name: string | null;
        email: string;
      } | null;
      user: {
        name: string | null;
        email: string;
      } | null;
    };
  }>;
}

export const DashboardStats = ({ totalProducts, totalUsers, totalOrders, recentOrders, recentPayments }: DashboardStatsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'refunded':
        return 'text-orange-600 bg-orange-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      case 'refunded':
        return 'Reembolsado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Estadísticas</h2>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <IoCubeOutline size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Productos</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </div>
          <Link
            href="/gestion/products"
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 block"
          >
            Ver productos →
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <IoPeopleOutline size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
          <Link
            href="/gestion/users"
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 block"
          >
            Ver usuarios →
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <IoTicketOutline size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
          <Link
            href="/gestion/orders"
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 block"
          >
            Ver pedidos →
          </Link>
        </div>
      </div>

      {/* Últimas compras */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <IoTimeOutline size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Últimas compras</h3>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No hay compras recientes</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {order.customer?.name || order.customer?.email || order.user?.name || order.user?.email || 'Cliente sin nombre'}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {recentOrders.length > 0 && (
          <Link
            href="/gestion/orders"
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 block text-center"
          >
            Ver todas las órdenes →
          </Link>
        )}
      </div>

      {/* Últimos pagos */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <IoCardOutline size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Últimos pagos</h3>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No hay pagos recientes</p>
        ) : (
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-2 py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {payment.order.customer?.name || 
                       payment.order.customer?.email || 
                       payment.order.user?.name || 
                       payment.order.user?.email || 
                       'Cliente sin nombre'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amount)} {payment.currency}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                </div>
                {payment.paymentMethod && (
                  <p className="text-xs text-gray-500">
                    Método: {payment.paymentMethod}
                  </p>
                )}
                {payment.statusDetail && (
                  <p className="text-xs text-gray-400">
                    {payment.statusDetail}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {recentPayments.length > 0 && (
          <Link
            href="/gestion/orders"
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 block text-center"
          >
            Ver todas las órdenes →
          </Link>
        )}
      </div>
    </div>
  );
};
