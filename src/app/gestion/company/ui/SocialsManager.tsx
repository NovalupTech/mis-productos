'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCompanySocial,
  updateCompanySocial,
  deleteCompanySocial,
  getCompanyConfig,
  updateCompanyConfig,
} from '@/actions';
import { IoAddOutline, IoCreateOutline, IoTrashOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import { FaInstagram, FaFacebook, FaTiktok, FaTwitter, FaLinkedin, FaYoutube, FaWhatsapp, FaGlobe } from 'react-icons/fa';
import { SocialFormModal } from './SocialFormModal';
import { SocialType } from '@prisma/client';
import clsx from 'clsx';

interface CompanySocial {
  id: string;
  type: SocialType;
  url: string;
  label: string | null;
  enabled: boolean;
  order: number;
}

interface Props {
  initialSocials: CompanySocial[];
}

const SOCIAL_TYPE_LABELS: Record<SocialType, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
  X: 'X (Twitter)',
  LINKEDIN: 'LinkedIn',
  YOUTUBE: 'YouTube',
  WHATSAPP: 'WhatsApp',
  WEBSITE: 'Sitio Web',
};

const SOCIAL_TYPE_ICONS: Record<SocialType, React.ComponentType<{ size?: number; className?: string }>> = {
  INSTAGRAM: FaInstagram,
  FACEBOOK: FaFacebook,
  TIKTOK: FaTiktok,
  X: FaTwitter,
  LINKEDIN: FaLinkedin,
  YOUTUBE: FaYoutube,
  WHATSAPP: FaWhatsapp,
  WEBSITE: FaGlobe,
};

const SOCIAL_TYPE_COLORS: Record<SocialType, string> = {
  INSTAGRAM: 'text-pink-600',
  FACEBOOK: 'text-blue-600',
  TIKTOK: 'text-black',
  X: 'text-gray-900',
  LINKEDIN: 'text-blue-700',
  YOUTUBE: 'text-red-600',
  WHATSAPP: 'text-green-600',
  WEBSITE: 'text-gray-600',
};

interface FloatingSocialConfig {
  enabled: boolean;
  socialType: SocialType;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  style: 'rounded' | 'square' | 'circle';
}

