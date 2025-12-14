"use server";

import { signIn } from "@/auth.config";
import { AuthError } from "next-auth";
//import { AuthError } from "next-auth";

export async function authenticate(
	prevState: string | undefined,
	formData: FormData
) {
	try {
		await signIn("credentials", {
			redirect: false,
			callbackUrl: '/gestion/dashboard',
			...Object.fromEntries(formData),
		});

		return 'success';

	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case "CredentialsSignin":
					return "CredentialsSignin";
				default:
					return "Something went wrong.";
			}
		}
		throw error;
	}
}

export async function login({email, password}: {email: string, password: string}) {
	try {
		await signIn("credentials", {email, password, redirect: false});
		return {
			ok: true,
		}
	} catch (error) {
		console.log(email, password);
		console.log(error);
		return {
			ok: false,
			message: 'No se pudo iniciar sesión'
		}
	}
}
