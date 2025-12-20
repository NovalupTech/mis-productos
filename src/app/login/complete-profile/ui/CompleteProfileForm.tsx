'use client'

import { useState } from "react";
import { useForm } from "react-hook-form"
import clsx from "clsx";
import { updateUserPhone } from "@/actions/auth/update-phone";
import { IoInformationOutline } from "react-icons/io5";
import { useRouter, useSearchParams } from "next/navigation";

interface FormValues {
    phoneNumber: string;
}

export const CompleteProfileForm = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();
    const [errorState, setErrorState] = useState({
        ok: false,
        message: ''
    });
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';

    const onSubmit = async (data: FormValues) => {
        const { phoneNumber } = data;
        const result = await updateUserPhone(phoneNumber);
        setErrorState(result);

        if(result.ok){
            // Redirigir a la URL especificada o al home después de actualizar el teléfono
            window.location.href = redirect;
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-4">
            <div
                className="flex h-8 items-center space-x-1 min-h-[2rem]"
                aria-live="polite"
                aria-atomic="true"
            >
                {errorState.message && !errorState.ok && (
                    <>
                        <IoInformationOutline className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="text-lg font-bold text-red-500">{errorState.message}</p>
                    </>
                )}
                {errorState.message && errorState.ok && (
                    <>
                        <IoInformationOutline className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <p className="text-lg font-bold text-green-500">{errorState.message}</p>
                    </>
                )}
            </div>

            <div className="flex flex-col">
                <label htmlFor="phoneNumber" className="mb-2 text-sm font-medium text-gray-700">
                    Teléfono
                </label>
                <input
                    className={clsx(
                        "px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        {
                            "border-red-500 focus:ring-red-500": errors.phoneNumber
                        }
                    )}
                    type="tel"
                    id="phoneNumber"
                    placeholder="1234567890"
                    {...register("phoneNumber", { 
                        required: 'El teléfono es requerido',
                        pattern: {
                            value: /^\d{10}$/,
                            message: 'El teléfono debe tener 10 dígitos'
                        }
                    })}
                />
                {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-500">{errors.phoneNumber.message}</p>
                )}
            </div>

            <button 
                type="submit"
                className={clsx(
                    "w-full py-3 px-4 rounded-lg font-medium transition-colors",
                    {
                        'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2': !isSubmitting,
                        'bg-gray-400 text-gray-200 cursor-not-allowed': isSubmitting,
                    }
                )}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Guardando...' : 'Completar perfil'}
            </button>
        </form>
    );
};
