'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updatePage } from '@/actions/page/update-page';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoStarOutline, IoStar, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import clsx from 'clsx';
import { SectionManager } from './SectionManager';

interface PageSection {
  id: string;
  type: 'HERO' | 'BANNER' | 'TEXT' | 'IMAGE' | 'FEATURES' | 'GALLERY' | 'CTA';
  position: number;
  enabled: boolean;
  content: Record<string, unknown>;
}

interface Page {
  id: string;
  type: 'HOME' | 'CATALOG' | 'INFO';
  slug: string;
  title: string;
  enabled: boolean;
  isLanding: boolean;
  sections: PageSection[];
}

interface Props {
  pages: Page[];
}

export const PagesTable = ({ pages }: Props) => {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, { slug: string; title: string }>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const handleEdit = (page: Page) => {
    setEditingId(page.id);
    setFormData({
      ...formData,
      [page.id]: {
        slug: page.slug,
        title: page.title,
      },
    });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (pageId: string) => {
    setLoading(pageId);
    const data = formData[pageId];
    const page = pages.find(p => p.id === pageId);
    
    if (data && page) {
      // Si es CATALOG, no actualizar el slug
      const updateData: { pageId: string; title: string; slug?: string } = {
        pageId,
        title: data.title,
      };
      
      // Solo incluir slug si no es CATALOG
      if (page.type !== 'CATALOG') {
        updateData.slug = data.slug;
      }
      
      const result = await updatePage(updateData);
      if (result.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        alert(result.message);
      }
    }
    setLoading(null);
  };

  const handleToggleEnabled = async (pageId: string, currentEnabled: boolean) => {
    setLoading(pageId);
    const result = await updatePage({
      pageId,
      enabled: !currentEnabled,
    });
    if (result.ok) {
      router.refresh();
      // Resetear el estado de carga después de un breve delay para permitir que el refresh complete
      setTimeout(() => {
        setLoading(null);
      }, 150);
    } else {
      alert(result.message);
      setLoading(null);
    }
  };

  const handleToggleLanding = async (pageId: string, currentLanding: boolean) => {
    setLoading(pageId);
    const result = await updatePage({
      pageId,
      isLanding: !currentLanding,
    });
    if (result.ok) {
      router.refresh();
      // Resetear el estado de carga después de un breve delay para permitir que el refresh complete
      setTimeout(() => {
        setLoading(null);
      }, 150);
    } else {
      alert(result.message);
      setLoading(null);
    }
  };

  // Restaurar el estado expandido desde sessionStorage al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedExpandedId = sessionStorage.getItem('expandedPageId');
      if (savedExpandedId && pages.some(p => p.id === savedExpandedId)) {
        setExpandedId(savedExpandedId);
      }
    }
  }, [pages]);

  // Guardar el estado expandido en sessionStorage cuando cambia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (expandedId) {
        sessionStorage.setItem('expandedPageId', expandedId);
      } else {
        sessionStorage.removeItem('expandedPageId');
      }
    }
  }, [expandedId]);

  const toggleExpanded = (pageId: string) => {
    setExpandedId(expandedId === pageId ? null : pageId);
  };

  return (
    <div className="space-y-4">
      {pages.map((page) => {
        const isEditing = editingId === page.id;
        const isExpanded = expandedId === page.id;
        const isLoading = loading === page.id;
        const currentFormData = formData[page.id] || { slug: page.slug, title: page.title };

        return (
          <div
            key={page.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {isEditing ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título
                        </label>
                        <input
                          type="text"
                          value={currentFormData.title}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [page.id]: { ...currentFormData, title: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slug
                          {page.type === 'CATALOG' && (
                            <span className="ml-2 text-xs text-gray-500">(No editable)</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={currentFormData.slug}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [page.id]: { ...currentFormData, slug: e.target.value },
                            })
                          }
                          disabled={page.type === 'CATALOG'}
                          className={clsx(
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            {
                              "bg-gray-100 cursor-not-allowed": page.type === 'CATALOG',
                            }
                          )}
                        />
                        {page.type === 'CATALOG' && (
                          <p className="mt-1 text-xs text-gray-500">
                            El slug de la página CATALOG no puede ser modificado
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:mt-6">
                        <button
                          onClick={() => handleSave(page.id)}
                          disabled={isLoading}
                          className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isLoading}
                          className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{page.title}</h3>
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            {page.type}
                          </span>
                          {page.isLanding && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded flex items-center gap-1">
                              <IoStar size={12} />
                              Landing
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">/{page.slug}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleEdit(page)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Editar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleToggleEnabled(page.id, page.enabled)}
                    disabled={isLoading}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors',
                      {
                        'bg-green-100 text-green-700 hover:bg-green-200': page.enabled,
                        'bg-gray-100 text-gray-700 hover:bg-gray-200': !page.enabled,
                        'opacity-50 cursor-not-allowed': isLoading,
                      }
                    )}
                  >
                    {page.enabled ? (
                      <>
                        <IoCheckmarkCircleOutline size={16} />
                        Habilitada
                      </>
                    ) : (
                      <>
                        <IoCloseCircleOutline size={16} />
                        Deshabilitada
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleLanding(page.id, page.isLanding)}
                    disabled={isLoading}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors',
                      {
                        'bg-yellow-100 text-yellow-700 hover:bg-yellow-200': page.isLanding,
                        'bg-gray-100 text-gray-700 hover:bg-gray-200': !page.isLanding,
                        'opacity-50 cursor-not-allowed': isLoading,
                      }
                    )}
                  >
                    {page.isLanding ? (
                      <>
                        <IoStar size={16} />
                        Es Landing
                      </>
                    ) : (
                      <>
                        <IoStarOutline size={16} />
                        Marcar como Landing
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => toggleExpanded(page.id)}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    {isExpanded ? (
                      <>
                        <IoChevronUpOutline size={16} />
                        Ocultar Secciones
                      </>
                    ) : (
                      <>
                        <IoChevronDownOutline size={16} />
                        Ver Secciones ({page.sections.length})
                      </>
                    )}
                  </button>
                </div>
              )}

              {isExpanded && !isEditing && (
                <SectionManager
                  pageId={page.id}
                  sections={page.sections}
                  onUpdate={() => router.refresh()}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
