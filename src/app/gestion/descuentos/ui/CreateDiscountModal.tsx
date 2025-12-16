'use client';

import { useState, useEffect } from 'react';
import { createDiscount, updateDiscount, getDiscountOptions } from '@/actions';
import { IoCloseOutline } from 'react-icons/io5';
import { DiscountType, DiscountTargetType, DiscountConditionType } from '@prisma/client';

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
  targets: Array<{
    id: string;
    targetType: DiscountTargetType;
    targetId?: string | null;
  }>;
  conditions: Array<{
    id: string;
    conditionType: DiscountConditionType;
    value: number;
  }>;
}

interface CreateDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  discount?: Discount | null;
}

const DISCOUNT_TYPES: { value: DiscountType; label: string; description: string }[] = [
  { value: 'PERCENTAGE', label: 'Porcentaje', description: 'Ej: 20% OFF' },
  { value: 'FIXED_AMOUNT', label: 'Monto Fijo', description: 'Ej: $1000 OFF' },
  { value: 'BUY_X_GET_Y', label: 'Compra X Lleva Y', description: 'Ej: 3x2' },
];

const TARGET_TYPES: { value: DiscountTargetType; label: string }[] = [
  { value: 'ALL', label: 'Todos los productos' },
  { value: 'PRODUCT', label: 'Producto específico' },
  { value: 'CATEGORY', label: 'Categoría' },
  { value: 'TAG', label: 'Tag' },
];

const CONDITION_TYPES: { value: DiscountConditionType; label: string; unit: string }[] = [
  { value: 'MIN_QUANTITY', label: 'Cantidad mínima', unit: 'unidades' },
  { value: 'MIN_AMOUNT', label: 'Monto mínimo', unit: '$' },
];

