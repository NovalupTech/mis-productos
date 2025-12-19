"use client";

import { authenticateUser } from "@/actions/auth/user-login";
import { signIn } from "next-auth/react";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { IoArrowBackOutline, IoInformationOutline } from "react-icons/io5";

export const LoginForm = () => {
	const [state, dispatch] = useActionState(authenticateUser, undefined);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	useEffect(() => {
	  if(state === 'success'){
		window.location.replace('/')
		return;
	  }
	}, [state])
	

	return (
		<form action={dispatch} className="flex flex-col space-y-4">
			<div className="flex flex-col">
				<label htmlFor="email" className="mb-2 text-sm font-medium text-gray-700">
					Correo electrónico
				</label>
				<input
					className="px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					name="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>

			<div className="flex flex-col">
				<label htmlFor="password" className="mb-2 text-sm font-medium text-gray-700">
					Contraseña
				</label>
				<input
					className="px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					name="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>

			<div
				className="flex h-8 items-center space-x-1 min-h-[2rem]"
				aria-live="polite"
				aria-atomic="true"
			>
				{state === 'CredentialsSignin' && (
					<>
						<IoInformationOutline className="h-5 w-5 text-red-500 flex-shrink-0" />
						<p className="text-lg font-bold text-red-500">Credenciales no son correctas</p>
					</>
				)}
			</div>

			<LoginButton />

			{/* divisor line */}
			<div className="flex items-center my-6">
				<div className="flex-1 border-t border-gray-300"></div>
				<div className="px-3 text-sm text-gray-500">O</div>
				<div className="flex-1 border-t border-gray-300"></div>
			</div>

			{/* Botón de Google */}
			<button
				type="button"
				onClick={() => signIn('google', { callbackUrl: '/' })}
				className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium flex items-center justify-center gap-2"
			>
				<svg className="w-5 h-5" viewBox="0 0 24 24">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Continuar con Google
			</button>

			<Link 
				href="/login/new-account" 
				className="text-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
			>
				Crear una nueva cuenta
			</Link>
			<Link href="/" className="text-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-blue-600 transition-colors font-medium bg-blue-500 text-white flex items-center justify-center gap-2">
				<IoArrowBackOutline className="h-5 w-5" />
				Volver al catalogo
			</Link>
		</form>

	);
};

function LoginButton () {
    const { pending } = useFormStatus();
    return (
        <button 
            type="submit" 
            className={clsx(
                "w-full py-3 px-4 rounded-lg font-medium transition-colors",
                {
                    'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2': !pending,
                    'bg-gray-400 text-gray-200 cursor-not-allowed': pending,
                }
            )}
            disabled={pending}
        >
            {pending ? 'Ingresando...' : 'Ingresar'}
        </button>
    )
}
