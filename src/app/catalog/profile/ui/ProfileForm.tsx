'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import { updateUserProfile, updateUserAddress } from "@/actions/user/update-user-profile";
import { Address } from "@/interfaces/Address";
import { Country } from "@/interfaces";
import { useToastStore } from "@/store/toast/toast-store";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
  address: Partial<Address> | null;
}

interface Props {
  countries: Country[];
  user: UserProfile;
}

type FormInputs = {
  // Datos del usuario
  name: string;
  email: string;
  phone: string;
  // Datos de dirección
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  postalCode: string;
  city: string;
  country: string;
  addressPhone: string;
}

export const ProfileForm = ({ countries, user }: Props) => {
  const router = useRouter();
  const { data: session, update } = useSession();
  const addToast = useToastStore(state => state.addToast);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormInputs>({
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      firstName: user.address?.firstName || '',
      lastName: user.address?.lastName || '',
      address: user.address?.address || '',
      address2: user.address?.address2 || '',
      postalCode: user.address?.postalCode || '',
      city: user.address?.city || '',
      country: user.address?.country || '',
      addressPhone: user.address?.phone || ''
    }
  });

  const onSubmit = async (data: FormInputs) => {
    setIsLoading(true);
    
    try {
      // Actualizar datos del usuario
      const userResult = await updateUserProfile({
        name: data.name,
        email: data.email,
        phone: data.phone || null
      });

      if (!userResult.ok) {
        addToast(userResult.message, 'error');
        setIsLoading(false);
        return;
      }

      // Actualizar dirección si hay datos
      if (data.firstName && data.lastName && data.address && data.postalCode && data.city && data.country && data.addressPhone) {
        const addressData: Address = {
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          address2: data.address2 || null,
          postalCode: data.postalCode,
          city: data.city,
          country: data.country,
          phone: data.addressPhone
        };

        const addressResult = await updateUserAddress(addressData);
        
        if (!addressResult.ok) {
          addToast(addressResult.message, 'error');
          setIsLoading(false);
          return;
        }
      }

      // Actualizar la sesión para reflejar los cambios
      await update();

      addToast('Perfil actualizado correctamente', 'success');
      router.refresh();
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      addToast('Error al actualizar el perfil', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
      {/* Sección de datos personales */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Datos personales</h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Nombre completo</label>
            <input
              {...register('name', { required: 'El nombre es requerido' })}
              type="text"
              className={clsx(
                "p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.name && "border-red-500"
              )}
            />
            {errors.name && (
              <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email', {
                required: 'El email es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
              type="email"
              className={clsx(
                "p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.email && "border-red-500"
              )}
            />
            {errors.email && (
              <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Teléfono</label>
            <input
              {...register('phone')}
              type="text"
              className="p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      {/* Sección de dirección */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Dirección de entrega</h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Nombres</label>
            <input
              {...register('firstName')}
              type="text"
              className="p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Apellidos</label>
            <input
              {...register('lastName')}
              type="text"
              className="p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col sm:col-span-2">
            <label className="mb-2 text-sm font-medium text-gray-700">Dirección</label>
            <input
              {...register('address')}
              type="text"
              className="p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col sm:col-span-2">
            <label className="mb-2 text-sm font-medium text-gray-700">Dirección 2 (opcional)</label>
            <input
              {...register('address2')}
              type="text"
              className="p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Código postal</label>
            <input
              {...register('postalCode')}
              type="text"
              className="p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Ciudad</label>
            <input
              {...register('city')}
              type="text"
              className="p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">País</label>
            <select
              {...register('country')}
              className="p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">[ Seleccione ]</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Teléfono</label>
            <input
              {...register('addressPhone')}
              type="text"
              className="p-2 border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className={clsx(
            "px-6 py-2 rounded-md font-medium transition-colors",
            {
              "cursor-not-allowed opacity-50": isLoading
            }
          )}
          style={!isLoading ? {
            backgroundColor: 'var(--theme-secondary-color)',
            color: 'var(--theme-secondary-text-color)',
          } : {
            backgroundColor: '#9ca3af',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color)';
            }
          }}
        >
          {isLoading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};
