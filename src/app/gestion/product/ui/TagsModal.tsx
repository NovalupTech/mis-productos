'use client';

import { useEffect, useState } from 'react';
import { getAllTags, createTag } from '@/actions';
import { Tag } from '@/interfaces';
import { IoCloseOutline, IoAddOutline, IoCheckmarkOutline } from 'react-icons/io5';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

interface TagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[], tagNames: string[]) => void;
  companyId?: string;
}

export const TagsModal = ({ isOpen, onClose, selectedTagIds, onTagsChange, companyId }: TagsModalProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(selectedTagIds));
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTags(new Set(selectedTagIds));
      loadTags();
    }
  }, [isOpen, selectedTagIds, companyId]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const { ok, tags: tagsData } = await getAllTags();
      if (ok && tagsData) {
        setTags(tagsData);
      }
    } catch (error) {
      console.error('Error al cargar tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setCreatingTag(true);
    try {
      const { ok, tag, message } = await createTag({
        name: newTagName.trim(),
      });

      if (ok && tag) {
        // Agregar el nuevo tag a la lista y ordenar alfabéticamente
        setTags(prev => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));

        // Seleccionar automáticamente el nuevo tag
        setSelectedTags(prev => {
          const newSet = new Set(prev);
          newSet.add(tag.id);
          return newSet;
        });

        // Limpiar el input y cerrar el modo de agregar
        setNewTagName('');
        setIsAddingTag(false);
        showSuccessToast('Tag creado exitosamente');
      } else {
        showErrorToast(message || 'No se pudo crear el tag');
      }
    } catch (error) {
      console.error('Error al crear tag:', error);
      showErrorToast('Error al crear el tag');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleSave = () => {
    const selectedIds = Array.from(selectedTags);
    const selectedNames = tags
      .filter(tag => selectedTags.has(tag.id))
      .map(tag => tag.name);
    onTagsChange(selectedIds, selectedNames);
    onClose();
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
          <h2 className="text-xl font-bold text-gray-800">Seleccionar Tags</h2>
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
          {/* Sección para agregar nuevo tag */}
          {isAddingTag ? (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !creatingTag) {
                      handleCreateTag();
                    } else if (e.key === 'Escape') {
                      setIsAddingTag(false);
                      setNewTagName('');
                    }
                  }}
                  placeholder="Nombre del nuevo tag..."
                  className="flex-1 p-2 border rounded-md bg-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || creatingTag}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {creatingTag ? (
                    <span className="text-sm">...</span>
                  ) : (
                    <IoCheckmarkOutline size={18} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTag(false);
                    setNewTagName('');
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
                  setIsAddingTag(true);
                  setNewTagName('');
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <IoAddOutline size={20} />
                Agregar nuevo tag
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-600">Cargando tags...</p>
            </div>
          ) : tags.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-600">No hay tags disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tags.map((tag) => {
                const isSelected = selectedTags.has(tag.id);
                return (
                  <label
                    key={tag.id}
                    className={`
                      flex items-center p-3 border rounded-lg cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleTagToggle(tag.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className={`ml-3 ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                      {tag.name}
                    </span>
                  </label>
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
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Guardar ({selectedTags.size} seleccionados)
          </button>
        </div>
      </div>
    </div>
  );
};
