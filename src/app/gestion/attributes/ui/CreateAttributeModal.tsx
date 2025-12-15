'use client';

import { useState, useEffect } from 'react';
import { createAttribute, updateAttribute } from '@/actions';
import { IoCloseOutline } from 'react-icons/io5';
import { AttributeType } from '@prisma/client';

interface Attribute {
  id: string;
  name: string;
  type: AttributeType;
  required?: boolean;
  companyId: string;
  values: Array<{ id: string; value: string }>;
}

interface CreateAttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  attribute?: Attribute | null;
}

const ATTRIBUTE_TYPES: { value: AttributeType; label: string; description: string }[] = [
  { value: 'text', label: 'Texto', description: 'Campo de texto libre' },
  { value: 'number', label: 'Número', description: 'Campo numérico' },
  { value: 'select', label: 'Select', description: 'Selección única (requiere valores)' },
  { value: 'multiselect', label: 'Multiselect', description: 'Selección múltiple (requiere valores)' },
];

export const CreateAttributeModal = ({ isOpen, onClose, onSuccess, attribute }: CreateAttributeModalProps) => {
  const [name, setName] = useState(attribute?.name || '');
  const [type, setType] = useState<AttributeType>(attribute?.type || 'text');
  const [required, setRequired] = useState(attribute?.required ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!attribute;

  // Actualizar estado cuando cambia el atributo (al abrir modal de edición)
  useEffect(() => {
    if (attribute) {
      setName(attribute.name);
      setType(attribute.type);
      setRequired(attribute.required ?? false);
    } else {
      setName('');
      setType('text');
      setRequired(false);
    }
  }, [attribute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      
      if (isEditing) {
        result = await updateAttribute({
          attributeId: attribute.id,
          name: name.trim(),
          type,
          required,
        });
      } else {
        result = await createAttribute({
          name: name.trim(),
          type,
          required,
        });
      }

      if (result.ok) {
        setName('');
        setType('text');
        setRequired(false);
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Error al guardar el atributo');
      }
    } catch (error) {
      setError('Error inesperado al guardar el atributo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(attribute?.name || '');
    setType(attribute?.type || 'text');
    setRequired(attribute?.required ?? false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Editar Atributo' : 'Nuevo Atributo'}
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
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Atributo
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Talla, Color, Material"
              required
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Atributo
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as AttributeType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {ATTRIBUTE_TYPES.map((attrType) => (
                <option key={attrType.value} value={attrType.value}>
                  {attrType.label} - {attrType.description}
                </option>
              ))}
            </select>
            {(type === 'select' || type === 'multiselect') && (
              <p className="mt-2 text-sm text-gray-600">
                💡 Los atributos de tipo Select o Multiselect requieren valores. Podrás agregarlos después de crear el atributo.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Atributo obligatorio
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 ml-6">
              Si está marcado, los clientes deberán seleccionar un valor para este atributo antes de agregar el producto al carrito.
            </p>
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
              disabled={loading || !name.trim()}
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

