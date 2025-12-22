'use client';

import { useEffect, useState, useRef } from 'react';
import { getAllAttributes, createAttributeValue } from '@/actions';
import { ProductAttributeWithDetails } from '@/interfaces';
import { IoCloseOutline, IoAddOutline, IoCheckmarkOutline } from 'react-icons/io5';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

interface Attribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  companyId: string;
  values: {
    id: string;
    value: string;
  }[];
}

interface ProductAttributeValue {
  attributeId: string;
  // Para select: un solo attributeValueId
  // Para multiselect: array de attributeValueIds
  // Para text: valueText
  // Para number: valueNumber
  attributeValueIds?: string[];
  valueText?: string;
  valueNumber?: number;
}

interface AttributesManagerProps {
  productAttributes?: ProductAttributeWithDetails[];
  companyId?: string;
  onAttributesChange: (attributes: ProductAttributeValue[]) => void;
}

export const AttributesManager = ({ 
  productAttributes = [], 
  companyId,
  onAttributesChange 
}: AttributesManagerProps) => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Map<string, ProductAttributeValue>>(new Map());
  const initializedRef = useRef(false);
  const [addingValueForAttribute, setAddingValueForAttribute] = useState<string | null>(null);
  const [newValueText, setNewValueText] = useState('');
  const [creatingValue, setCreatingValue] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadAttributes();
    }
  }, [companyId]);

  useEffect(() => {
    // Inicializar con los atributos del producto solo una vez cuando se cargan los atributos
    if (!initializedRef.current && attributes.length > 0 && productAttributes.length > 0) {
      initializedRef.current = true;
      
      // Agrupar por attributeId para manejar multiselect
      const groupedByAttribute = new Map<string, ProductAttributeValue>();
      
      productAttributes.forEach(pa => {
        const existing = groupedByAttribute.get(pa.attributeId);
        
        if (pa.attribute.type === 'select' || pa.attribute.type === 'multiselect') {
          if (pa.attributeValueId) {
            if (existing) {
              // Multiselect: agregar al array
              if (!existing.attributeValueIds) {
                existing.attributeValueIds = [];
              }
              existing.attributeValueIds.push(pa.attributeValueId);
            } else {
              groupedByAttribute.set(pa.attributeId, {
                attributeId: pa.attributeId,
                attributeValueIds: [pa.attributeValueId],
              });
            }
          }
        } else if (pa.attribute.type === 'text' && pa.valueText) {
          groupedByAttribute.set(pa.attributeId, {
            attributeId: pa.attributeId,
            valueText: pa.valueText,
          });
        } else if (pa.attribute.type === 'number' && pa.valueNumber !== null && pa.valueNumber !== undefined) {
          groupedByAttribute.set(pa.attributeId, {
            attributeId: pa.attributeId,
            valueNumber: pa.valueNumber,
          });
        }
      });
      
      setSelectedAttributes(groupedByAttribute);
    }
  }, [productAttributes, attributes]);

  useEffect(() => {
    // Notificar cambios
    const attributesArray = Array.from(selectedAttributes.values());
    onAttributesChange(attributesArray);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttributes]);

  const loadAttributes = async () => {
    setLoading(true);
    try {
      const { ok, attributes: attributesData } = await getAllAttributes(companyId);
      if (ok && attributesData) {
        setAttributes(attributesData);
      }
    } catch (error) {
      console.error('Error al cargar atributos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttribute = (attributeId: string) => {
    const attribute = attributes.find(a => a.id === attributeId);
    if (!attribute) return;

    const newValue: ProductAttributeValue = {
      attributeId,
    };

    if (attribute.type === 'select' || attribute.type === 'multiselect') {
      newValue.attributeValueIds = [];
    } else if (attribute.type === 'text') {
      newValue.valueText = '';
    } else if (attribute.type === 'number') {
      newValue.valueNumber = 0;
    }

    setSelectedAttributes(prev => {
      const newMap = new Map(prev);
      newMap.set(attributeId, newValue);
      return newMap;
    });
  };

  const handleRemoveAttribute = (attributeId: string) => {
    setSelectedAttributes(prev => {
      const newMap = new Map(prev);
      newMap.delete(attributeId);
      return newMap;
    });
  };

  const handleValueChange = (attributeId: string, value: string | number | string[]) => {
    setSelectedAttributes(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(attributeId);
      if (!existing) return prev;

      const attribute = attributes.find(a => a.id === attributeId);
      if (!attribute) return prev;

      const updated: ProductAttributeValue = { ...existing };

      if (attribute.type === 'select') {
        updated.attributeValueIds = [value as string];
      } else if (attribute.type === 'multiselect') {
        updated.attributeValueIds = value as string[];
      } else if (attribute.type === 'text') {
        updated.valueText = value as string;
      } else if (attribute.type === 'number') {
        updated.valueNumber = value as number;
      }

      newMap.set(attributeId, updated);
      return newMap;
    });
  };

  const handleToggleMultiselectValue = (attributeId: string, valueId: string) => {
    setSelectedAttributes(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(attributeId);
      if (!existing) return prev;

      const updated: ProductAttributeValue = { ...existing };
      if (!updated.attributeValueIds) {
        updated.attributeValueIds = [];
      }

      const index = updated.attributeValueIds.indexOf(valueId);
      if (index > -1) {
        updated.attributeValueIds.splice(index, 1);
      } else {
        updated.attributeValueIds.push(valueId);
      }

      newMap.set(attributeId, updated);
      return newMap;
    });
  };

  const handleCreateAttributeValue = async (attributeId: string) => {
    if (!newValueText.trim()) return;

    setCreatingValue(true);
    try {
      const { ok, attributeValue, message } = await createAttributeValue({
        attributeId,
        value: newValueText.trim(),
      });

      if (ok && attributeValue) {
        // Actualizar la lista de atributos para incluir el nuevo valor
        setAttributes(prev => prev.map(attr => {
          if (attr.id === attributeId) {
            return {
              ...attr,
              values: [...attr.values, { id: attributeValue.id, value: attributeValue.value }]
                .sort((a, b) => a.value.localeCompare(b.value))
            };
          }
          return attr;
        }));

        // Seleccionar automáticamente el nuevo valor
        const attribute = attributes.find(a => a.id === attributeId);
        if (attribute) {
          if (attribute.type === 'select') {
            handleValueChange(attributeId, attributeValue.id);
          } else if (attribute.type === 'multiselect') {
            handleToggleMultiselectValue(attributeId, attributeValue.id);
          }
        }

        // Limpiar el input y cerrar el modo de agregar
        setNewValueText('');
        setAddingValueForAttribute(null);
        showSuccessToast('Valor de atributo creado exitosamente');
      } else {
        showErrorToast(message || 'No se pudo crear el valor');
      }
    } catch (error) {
      console.error('Error al crear valor de atributo:', error);
      showErrorToast('Error al crear el valor');
    } finally {
      setCreatingValue(false);
    }
  };

  const availableAttributes = attributes.filter(
    attr => !selectedAttributes.has(attr.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Atributos del Producto</h3>
        {availableAttributes.length > 0 && (
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddAttribute(e.target.value);
                  e.target.value = '';
                }
              }}
              className="p-2 border rounded-md bg-gray-200 text-sm"
              defaultValue=""
            >
              <option value="">Agregar atributo...</option>
              {availableAttributes.map((attr) => (
                <option key={attr.id} value={attr.id}>
                  {attr.name} ({attr.type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-4 text-gray-600">
          Cargando atributos...
        </div>
      )}

      {Array.from(selectedAttributes.entries()).map(([attributeId, productAttr]) => {
        const attribute = attributes.find(a => a.id === attributeId);
        if (!attribute) return null;

        return (
          <div
            key={attributeId}
            className="p-4 border border-gray-200 rounded-lg bg-gray-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-800">{attribute.name}</h4>
                <span className="text-xs text-gray-500 capitalize">{attribute.type}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAttribute(attributeId)}
                className="p-1 hover:bg-red-100 rounded-full transition-colors text-red-600"
                aria-label="Eliminar atributo"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>

            {/* Render según el tipo de atributo */}
            {attribute.type === 'text' && (
              <input
                type="text"
                value={productAttr.valueText || ''}
                onChange={(e) => handleValueChange(attributeId, e.target.value)}
                className="w-full p-2 border rounded-md bg-white"
                placeholder={`Ingrese ${attribute.name.toLowerCase()}`}
              />
            )}

            {attribute.type === 'number' && (
              <input
                type="number"
                value={productAttr.valueNumber ?? ''}
                onChange={(e) => handleValueChange(attributeId, parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded-md bg-white"
                placeholder={`Ingrese ${attribute.name.toLowerCase()}`}
                step="any"
              />
            )}

            {attribute.type === 'select' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={productAttr.attributeValueIds?.[0] || ''}
                    onChange={(e) => handleValueChange(attributeId, e.target.value)}
                    className="flex-1 p-2 border rounded-md bg-white"
                  >
                    <option value="">Seleccione un valor...</option>
                    {attribute.values.map((val) => (
                      <option key={val.id} value={val.id}>
                        {val.value}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingValueForAttribute(attributeId);
                      setNewValueText('');
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                    title="Agregar nuevo valor"
                  >
                    <IoAddOutline size={18} />
                  </button>
                </div>
                {addingValueForAttribute === attributeId && (
                  <div className="flex gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <input
                      type="text"
                      value={newValueText}
                      onChange={(e) => setNewValueText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !creatingValue) {
                          handleCreateAttributeValue(attributeId);
                        } else if (e.key === 'Escape') {
                          setAddingValueForAttribute(null);
                          setNewValueText('');
                        }
                      }}
                      placeholder="Nuevo valor..."
                      className="flex-1 p-2 border rounded-md bg-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleCreateAttributeValue(attributeId)}
                      disabled={!newValueText.trim() || creatingValue}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {creatingValue ? (
                        <span className="text-sm">...</span>
                      ) : (
                        <IoCheckmarkOutline size={18} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingValueForAttribute(null);
                        setNewValueText('');
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      <IoCloseOutline size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {attribute.type === 'multiselect' && (
              <div className="space-y-2">
                {attribute.values.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay valores disponibles para este atributo</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {attribute.values.map((val) => {
                        const isSelected = productAttr.attributeValueIds?.includes(val.id) || false;
                        return (
                          <label
                            key={val.id}
                            className={`
                              flex items-center p-2 border rounded-md cursor-pointer transition-all
                              ${isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleMultiselectValue(attributeId, val.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className={`ml-2 text-sm ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                              {val.value}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {addingValueForAttribute === attributeId ? (
                      <div className="flex gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <input
                          type="text"
                          value={newValueText}
                          onChange={(e) => setNewValueText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !creatingValue) {
                              handleCreateAttributeValue(attributeId);
                            } else if (e.key === 'Escape') {
                              setAddingValueForAttribute(null);
                              setNewValueText('');
                            }
                          }}
                          placeholder="Nuevo valor..."
                          className="flex-1 p-2 border rounded-md bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleCreateAttributeValue(attributeId)}
                          disabled={!newValueText.trim() || creatingValue}
                          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {creatingValue ? (
                            <span className="text-sm">...</span>
                          ) : (
                            <IoCheckmarkOutline size={18} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingValueForAttribute(null);
                            setNewValueText('');
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          <IoCloseOutline size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingValueForAttribute(attributeId);
                          setNewValueText('');
                        }}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <IoAddOutline size={18} />
                        Agregar nuevo valor
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {selectedAttributes.size === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
          <p>No hay atributos asignados</p>
          <p className="text-sm mt-1">Use el selector de arriba para agregar atributos</p>
        </div>
      )}
    </div>
  );
};
