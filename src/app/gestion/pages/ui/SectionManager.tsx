'use client';

import { useState } from 'react';
import { deleteSection, updateSection } from '@/actions';
import { IoAddOutline, IoCreateOutline, IoTrashOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoArrowUpOutline, IoArrowDownOutline } from 'react-icons/io5';
import { SectionFormModal } from './SectionFormModal';
import clsx from 'clsx';

interface PageSection {
  id: string;
  type: 'HERO' | 'BANNER' | 'TEXT' | 'IMAGE' | 'FEATURES' | 'GALLERY' | 'CTA';
  position: number;
  enabled: boolean;
  content: Record<string, unknown>;
}

interface Props {
  pageId: string;
  sections: PageSection[];
  onUpdate: () => void;
}

// Función helper para obtener un preview del contenido de la sección
const getSectionPreview = (section: PageSection): string => {
  const content = section.content as Record<string, unknown>;
  
  switch (section.type) {
    case 'HERO':
      return content.title as string || content.subtitle as string || 'Sin título';
    case 'BANNER':
      return content.text as string || 'Sin texto';
    case 'TEXT':
      return content.title as string || (content.content as string)?.substring(0, 50) || 'Sin contenido';
    case 'IMAGE':
      return content.caption as string || content.alt as string || 'Sin descripción';
    case 'FEATURES':
      return content.title as string || 'Sin título';
    case 'GALLERY':
      return content.title as string || 'Sin título';
    case 'CTA':
      return content.title as string || content.description as string || 'Sin contenido';
    default:
      return 'Sin contenido';
  }
};

export const SectionManager = ({ pageId, sections, onUpdate }: Props) => {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (sectionId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta sección?')) {
      return;
    }

    setLoading(sectionId);
    const result = await deleteSection(sectionId);
    if (result.ok) {
      // Usar setTimeout para dar tiempo a que el servidor procese antes de refrescar
      setTimeout(() => {
        onUpdate();
        setLoading(null);
      }, 150);
    } else {
      alert(result.message);
      setLoading(null);
    }
  };

  const handleToggleEnabled = async (sectionId: string, currentEnabled: boolean) => {
    setLoading(sectionId);
    const result = await updateSection({
      sectionId,
      enabled: !currentEnabled,
    });
    if (result.ok) {
      // Usar setTimeout para dar tiempo a que el servidor procese antes de refrescar
      setTimeout(() => {
        onUpdate();
        setLoading(null);
      }, 150);
    } else {
      alert(result.message);
      setLoading(null);
    }
  };

  const handleMoveUp = async (section: PageSection) => {
    if (section.position === 1) return;

    const prevSection = sections.find(s => s.position === section.position - 1);
    if (!prevSection) return;

    setLoading(section.id);
    
    try {
      await Promise.all([
        updateSection({ sectionId: section.id, position: section.position - 1 }),
        updateSection({ sectionId: prevSection.id, position: prevSection.position + 1 }),
      ]);
      // Refrescar después de un pequeño delay para que el servidor procese
      setTimeout(() => {
        onUpdate();
        setLoading(null);
      }, 150);
    } catch (error) {
      alert('Error al mover la sección');
      setLoading(null);
    }
  };

  const handleMoveDown = async (section: PageSection) => {
    const maxPosition = Math.max(...sections.map(s => s.position));
    if (section.position === maxPosition) return;

    const nextSection = sections.find(s => s.position === section.position + 1);
    if (!nextSection) return;

    setLoading(section.id);
    
    try {
      await Promise.all([
        updateSection({ sectionId: section.id, position: section.position + 1 }),
        updateSection({ sectionId: nextSection.id, position: nextSection.position - 1 }),
      ]);
      // Refrescar después de un pequeño delay para que el servidor procese
      setTimeout(() => {
        onUpdate();
        setLoading(null);
      }, 150);
    } catch (error) {
      alert('Error al mover la sección');
      setLoading(null);
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.position - b.position);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Secciones ({sections.length})</h4>
        <button
          onClick={() => setIsFormModalOpen(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <IoAddOutline size={14} />
          Agregar Sección
        </button>
      </div>

      {sortedSections.length === 0 ? (
        <p className="text-sm text-gray-500">No hay secciones configuradas</p>
      ) : (
        <div className="space-y-2">
          {sortedSections.map((section) => {
            const isLoading = loading === section.id;
            const isEditing = editingSectionId === section.id;

            return (
              <div
                key={section.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(section)}
                      disabled={isLoading || section.position === 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <IoArrowUpOutline size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(section)}
                      disabled={isLoading || section.position === Math.max(...sections.map(s => s.position))}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <IoArrowDownOutline size={14} />
                    </button>
                  </div>

                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    {section.type}
                  </span>
                  <span className="text-sm text-gray-600">
                    Posición: {section.position}
                  </span>
                  {section.enabled ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                      Habilitada
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      Deshabilitada
                    </span>
                  )}
                  
                  {/* Mostrar contenido relevante según el tipo */}
                  <div className="flex-1 ml-2">
                    <span className="text-sm text-gray-700 font-medium">
                      {getSectionPreview(section)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingSectionId(section.id);
                      setIsFormModalOpen(true);
                    }}
                    disabled={isLoading}
                    className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    title="Editar"
                  >
                    <IoCreateOutline size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleEnabled(section.id, section.enabled)}
                    disabled={isLoading}
                    className={clsx(
                      'p-1 disabled:opacity-50',
                      {
                        'text-green-600 hover:text-green-700': section.enabled,
                        'text-gray-600 hover:text-gray-700': !section.enabled,
                      }
                    )}
                    title={section.enabled ? 'Deshabilitar' : 'Habilitar'}
                  >
                    {section.enabled ? (
                      <IoCheckmarkCircleOutline size={16} />
                    ) : (
                      <IoCloseCircleOutline size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(section.id)}
                    disabled={isLoading}
                    className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                    title="Eliminar"
                  >
                    <IoTrashOutline size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingSectionId(null);
        }}
        onSuccess={() => {
          setIsFormModalOpen(false);
          setEditingSectionId(null);
          onUpdate();
        }}
        pageId={pageId}
        editingSection={editingSectionId ? sections.find(s => s.id === editingSectionId) : undefined}
      />
    </div>
  );
};
