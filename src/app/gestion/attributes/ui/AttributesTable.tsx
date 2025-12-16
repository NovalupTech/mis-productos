'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateAttribute, deleteAttribute } from '@/actions';
import { IoPencilOutline, IoTrashOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import { AttributeType } from '@prisma/client';
import { AttributeValuesManager } from './AttributeValuesManager';
import { CreateAttributeModal } from './CreateAttributeModal';

interface AttributeValue {
  id: string;
  value: string;
}

interface Attribute {
  id: string;
  name: string;
  type: AttributeType;
  required?: boolean;
  companyId: string;
  values: AttributeValue[];
}

interface Props {
  attributes: Attribute[];
}

const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
  text: 'Texto',
  number: 'Número',
  select: 'Select',
  multiselect: 'Multiselect',
};

export const AttributesTable = ({ attributes }: Props) => {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingModalOpen, setEditingModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [formData, setFormData] = useState<Record<string, { name: string; type: AttributeType }>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (attribute: Attribute) => {
    setEditingAttribute(attribute);
    setEditingModalOpen(true);
  };

  const handleDelete = async (attributeId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este atributo? Esta acción eliminará todos sus valores y las asociaciones con productos.')) {
      return;
    }

    setDeletingId(attributeId);
    const result = await deleteAttribute(attributeId);
    
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.message || 'Error al eliminar el atributo');
    }
    setDeletingId(null);
  };

  const handleSuccess = () => {
    setEditingModalOpen(false);
    setEditingAttribute(null);
    router.refresh();
  };

  if (attributes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No hay atributos disponibles. Crea tu primer atributo.</p>
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
                Obligatorio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valores
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attributes.map((attribute) => {
              const isExpanded = expandedId === attribute.id;
              const isDeleting = deletingId === attribute.id;
              const needsValues = attribute.type === 'select' || attribute.type === 'multiselect';
              const valuesCount = attribute.values?.length || 0;

              return (
                <>
                  <tr key={attribute.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{attribute.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {ATTRIBUTE_TYPE_LABELS[attribute.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attribute.required ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                          <IoCheckmarkCircleOutline size={16} />
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          <IoCloseCircleOutline size={16} />
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {valuesCount} {valuesCount === 1 ? 'valor' : 'valores'}
                        </span>
                        {needsValues && valuesCount === 0 && (
                          <span className="text-xs text-orange-600 font-semibold">
                            (requiere valores)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : attribute.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title={isExpanded ? 'Ocultar valores' : 'Ver/Editar valores'}
                        >
                          {isExpanded ? <IoChevronUpOutline size={20} /> : <IoChevronDownOutline size={20} />}
                        </button>
                        <button
                          onClick={() => handleEdit(attribute)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <IoPencilOutline size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(attribute.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Eliminar"
                        >
                          <IoTrashOutline size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50">
                        <AttributeValuesManager 
                          attribute={attribute}
                          onSuccess={() => router.refresh()}
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {attributes.map((attribute) => {
          const isExpanded = expandedId === attribute.id;
          const isDeleting = deletingId === attribute.id;
          const needsValues = attribute.type === 'select' || attribute.type === 'multiselect';
          const valuesCount = attribute.values?.length || 0;

          return (
            <div key={attribute.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{attribute.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {ATTRIBUTE_TYPE_LABELS[attribute.type]}
                    </span>
                    {attribute.required ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                        <IoCheckmarkCircleOutline size={12} />
                        Obligatorio
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        <IoCloseCircleOutline size={12} />
                        Opcional
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">
                      {valuesCount} {valuesCount === 1 ? 'valor' : 'valores'}
                    </span>
                    {needsValues && valuesCount === 0 && (
                      <span className="ml-2 text-xs text-orange-600 font-semibold">
                        (requiere valores)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : attribute.id)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title={isExpanded ? 'Ocultar valores' : 'Ver/Editar valores'}
                  >
                    {isExpanded ? <IoChevronUpOutline size={20} /> : <IoChevronDownOutline size={20} />}
                  </button>
                  <button
                    onClick={() => handleEdit(attribute)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Editar"
                  >
                    <IoPencilOutline size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(attribute.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1"
                    title="Eliminar"
                  >
                    <IoTrashOutline size={20} />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <AttributeValuesManager 
                    attribute={attribute}
                    onSuccess={() => router.refresh()}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de edición */}
      <CreateAttributeModal
        isOpen={editingModalOpen}
        onClose={() => {
          setEditingModalOpen(false);
          setEditingAttribute(null);
        }}
        onSuccess={handleSuccess}
        attribute={editingAttribute}
      />
    </>
  );
};

