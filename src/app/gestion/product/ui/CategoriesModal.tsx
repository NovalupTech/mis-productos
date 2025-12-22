'use client';

import { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/actions';
import { Category } from '@/interfaces';
import { IoCloseOutline, IoAddOutline, IoCheckmarkOutline, IoCreateOutline, IoTrashOutline } from 'react-icons/io5';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { confirmDelete } from '@/utils/confirm';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange: (categories: Category[]) => void;
  companyId?: string;
}

export const CategoriesModal = ({ isOpen, onClose, onCategoriesChange, companyId }: CategoriesModalProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, companyId]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const categoriesData = await getCategories(companyId);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setCreatingCategory(true);
    try {
      const { ok, category, message } = await createCategory({
        name: newCategoryName.trim(),
      });

      if (ok && category) {
        // Agregar la nueva categoría a la lista y ordenar alfabéticamente
        const updatedCategories = [...categories, category].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setCategories(updatedCategories);
        onCategoriesChange(updatedCategories);

        // Limpiar el input y cerrar el modo de agregar
        setNewCategoryName('');
        setIsAddingCategory(false);
        showSuccessToast('Categoría creada exitosamente');
      } else {
        showErrorToast(message || 'No se pudo crear la categoría');
      }
    } catch (error) {
      console.error('Error al crear categoría:', error);
      showErrorToast('Error al crear la categoría');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editingName.trim()) return;

    setUpdatingCategory(true);
    try {
      const { ok, category, message } = await updateCategory({
        id: categoryId,
        name: editingName.trim(),
      });

      if (ok && category) {
        // Actualizar la categoría en la lista y ordenar alfabéticamente
        const updatedCategories = categories
          .map(cat => cat.id === categoryId ? category : cat)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategories(updatedCategories);
        onCategoriesChange(updatedCategories);

        // Limpiar el estado de edición
        setEditingId(null);
        setEditingName('');
        showSuccessToast('Categoría actualizada exitosamente');
      } else {
        showErrorToast(message || 'No se pudo actualizar la categoría');
      }
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      showErrorToast('Error al actualizar la categoría');
    } finally {
      setUpdatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const confirmed = await confirmDelete(
      '¿Estás seguro de que deseas eliminar esta categoría?',
      () => {}
    );
    
    if (!confirmed) return;

    setDeletingId(categoryId);
    try {
      const { ok, message } = await deleteCategory(categoryId);

      if (ok) {
        // Eliminar la categoría de la lista
        const updatedCategories = categories.filter(cat => cat.id !== categoryId);
        setCategories(updatedCategories);
        onCategoriesChange(updatedCategories);
        showSuccessToast('Categoría eliminada exitosamente');
      } else {
        showErrorToast(message || 'No se pudo eliminar la categoría');
      }
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      showErrorToast('Error al eliminar la categoría');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Gestionar Categorías</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Sección para agregar nueva categoría */}
          {isAddingCategory ? (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !creatingCategory) {
                      handleCreateCategory();
                    } else if (e.key === 'Escape') {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }
                  }}
                  placeholder="Nombre de la nueva categoría..."
                  className="flex-1 p-2 border rounded-md bg-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || creatingCategory}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {creatingCategory ? (
                    <span className="text-sm">...</span>
                  ) : (
                    <IoCheckmarkOutline size={18} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <IoCloseOutline size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(true);
                  setNewCategoryName('');
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <IoAddOutline size={20} />
                Agregar nueva categoría
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-600">Cargando categorías...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-600">No hay categorías disponibles</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => {
                const isEditing = editingId === category.id;
                const isDeleting = deletingId === category.id;

                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !updatingCategory) {
                              handleUpdateCategory(category.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="flex-1 p-2 border rounded-md bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateCategory(category.id)}
                          disabled={!editingName.trim() || updatingCategory}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingCategory ? '...' : 'Guardar'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={updatingCategory}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-gray-700 font-medium">{category.name}</span>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(category)}
                          disabled={isDeleting}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                          title="Editar categoría"
                        >
                          <IoCreateOutline size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={isDeleting}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="Eliminar categoría"
                        >
                          {isDeleting ? (
                            <span className="text-sm">...</span>
                          ) : (
                            <IoTrashOutline size={18} />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
