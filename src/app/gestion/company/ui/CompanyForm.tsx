'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateCompany } from '@/actions/company/update-company';
import { uploadCompanyLogo } from '@/actions/company/upload-company-logo';
import { IoCloudUploadOutline, IoCloseOutline } from 'react-icons/io5';

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  logo: string | null;
}

interface Props {
  company: Company;
}

export const CompanyForm = ({ company }: Props) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: company.name,
    email: company.email || '',
    phone: company.phone || '',
    logo: company.logo || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingLogo(true);
    setError(null);

    try {
      const result = await uploadCompanyLogo(file);
      if (result.ok && result.url) {
        setFormData({ ...formData, logo: result.url });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.message || 'Error al subir el logo');
      }
    } catch (err) {
      setError('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateCompany(formData);
      if (result.ok) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al actualizar la información');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">
            Información actualizada correctamente
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la Empresa *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Logo de la Empresa
        </label>
        
        {/* Opción 1: Subir archivo */}
        <div className="mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={loading || uploadingLogo}
            className="hidden"
            id="logo-upload"
          />
          <label
            htmlFor="logo-upload"
            className={`
              inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer
              ${uploadingLogo || loading
                ? 'bg-gray-100 cursor-not-allowed opacity-50'
                : 'bg-white hover:bg-gray-50'
              }
              transition-colors
            `}
          >
            <IoCloudUploadOutline size={18} />
            <span>{uploadingLogo ? 'Subiendo...' : 'Subir Logo'}</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Formatos: JPG, PNG, GIF. Tamaño máximo: 5MB
          </p>
        </div>

        {/* Opción 2: URL manual (alternativa) */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">
            O ingresa una URL manualmente:
          </label>
          <input
            type="url"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            disabled={loading || uploadingLogo}
            placeholder="https://ejemplo.com/logo.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Vista previa del logo */}
        {formData.logo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                <img
                  src={formData.logo}
                  alt="Logo preview"
                  className="h-24 w-24 object-contain border border-gray-200 rounded bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveLogo}
                disabled={loading || uploadingLogo}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
                title="Eliminar logo"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
};
