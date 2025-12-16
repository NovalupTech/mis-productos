'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTag, deleteTag } from '@/actions';
import { IoPencilOutline, IoTrashOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import { Tag } from '@/interfaces';

interface Props {
  tags: Tag[];
}

export const TagsTable = ({ tags }: Props) => {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setFormData({
      ...formData,
      [tag.id]: tag.name,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (tagId: string) => {
    setLoading(tagId);
    const name = formData[tagId];
    
    if (name && name.trim()) {
      const result = await updateTag({
        tagId,
        name: name.trim(),
      });
      
      if (result.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        alert(result.message || 'Error al actualizar el tag');
      }
    } else {
      alert('El nombre del tag no puede estar vacío');
    }
    setLoading(null);
  };

  const handleDelete = async (tagId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este tag? Esta acción eliminará todas las asociaciones con productos.')) {
      return;
    }

    setDeletingId(tagId);
    const result = await deleteTag(tagId);
    
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.message || 'Error al eliminar el tag');
    }
    setDeletingId(null);
  };

  if (tags.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No hay tags disponibles. Crea tu primer tag.</p>
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
                Fecha de creación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tags.map((tag) => {
              const isEditing = editingId === tag.id;
              const isLoading = loading === tag.id;
              const isDeleting = deletingId === tag.id;

              return (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData[tag.id] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [tag.id]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{tag.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {new Date(tag.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(tag.id)}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Guardar"
                        >
                          <IoCheckmarkCircleOutline size={20} />
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Cancelar"
                        >
                          <IoCloseCircleOutline size={20} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(tag)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <IoPencilOutline size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Eliminar"
                        >
                          <IoTrashOutline size={20} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {tags.map((tag) => {
          const isEditing = editingId === tag.id;
          const isLoading = loading === tag.id;
          const isDeleting = deletingId === tag.id;

          return (
            <div key={tag.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData[tag.id] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [tag.id]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleSave(tag.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      <IoCheckmarkCircleOutline size={16} />
                      Guardar
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm"
                    >
                      <IoCloseCircleOutline size={16} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{tag.name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(tag.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Editar"
                    >
                      <IoPencilOutline size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1"
                      title="Eliminar"
                    >
                      <IoTrashOutline size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
