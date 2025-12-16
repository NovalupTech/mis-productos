"use client";

import { authenticate } from "@/actions/auth/login";
import clsx from "clsx";
import { useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { IoInformationOutline } from "react-icons/io5";

export const AdminLoginForm = () => {
	const [state, dispatch] = useActionState(authenticate, undefined);

	useEffect(() => {
	  if(state === 'success'){
		// Usar window.location.replace para forzar una recarga completa
		// y asegurar que el servidor obtenga la sesión actualizada
		window.location.replace('/gestion/dashboard');
		return;
	  }
	}, [state])
	

	return (
		<form action={dispatch} className="flex flex-col w-full bg-white p-6 sm:p-8 rounded-lg shadow-lg" suppressHydrationWarning>
			<div className="mb-6">
				<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
					Correo electrónico
				</label>
				<input
					className="w-full px-4 py-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					name="email"
					type="email"
					placeholder="tu@email.com"
					autoComplete="email"
					required
					suppressHydrationWarning
				/>
			</div>

			<div className="mb-6">
				<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
					Contraseña
				</label>
				<input
					className="w-full px-4 py-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					name="password"
					type="password"
					placeholder="••••••••"
					autoComplete="current-password"
					required
					suppressHydrationWarning
				/>
			</div>

			<div
				className="flex h-8 items-center space-x-1 mb-4 min-h-[2rem]"
				aria-live="polite"
				aria-atomic="true"
			>
				{state === 'CredentialsSignin' && (
					<>
						<IoInformationOutline className="h-5 w-5 text-red-500 flex-shrink-0" />
						<p className="text-sm text-red-500">Credenciales no son correctas</p>
					</>
				)}
			</div>

			<AdminLoginButton />
		</form>
	);
};

function AdminLoginButton () {
    const { pending } = useFormStatus();
    return (
        <button 
            type="submit" 
            className={clsx(
                "w-full py-3 px-4 rounded-md font-semibold text-white transition-colors duration-200",
                {
                    'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2': !pending,
                    'bg-gray-400 cursor-not-allowed': pending,
                }
            )}
            disabled={pending}
        >
            {pending ? 'Ingresando...' : 'Ingresar'}
        </button>
    )
}