export const SocialsManager = ({ initialSocials }: Props) => {
  const router = useRouter();
  const [socials, setSocials] = useState<CompanySocial[]>(initialSocials);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState<CompanySocial | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [floatingConfig, setFloatingConfig] = useState<FloatingSocialConfig>({
    enabled: false,
    socialType: 'WHATSAPP',
    position: 'bottom-right',
    style: 'rounded',
  });
  const [loadingConfig, setLoadingConfig] = useState(false);

  const handleCreate = () => {
    setEditingSocial(null);
    setIsModalOpen(true);
  };

  const handleEdit = (social: CompanySocial) => {
    setEditingSocial(social);
    setIsModalOpen(true);
  };

  const handleDelete = async (socialId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta red social?')) {
      return;
    }

    setLoading(socialId);
    const result = await deleteCompanySocial(socialId);
    if (result.ok) {
      setSocials(socials.filter((s) => s.id !== socialId));
      router.refresh();
    } else {
      alert(result.message);
    }
    setLoading(null);
  };

  const handleToggleEnabled = async (social: CompanySocial) => {
    setLoading(social.id);
    const result = await updateCompanySocial({
      socialId: social.id,
      enabled: !social.enabled,
    });
    if (result.ok) {
      setSocials(
        socials.map((s) =>
          s.id === social.id ? { ...s, enabled: !s.enabled } : s
        )
      );
      router.refresh();
    } else {
      alert(result.message);
    }
    setLoading(null);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingSocial(null);
    router.refresh();
  };

  // Cargar configuración del botón flotante
  useEffect(() => {
    const loadFloatingConfig = async () => {
      const result = await getCompanyConfig();
      if (result.ok && result.configs) {
        const config = result.configs['ui.floatingSocial'];
        if (config) {
          setFloatingConfig(config);
        }
      }
    };
    loadFloatingConfig();
  }, []);

  const handleFloatingConfigChange = async (newConfig: FloatingSocialConfig) => {
    setLoadingConfig(true);
    try {
      const result = await updateCompanyConfig([
        {
          key: 'ui.floatingSocial',
          value: newConfig,
        },
      ]);
      if (result.ok) {
        setFloatingConfig(newConfig);
        router.refresh();
      } else {
        alert(result.message || 'Error al actualizar la configuración');
      }
    } catch (error) {
      alert('Error al actualizar la configuración');
    } finally {
      setLoadingConfig(false);
    }
  };

  const sortedSocials = [...socials].sort((a, b) => a.order - b.order);
  const enabledSocials = sortedSocials.filter(s => s.enabled);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
        <p className="text-sm text-gray-600">
          Gestiona las redes sociales de tu empresa
        </p>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <IoAddOutline size={18} />
          <span>Agregar Red Social</span>
        </button>
      </div>

      {sortedSocials.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay redes sociales configuradas</p>
          <p className="text-sm mt-2">Haz clic en "Agregar Red Social" para comenzar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSocials.map((social) => {
            const isLoading = loading === social.id;

            return (
              <div
                key={social.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors gap-3 sm:gap-0"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                  {/* Icono de la red social */}
                  <div className={clsx(
                    'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                    {
                      'bg-pink-100': social.type === 'INSTAGRAM',
                      'bg-blue-100': social.type === 'FACEBOOK',
                      'bg-gray-100': social.type === 'TIKTOK' || social.type === 'X',
                      'bg-blue-50': social.type === 'LINKEDIN',
                      'bg-red-100': social.type === 'YOUTUBE',
                      'bg-green-100': social.type === 'WHATSAPP',
                      'bg-gray-50': social.type === 'WEBSITE',
                    }
                  )}>
                    {(() => {
                      const Icon = SOCIAL_TYPE_ICONS[social.type];
                      return (
                        <Icon
                          size={24}
                          className={clsx(SOCIAL_TYPE_COLORS[social.type])}
                        />
                      );
                    })()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {SOCIAL_TYPE_LABELS[social.type]}
                      </span>
                      {social.enabled ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded flex items-center gap-1">
                          <IoCheckmarkCircleOutline size={12} />
                          Habilitada
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                          <IoCloseCircleOutline size={12} />
                          Deshabilitada
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {social.label || social.url}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-md">
                      {social.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                  <button
                    onClick={() => handleEdit(social)}
                    disabled={isLoading}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md disabled:opacity-50 transition-colors"
                    title="Editar"
                  >
                    <IoCreateOutline size={18} />
                  </button>
                  <button
                    onClick={() => handleToggleEnabled(social)}
                    disabled={isLoading}
                    className={clsx(
                      'p-2 rounded-md disabled:opacity-50 transition-colors',
                      {
                        'text-green-600 hover:text-green-700 hover:bg-green-50': social.enabled,
                        'text-gray-600 hover:text-gray-700 hover:bg-gray-50': !social.enabled,
                      }
                    )}
                    title={social.enabled ? 'Deshabilitar' : 'Habilitar'}
                  >
                    {social.enabled ? (
                      <IoCheckmarkCircleOutline size={18} />
                    ) : (
                      <IoCloseCircleOutline size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(social.id)}
                    disabled={isLoading}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors"
                    title="Eliminar"
                  >
                    <IoTrashOutline size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SocialFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSocial(null);
        }}
        onSuccess={handleModalSuccess}
        editingSocial={editingSocial}
      />

      {/* Configuración del botón flotante */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Botón Flotante de Red Social
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Configura una red social para que aparezca como botón flotante en tu sitio
        </p>

        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Habilitar/Deshabilitar */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="floatingEnabled"
              checked={floatingConfig.enabled}
              onChange={(e) =>
                handleFloatingConfigChange({
                  ...floatingConfig,
                  enabled: e.target.checked,
                })
              }
              disabled={loadingConfig}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="floatingEnabled" className="text-sm font-medium text-gray-700 cursor-pointer">
              Habilitar botón flotante
            </label>
          </div>

          {floatingConfig.enabled && (
            <>
              {/* Seleccionar red social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Red Social
                </label>
                <select
                  value={floatingConfig.socialType}
                  onChange={(e) =>
                    handleFloatingConfigChange({
                      ...floatingConfig,
                      socialType: e.target.value as SocialType,
                    })
                  }
                  disabled={loadingConfig}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  {enabledSocials.map((social) => (
                    <option key={social.id} value={social.type}>
                      {SOCIAL_TYPE_LABELS[social.type]}
                    </option>
                  ))}
                  {enabledSocials.length === 0 && (
                    <option value="">No hay redes sociales habilitadas</option>
                  )}
                </select>
                {enabledSocials.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Debes habilitar al menos una red social arriba
                  </p>
                )}
              </div>

              {/* Posición */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posición
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() =>
                        handleFloatingConfigChange({
                          ...floatingConfig,
                          position: pos,
                        })
                      }
                      disabled={loadingConfig}
                      className={clsx(
                        'p-2 text-sm border rounded-md transition-colors',
                        floatingConfig.position === pos
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      {pos === 'top-left' && 'Arriba Izquierda'}
                      {pos === 'top-right' && 'Arriba Derecha'}
                      {pos === 'bottom-left' && 'Abajo Izquierda'}
                      {pos === 'bottom-right' && 'Abajo Derecha'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estilo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estilo
                </label>
                <div className="flex gap-2">
                  {(['rounded', 'square', 'circle'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() =>
                        handleFloatingConfigChange({
                          ...floatingConfig,
                          style: style,
                        })
                      }
                      disabled={loadingConfig}
                      className={clsx(
                        'flex-1 p-2 text-sm border rounded-md transition-colors',
                        floatingConfig.style === style
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      {style === 'rounded' && 'Redondeado'}
                      {style === 'square' && 'Cuadrado'}
                      {style === 'circle' && 'Circular'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
