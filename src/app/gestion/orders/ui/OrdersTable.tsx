'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { IoCardOutline, IoFilterOutline, IoCloseOutline } from 'react-icons/io5';
import { TogglePaymentButton } from '@/components/orders/TogglePaymentButton';
import { formatPrice, PriceConfig } from '@/utils';

interface Order {
  id: string;
  total: number;
  isPaid: boolean;
  OrderAddress?: {
    firstName: string;
    lastName: string;
  } | null;
  user?: {
    name: string | null;
  } | null;
}

interface OrdersTableProps {
  orders: Order[];
  priceConfig: PriceConfig;
}

export const OrdersTable = ({ orders, priceConfig }: OrdersTableProps) => {
  const [searchName, setSearchName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filtro por nombre
      const fullName = order.OrderAddress
        ? `${order.OrderAddress.firstName} ${order.OrderAddress.lastName}`
        : order.user?.name || '';
      
      const matchesName = searchName === '' || 
        fullName.toLowerCase().includes(searchName.toLowerCase());

      // Filtro por estado de pago
      const matchesPayment = paymentStatus === 'all' ||
        (paymentStatus === 'paid' && order.isPaid) ||
        (paymentStatus === 'unpaid' && !order.isPaid);

      return matchesName && matchesPayment;
    });
  }, [orders, searchName, paymentStatus]);

  const clearFilters = () => {
    setSearchName('');
    setPaymentStatus('all');
  };

  const hasActiveFilters = searchName !== '' || paymentStatus !== 'all';

  return (
    <div className="mb-10">
      {/* Filtros */}
      <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <IoFilterOutline size={18} />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {[searchName && '1', paymentStatus !== 'all' && '1'].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <IoCloseOutline size={16} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            {/* Filtro por nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por nombre
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Nombre del cliente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Filtro por estado de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de pago
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as 'all' | 'paid' | 'unpaid')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Todas</option>
                <option value="paid">Pagadas</option>
                <option value="unpaid">No pagadas</option>
              </select>
            </div>
          </div>
        )}

        {/* Contador de resultados */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{filteredOrders.length}</span> de{' '}
            <span className="font-semibold">{orders.length}</span> órdenes
          </p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-200 border-b">
            <tr>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                #ID
              </th>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Nombre completo
              </th>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Estado
              </th>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Monto
              </th>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Opciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron órdenes con los filtros aplicados
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id.split("-").at(-1)}
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    {order.OrderAddress
                      ? `${order.OrderAddress.firstName} ${order.OrderAddress.lastName}`
                      : order.user?.name || ''}
                  </td>
                  <td className="flex items-center text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    {order.isPaid ? (
                      <>
                        <IoCardOutline className="text-green-800" />
                        <span className="mx-2 text-green-800">Pagada</span>
                      </>
                    ) : (
                      <>
                        <IoCardOutline className="text-red-800" />
                        <span className="mx-2 text-red-800">No Pagada</span>
                      </>
                    )}
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    {formatPrice(order.total, priceConfig)}
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6">
                    <div className="flex items-center gap-3">
                      <Link
                        target="_blank"
                        href={`/catalog/orders/${order.id}`}
                        className="hover:underline"
                      >
                        Ver orden
                      </Link>
                      <TogglePaymentButton orderId={order.id} isPaid={order.isPaid} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">No se encontraron órdenes con los filtros aplicados</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="block bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">
                  ID: {order.id.split("-").at(-1)}
                </span>
                <div className="flex items-center">
                  {order.isPaid ? (
                    <>
                      <IoCardOutline className="text-green-800" />
                      <span className="ml-2 text-sm text-green-800 font-medium">Pagada</span>
                    </>
                  ) : (
                    <>
                      <IoCardOutline className="text-red-800" />
                      <span className="ml-2 text-sm text-red-800 font-medium">No Pagada</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {order.OrderAddress
                  ? `${order.OrderAddress.firstName} ${order.OrderAddress.lastName}`
                  : order.user?.name || ''}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Link
                  href={`/catalog/orders/${order.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Ver orden →
                </Link>
                <TogglePaymentButton orderId={order.id} isPaid={order.isPaid} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

