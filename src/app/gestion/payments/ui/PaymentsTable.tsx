'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PaymentStatus } from '@prisma/client';
import { IoCardOutline, IoFilterOutline, IoCloseOutline } from 'react-icons/io5';
import { formatPrice } from '@/utils';

interface Payment {
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
    total: number;
    customer: {
      name: string | null;
      email: string;
    } | null;
    user: {
      name: string | null;
      email: string;
    } | null;
  };
}

interface PaymentsTableProps {
  payments: Payment[];
}

export const PaymentsTable = ({ payments }: PaymentsTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Filtro por búsqueda (cliente, email, paymentId)
      const customerName = payment.order.customer?.name || payment.order.customer?.email || '';
      const userName = payment.order.user?.name || payment.order.user?.email || '';
      const searchLower = searchQuery.toLowerCase();
      
      const matchesSearch = searchQuery === '' ||
        customerName.toLowerCase().includes(searchLower) ||
        userName.toLowerCase().includes(searchLower) ||
        payment.paymentId.toLowerCase().includes(searchLower) ||
        payment.order.id.toLowerCase().includes(searchLower);

      // Filtro por estado
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all';

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
                {[searchQuery && '1', statusFilter !== 'all' && '1'].filter(Boolean).length}
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
            {/* Filtro por búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cliente, email, ID de pago..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | PaymentStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Todos</option>
                <option value="approved">Aprobado</option>
                <option value="pending">Pendiente</option>
                <option value="rejected">Rechazado</option>
                <option value="refunded">Reembolsado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        )}

        {/* Contador de resultados */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{filteredPayments.length}</span> de{' '}
            <span className="font-semibold">{payments.length}</span> pagos
          </p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-200 border-b">
            <tr>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                ID Pago
              </th>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                Cliente
              </th>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                Método
              </th>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                Monto
              </th>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                Estado
              </th>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                Fecha
              </th>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                Orden
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron pagos con los filtros aplicados
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="font-mono text-xs">{payment.paymentId.substring(0, 20)}...</span>
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    {payment.order.customer?.name || 
                     payment.order.customer?.email || 
                     payment.order.user?.name || 
                     payment.order.user?.email || 
                     'Sin cliente'}
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    {payment.paymentMethod || '-'}
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    <span className="font-medium">
                      {formatPrice(payment.amount, { 
                        currency: payment.currency, 
                        format: 'code-before',
                        showPrices: true 
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                    {payment.statusDetail && (
                      <p className="text-xs text-gray-500 mt-1">{payment.statusDetail}</p>
                    )}
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6">
                    <Link
                      target="_blank"
                      href={`/catalog/orders/${payment.order.id}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Ver orden
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredPayments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">No se encontraron pagos con los filtros aplicados</p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="block bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">
                  {payment.paymentId.substring(0, 20)}...
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                  {getStatusLabel(payment.status)}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-2">
                {payment.order.customer?.name || 
                 payment.order.customer?.email || 
                 payment.order.user?.name || 
                 payment.order.user?.email || 
                 'Sin cliente'}
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {formatPrice(payment.amount, { 
                    currency: payment.currency, 
                    format: 'code-before',
                    showPrices: true 
                  })}
                </span>
                <span className="text-xs text-gray-500">{formatDate(payment.createdAt)}</span>
              </div>
              {payment.paymentMethod && (
                <p className="text-xs text-gray-500 mb-2">Método: {payment.paymentMethod}</p>
              )}
              {payment.statusDetail && (
                <p className="text-xs text-gray-400 mb-2">{payment.statusDetail}</p>
              )}
              <Link
                href={`/catalog/orders/${payment.order.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                Ver orden →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

