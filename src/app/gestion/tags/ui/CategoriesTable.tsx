'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCategory, deleteCategory } from '@/actions';
import { IoPencilOutline, IoTrashOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import { Category } from '@/interfaces';
import { showErrorToast, showWarningToast, showSuccessToast } from '@/utils/toast';
import { confirmDelete } from '@/utils/confirm';

interface Props {
  categories: Category[];
}

export const CategoriesTable = ({ categories }: Props) => {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      ...formData,
      [category.id]: category.name,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (categoryId: string) => {
    setLoading(categoryId);
    const name = formData[categoryId];
    
    if (name && name.trim()) {
      const result = await updateCategory({
        id: categoryId,
        name: name.trim(),
      });
      
      if (result.ok) {
        setEditingId(null);
        showSuccessToast('Categoría actualizada exitosamente');
        router.refresh();
      } else {
        showErrorToast(result.message || 'Error al actualizar la categoría');
      }
    } else {
      showWarningToast('El nombre de la categoría no puede estar vacío');
    }
    setLoading(null);
  };

  const handleDelete = async (categoryId: string) => {
    const confirmed = await confirmDelete(
      '¿Estás seguro de que deseas eliminar esta categoría? Esta acción eliminará todas las asociaciones con productos.',
      () => {}
    );
    
    if (!confirmed) return;

    setDeletingId(categoryId);
    const result = await deleteCategory(categoryId);
    
    if (result.ok) {
      showSuccessToast('Categoría eliminada exitosamente');
      router.refresh();
    } else {
      showErrorToast(result.message || 'Error al eliminar la categoría');
    }
    setDeletingId(null);
  };

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No hay categorías disponibles. Crea tu primera categoría.</p>
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => {
              const isEditing = editingId === category.id;
              const isLoading = loading === category.id;
              const isDeleting = deletingId === category.id;

              return (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData[category.id] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [category.id]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(category.id)}
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
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <IoPencilOutline size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
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
        {categories.map((category) => {
          const isEditing = editingId === category.id;
          const isLoading = loading === category.id;
          const isDeleting = deletingId === category.id;

          return (
            <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData[category.id] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [category.id]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleSave(category.id)}
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
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{category.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Editar"
                    >
                      <IoPencilOutline size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
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
