'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateDiscount, deleteDiscount } from '@/actions';
import { IoPencilOutline, IoTrashOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import { DiscountType, DiscountTargetType, DiscountConditionType } from '@prisma/client';
import { CreateDiscountModal } from './CreateDiscountModal';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { confirmDelete } from '@/utils/confirm';

interface DiscountTarget {
  id: string;
  targetType: DiscountTargetType;
  targetId?: string | null;
}

interface DiscountCondition {
  id: string;
  conditionType: DiscountConditionType;
  value: number;
}

interface Discount {
  id: string;
  name: string;
  description?: string | null;
  type: DiscountType;
  value: any;
  isActive: boolean;
  combinable: boolean;
  priority: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  targets: DiscountTarget[];
  conditions: DiscountCondition[];
  createdAt: Date;
}

interface Props {
  discounts: Discount[];
}

const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Porcentaje',
  FIXED_AMOUNT: 'Monto Fijo',
  BUY_X_GET_Y: 'Compra X Lleva Y',
};

const TARGET_TYPE_LABELS: Record<DiscountTargetType, string> = {
  ALL: 'Todos',
  PRODUCT: 'Producto',
  CATEGORY: 'Categoría',
  TAG: 'Tag',
};

const CONDITION_TYPE_LABELS: Record<DiscountConditionType, string> = {
  MIN_QUANTITY: 'Cantidad mín.',
  MIN_AMOUNT: 'Monto mín.',
};

const formatValue = (type: DiscountType, value: any): string => {
  if (value === null || value === undefined) return '-';
  
  if (type === 'BUY_X_GET_Y' && typeof value === 'object') {
    return `${value.buy}x${value.pay}`;
  } else if (typeof value === 'number') {
    if (type === 'PERCENTAGE') {
      return `${value}%`;
    } else {
      return `$${value}`;
    }
  }
  
  return '-';
};

const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const DiscountsTable = ({ discounts }: Props) => {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingModalOpen, setEditingModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setEditingModalOpen(true);
  };

  const handleDelete = async (discountId: string) => {
    const confirmed = await confirmDelete(
      '¿Estás seguro de que deseas eliminar este descuento?',
      () => {}
    );
    
    if (!confirmed) return;

    setDeletingId(discountId);
    const result = await deleteDiscount(discountId);
    
    if (result.ok) {
      showSuccessToast('Descuento eliminado exitosamente');
      router.refresh();
    } else {
      showErrorToast(result.message || 'Error al eliminar el descuento');
    }
    setDeletingId(null);
  };

  const handleSuccess = () => {
    setEditingModalOpen(false);
    setEditingDiscount(null);
    router.refresh();
  };

  if (discounts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No hay descuentos disponibles. Crea tu primer descuento.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Targets
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Condiciones
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioridad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fechas
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {discounts.map((discount) => {
              const isDeleting = deletingId === discount.id;
              
              return (
                <tr key={discount.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                    {discount.description && (
                      <div className="text-sm text-gray-500">{discount.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {DISCOUNT_TYPE_LABELS[discount.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatValue(discount.type, discount.value)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {discount.targets.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {discount.targets.map((target, idx) => (
                            <span
                              key={target.id}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {TARGET_TYPE_LABELS[target.targetType]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {discount.conditions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {discount.conditions.map((condition, idx) => (
                            <span
                              key={condition.id}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"
                            >
                              {CONDITION_TYPE_LABELS[condition.conditionType]}: {condition.value}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {discount.isActive ? (
                        <IoCheckmarkCircleOutline className="text-green-500" size={20} />
                      ) : (
                        <IoCloseCircleOutline className="text-red-500" size={20} />
                      )}
                      {discount.combinable && (
                        <span className="text-xs text-gray-500">Combinable</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{discount.priority}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {discount.startsAt && (
                        <div>Desde: {formatDate(discount.startsAt)}</div>
                      )}
                      {discount.endsAt && (
                        <div>Hasta: {formatDate(discount.endsAt)}</div>
                      )}
                      {!discount.startsAt && !discount.endsAt && (
                        <span className="text-gray-400">Sin límite</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Editar"
                      >
                        <IoPencilOutline size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1"
                        title="Eliminar"
                      >
                        <IoTrashOutline size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {discounts.map((discount) => {
          const isExpanded = expandedId === discount.id;
          const isDeleting = deletingId === discount.id;
          
          return (
            <div key={discount.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{discount.name}</h3>
                  {discount.description && (
                    <p className="text-sm text-gray-600 mt-1">{discount.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      {DISCOUNT_TYPE_LABELS[discount.type]}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      {formatValue(discount.type, discount.value)}
                    </span>
                    {discount.isActive ? (
                      <IoCheckmarkCircleOutline className="text-green-500" size={20} />
                    ) : (
                      <IoCloseCircleOutline className="text-red-500" size={20} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : discount.id)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title={isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                  >
                    {isExpanded ? <IoChevronUpOutline size={20} /> : <IoChevronDownOutline size={20} />}
                  </button>
                  <button
                    onClick={() => handleEdit(discount)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Editar"
                  >
                    <IoPencilOutline size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1"
                    title="Eliminar"
                  >
                    <IoTrashOutline size={20} />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Targets: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {discount.targets.map((target) => (
                        <span
                          key={target.id}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {TARGET_TYPE_LABELS[target.targetType]}
                        </span>
                      ))}
                    </div>
                  </div>
                  {discount.conditions.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Condiciones: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {discount.conditions.map((condition) => (
                          <span
                            key={condition.id}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"
                          >
                            {CONDITION_TYPE_LABELS[condition.conditionType]}: {condition.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    <div>Prioridad: {discount.priority}</div>
                    {discount.combinable && <div>Combinable: Sí</div>}
                    {discount.startsAt && <div>Desde: {formatDate(discount.startsAt)}</div>}
                    {discount.endsAt && <div>Hasta: {formatDate(discount.endsAt)}</div>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de edición */}
      <CreateDiscountModal
        isOpen={editingModalOpen}
        onClose={() => {
          setEditingModalOpen(false);
          setEditingDiscount(null);
        }}
        onSuccess={handleSuccess}
        discount={editingDiscount}
      />
    </>
  );
};
