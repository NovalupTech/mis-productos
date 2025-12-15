'use client';

import { useState } from 'react';
import { createAttributeValue, updateAttributeValue, deleteAttributeValue } from '@/actions';
import { IoAddOutline, IoPencilOutline, IoTrashOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';

interface AttributeValue {
  id: string;
  value: string;
}

interface Attribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  companyId: string;
  values: AttributeValue[];
}

interface Props {
  attribute: Attribute;
  onSuccess: () => void;
}

export const AttributeValuesManager = ({ attribute, onSuccess }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const needsValues = attribute.type === 'select' || attribute.type === 'multiselect';

  const handleAdd = async () => {
    if (!newValue.trim()) {
      alert('El valor no puede estar vacío');
      return;
    }

    setLoading('new');
    const result = await createAttributeValue({
      attributeId: attribute.id,
      value: newValue.trim(),
    });

    if (result.ok) {
      setNewValue('');
      setIsAdding(false);
      onSuccess();
    } else {
      alert(result.message || 'Error al crear el valor');
    }
    setLoading(null);
  };

  const handleEdit = (value: AttributeValue) => {
    setEditingId(value.id);
    setFormData({
      ...formData,
      [value.id]: value.value,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (valueId: string) => {
    setLoading(valueId);
    const value = formData[valueId];
    
    if (value && value.trim()) {
      const result = await updateAttributeValue({
        attributeValueId: valueId,
        value: value.trim(),
      });
      
      if (result.ok) {
        setEditingId(null);
        onSuccess();
      } else {
        alert(result.message || 'Error al actualizar el valor');
      }
    } else {
      alert('El valor no puede estar vacío');
    }
    setLoading(null);
  };

  const handleDelete = async (valueId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este valor? Esta acción eliminará todas las asociaciones con productos.')) {
      return;
    }

    setDeletingId(valueId);
    const result = await deleteAttributeValue(valueId);
    
    if (result.ok) {
      onSuccess();
    } else {
      alert(result.message || 'Error al eliminar el valor');
    }
    setDeletingId(null);
  };

  if (!needsValues) {
    return (
      <div className="text-sm text-gray-500 italic">
        Los atributos de tipo "{attribute.type}" no requieren valores predefinidos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Valores para "{attribute.name}"
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <IoAddOutline size={16} />
            <span>Agregar Valor</span>
          </button>
        )}
      </div>

      {/* Formulario para agregar nuevo valor */}
      {isAdding && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              } else if (e.key === 'Escape') {
                setIsAdding(false);
                setNewValue('');
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Nombre del valor"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={loading === 'new' || !newValue.trim()}
            className="text-green-600 hover:text-green-900 disabled:opacity-50"
            title="Guardar"
          >
            <IoCheckmarkCircleOutline size={20} />
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewValue('');
            }}
            disabled={loading === 'new'}
            className="text-red-600 hover:text-red-900 disabled:opacity-50"
            title="Cancelar"
          >
            <IoCloseCircleOutline size={20} />
          </button>
        </div>
      )}

      {/* Lista de valores */}
      {attribute.values.length === 0 ? (
        <div className="text-sm text-gray-500 italic py-2">
          No hay valores definidos. Agrega valores para este atributo.
        </div>
      ) : (
        <div className="space-y-2">
          {attribute.values.map((value) => {
            const isEditing = editingId === value.id;
            const isLoading = loading === value.id;
            const isDeleting = deletingId === value.id;

            return (
              <div
                key={value.id}
                className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200"
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={formData[value.id] || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [value.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSave(value.id);
                        } else if (e.key === 'Escape') {
                          handleCancel();
                        }
                      }}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(value.id)}
                      disabled={isLoading}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      title="Guardar"
                    >
                      <IoCheckmarkCircleOutline size={18} />
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Cancelar"
                    >
                      <IoCloseCircleOutline size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-700">{value.value}</span>
                    <button
                      onClick={() => handleEdit(value)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar"
                    >
                      <IoPencilOutline size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(value.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Eliminar"
                    >
                      <IoTrashOutline size={18} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

