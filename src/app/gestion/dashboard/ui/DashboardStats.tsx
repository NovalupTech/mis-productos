import {
  IoCubeOutline,
  IoPeopleOutline,
  IoTicketOutline,
  IoTimeOutline,
} from 'react-icons/io5';
import Link from 'next/link';

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
}

export const DashboardStats = ({ totalProducts, totalUsers, totalOrders, recentOrders }: DashboardStatsProps) => {
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
    </div>
  );
};
