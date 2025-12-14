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
		<form action={dispatch} className="flex flex-col" suppressHydrationWarning>
			<label htmlFor="email">Correo electrónico</label>
			<input
				className="px-5 py-2 border bg-gray-200 rounded mb-5"
				name="email"
				type="email"
				suppressHydrationWarning
			/>

			<label htmlFor="password">Contraseña</label>
			<input
				className="px-5 py-2 border bg-gray-200 rounded mb-5"
				name="password"
				type="password"
				suppressHydrationWarning
			/>

			<div
				className="flex h-8 items-end space-x-1"
				aria-live="polite"
				aria-atomic="true"
			>
				{state === 'CredentialsSignin' && (
					<>
						<IoInformationOutline className="h-5 w-5 text-red-500" />
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
        <button type="submit" className={clsx({
            'btn-primary': !pending,
            'btn-disabled': pending,
        })}
        disabled={pending}
        >
            Ingresar
        </button>
    )
}
