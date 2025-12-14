'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCompanySocial,
  updateCompanySocial,
  deleteCompanySocial,
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

export const SocialsManager = ({ initialSocials }: Props) => {
  const router = useRouter();
  const [socials, setSocials] = useState<CompanySocial[]>(initialSocials);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState<CompanySocial | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

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

  const sortedSocials = [...socials].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Gestiona las redes sociales de tu empresa
        </p>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
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

                <div className="flex items-center gap-2">
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
    </div>
  );
};