export const CreateDiscountModal = ({ isOpen, onClose, onSuccess, discount }: CreateDiscountModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DiscountType>('PERCENTAGE');
  const [value, setValue] = useState<number | { buy: number; pay: number } | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [combinable, setCombinable] = useState(false);
  const [priority, setPriority] = useState(0);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  
  const [targets, setTargets] = useState<Array<{ targetType: DiscountTargetType; targetId?: string | null }>>([]);
  const [conditions, setConditions] = useState<Array<{ conditionType: DiscountConditionType; value: number }>>([]);
  
  const [options, setOptions] = useState<{ products: any[]; categories: any[]; tags: any[] }>({
    products: [],
    categories: [],
    tags: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [productSearchTerms, setProductSearchTerms] = useState<Record<number, string>>({});

  const isEditing = !!discount;

  // Cargar opciones al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  // Actualizar estado cuando cambia el descuento
  useEffect(() => {
    if (discount) {
      setName(discount.name);
      setDescription(discount.description || '');
      setType(discount.type);
      
      // Manejar el valor según el tipo
      if (discount.type === 'BUY_X_GET_Y' && typeof discount.value === 'object') {
        setValue(discount.value as { buy: number; pay: number });
      } else if (typeof discount.value === 'number') {
        setValue(discount.value);
      } else {
        setValue(null);
      }
      
      setIsActive(discount.isActive);
      setCombinable(discount.combinable);
      setPriority(discount.priority);
      setStartsAt(discount.startsAt ? new Date(discount.startsAt).toISOString().slice(0, 16) : '');
      setEndsAt(discount.endsAt ? new Date(discount.endsAt).toISOString().slice(0, 16) : '');
      setTargets(discount.targets.map(t => ({ targetType: t.targetType, targetId: t.targetId || null })));
      setConditions(discount.conditions.map(c => ({ conditionType: c.conditionType, value: c.value })));
    } else {
      resetForm();
    }
  }, [discount]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    const result = await getDiscountOptions();
    if (result.ok) {
      setOptions({
        products: result.products || [],
        categories: result.categories || [],
        tags: result.tags || []
      });
    }
    setLoadingOptions(false);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('PERCENTAGE');
    setValue(null);
    setIsActive(true);
    setCombinable(false);
    setPriority(0);
    setStartsAt('');
    setEndsAt('');
    setTargets([]);
    setConditions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validaciones
      if (!name.trim()) {
        setError('El nombre es requerido');
        setLoading(false);
        return;
      }

      if (targets.length === 0) {
        setError('Debe especificar al menos un target');
        setLoading(false);
        return;
      }

      // Validar valor según tipo
      if (type === 'PERCENTAGE' || type === 'FIXED_AMOUNT') {
        if (value === null || typeof value !== 'number') {
          setError('El valor es requerido para este tipo de descuento');
          setLoading(false);
          return;
        }
      } else if (type === 'BUY_X_GET_Y') {
        if (value === null || typeof value !== 'object' || !('buy' in value) || !('pay' in value)) {
          setError('Debe especificar buy y pay para este tipo de descuento');
          setLoading(false);
          return;
        }
      }

      const discountData = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        value,
        isActive,
        combinable,
        priority,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        targets,
        conditions,
      };

      let result;
      if (isEditing) {
        result = await updateDiscount({
          discountId: discount.id,
          ...discountData,
        });
      } else {
        result = await createDiscount(discountData);
      }

      if (result.ok) {
        resetForm();
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Error al guardar el descuento');
      }
    } catch (error) {
      setError('Error inesperado al guardar el descuento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setError(null);
    onClose();
  };

  const addTarget = () => {
    setTargets([...targets, { targetType: 'ALL', targetId: null }]);
  };

  const removeTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const updateTarget = (index: number, field: 'targetType' | 'targetId', value: any) => {
    const newTargets = [...targets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    setTargets(newTargets);
  };

  const addCondition = () => {
    setConditions([...conditions, { conditionType: 'MIN_QUANTITY', value: 0 }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: 'conditionType' | 'value', value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const getTargetOptions = (targetType: DiscountTargetType, searchTerm?: string) => {
    switch (targetType) {
      case 'PRODUCT':
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return options.products.filter(product => 
            (product.name || product.title || '').toLowerCase().includes(term)
          );
        }
        return options.products;
      case 'CATEGORY':
        return options.categories;
      case 'TAG':
        return options.tags;
      default:
        return [];
    }
  };

  const handleProductSearchChange = (targetIndex: number, searchTerm: string) => {
    setProductSearchTerms(prev => ({
      ...prev,
      [targetIndex]: searchTerm
    }));
  };

  const handleTargetTypeChange = (index: number, newType: DiscountTargetType) => {
    updateTarget(index, 'targetType', newType);
    // Limpiar el término de búsqueda si cambia el tipo
    if (newType !== 'PRODUCT') {
      setProductSearchTerms(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Editar Descuento' : 'Nuevo Descuento'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Descuento *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 20% OFF en zapatillas"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Descuento *
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as DiscountType);
                  setValue(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {DISCOUNT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label} - {dt.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Descripción opcional del descuento"
            />
          </div>

          {/* Valor según tipo */}
          <div className="mb-4">
            {type === 'BUY_X_GET_Y' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compra (X) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={value && typeof value === 'object' ? value.buy : ''}
                    onChange={(e) => {
                      const buy = parseInt(e.target.value) || 0;
                      const pay = value && typeof value === 'object' ? value.pay : buy;
                      setValue({ buy, pay });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paga (Y) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={value && typeof value === 'object' ? value.pay : ''}
                    onChange={(e) => {
                      const pay = parseInt(e.target.value) || 0;
                      const buy = value && typeof value === 'object' ? value.buy : pay;
                      setValue({ buy, pay });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor {type === 'PERCENTAGE' ? '(%)' : '($)'} *
                </label>
                <input
                  type="number"
                  id="value"
                  min="0"
                  step={type === 'PERCENTAGE' ? '0.01' : '1'}
                  value={typeof value === 'number' ? value : ''}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <input
                type="number"
                id="priority"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Mayor número = mayor prioridad</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startsAt" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="datetime-local"
                  id="startsAt"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="endsAt" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="datetime-local"
                  id="endsAt"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Activo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={combinable}
                onChange={(e) => setCombinable(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Combinable con otros descuentos</span>
            </label>
          </div>

          {/* Targets */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Targets (Aplicar a) *
              </label>
              <button
                type="button"
                onClick={addTarget}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Agregar Target
              </button>
            </div>
            {targets.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay targets. Agrega al menos uno.</p>
            ) : (
              <div className="space-y-2">
                {targets.map((target, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <div className="flex gap-2 items-start">
                      <select
                        value={target.targetType}
                        onChange={(e) => handleTargetTypeChange(index, e.target.value as DiscountTargetType)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {TARGET_TYPES.map((tt) => (
                          <option key={tt.value} value={tt.value}>
                            {tt.label}
                          </option>
                        ))}
                      </select>
                      {target.targetType !== 'ALL' && (
                        <>
                          {target.targetType === 'PRODUCT' && (
                            <div className="flex-1">
                              <input
                                type="text"
                                value={productSearchTerms[index] || ''}
                                onChange={(e) => handleProductSearchChange(index, e.target.value)}
                                placeholder="Buscar producto..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                          <select
                            value={target.targetId || ''}
                            onChange={(e) => updateTarget(index, 'targetId', e.target.value || null)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loadingOptions}
                          >
                            <option value="">Seleccionar...</option>
                            {getTargetOptions(target.targetType, productSearchTerms[index]).map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name || option.title}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          removeTarget(index);
                          // Limpiar el término de búsqueda al eliminar el target
                          setProductSearchTerms(prev => {
                            const updated = { ...prev };
                            delete updated[index];
                            return updated;
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md whitespace-nowrap"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Condiciones (Opcional)
              </label>
              <button
                type="button"
                onClick={addCondition}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Agregar Condición
              </button>
            </div>
            {conditions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Sin condiciones. El descuento aplicará siempre.</p>
            ) : (
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <select
                      value={condition.conditionType}
                      onChange={(e) => updateCondition(index, 'conditionType', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CONDITION_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Valor"
                    />
                    <span className="px-3 py-2 text-sm text-gray-600">
                      {CONDITION_TYPES.find(ct => ct.value === condition.conditionType)?.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || targets.length === 0}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
