"use client";

import { authenticate } from "@/actions/auth/login";
import clsx from "clsx";
import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { IoInformationOutline } from "react-icons/io5";

export const AdminLoginForm = () => {
	const [state, dispatch] = useFormState(authenticate, undefined);

	useEffect(() => {
	  if(state === 'success'){
		window.location.replace('/admin/dashboard')
		return;
	  }
	}, [state])
	

	return (
		<form action={dispatch} className="flex flex-col">
			<label htmlFor="email">Correo electrónico</label>
			<input
				className="px-5 py-2 border bg-gray-200 rounded mb-5"
				name="email"
				type="email"
			/>

			<label htmlFor="password">Contraseña</label>
			<input
				className="px-5 py-2 border bg-gray-200 rounded mb-5"
				name="password"
				type="password"
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
