'use client';

import { useEffect, useState } from 'react';
import { useCompanyStore } from '@/store/company/company-store';
import { getCompanyConfigPublic } from '@/actions/company-config/get-company-config-public';
import { SocialType } from '@prisma/client';
import { FaInstagram, FaFacebook, FaTiktok, FaTwitter, FaLinkedin, FaYoutube, FaWhatsapp, FaGlobe } from 'react-icons/fa';
import clsx from 'clsx';

interface FloatingSocialConfig {
  enabled: boolean;
  socialType: SocialType;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  style: 'rounded' | 'square' | 'circle';
}

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
  INSTAGRAM: 'bg-pink-600 hover:bg-pink-700',
  FACEBOOK: 'bg-blue-600 hover:bg-blue-700',
  TIKTOK: 'bg-black hover:bg-gray-800',
  X: 'bg-gray-900 hover:bg-gray-800',
  LINKEDIN: 'bg-blue-700 hover:bg-blue-800',
  YOUTUBE: 'bg-red-600 hover:bg-red-700',
  WHATSAPP: 'bg-green-600 hover:bg-green-700',
  WEBSITE: 'bg-gray-600 hover:bg-gray-700',
};

const POSITION_CLASSES = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

const STYLE_CLASSES = {
  rounded: 'rounded-lg',
  square: 'rounded-none',
  circle: 'rounded-full',
};

export const FloatingSocialButton = () => {
  const company = useCompanyStore((state) => state.company);
  const [config, setConfig] = useState<FloatingSocialConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        if (!company?.id) {
          setLoading(false);
          return;
        }

        const result = await getCompanyConfigPublic(company.id);
        if (result.ok && result.configs) {
          const floatingConfig = result.configs['ui.floatingSocial'];
          if (floatingConfig && floatingConfig.enabled) {
            setConfig(floatingConfig);
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración del botón flotante:', error);
      } finally {
        setLoading(false);
      }
    };

    if (company?.id) {
      loadConfig();
    } else {
      setLoading(false);
    }
  }, [company?.id]);

  if (loading || !config || !config.enabled) {
    return null;
  }

  // Buscar la red social configurada
  const social = company?.socials?.find(
    (s) => s.type === config.socialType && s.enabled
  );

  if (!social) {
    return null;
  }

  const Icon = SOCIAL_TYPE_ICONS[config.socialType];
  const positionClass = POSITION_CLASSES[config.position];
  const styleClass = STYLE_CLASSES[config.style];
  const colorClass = SOCIAL_TYPE_COLORS[config.socialType];

  return (
    <a
      href={social.url}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'fixed z-50 flex items-center justify-center w-14 h-14 text-white shadow-lg transition-all hover:scale-110',
        positionClass,
        styleClass,
        colorClass
      )}
      aria-label={social.label || `Ir a ${config.socialType}`}
      title={social.label || `Ir a ${config.socialType}`}
    >
      <Icon size={24} />
    </a>
  );
};
