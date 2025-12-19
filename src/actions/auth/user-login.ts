"use server";

import { signIn } from "@/auth.config";
import { AuthError } from "next-auth";

export async function authenticateUser(
	prevState: string | undefined,
	formData: FormData
) {
	try {
		await signIn("user-credentials", {
			redirect: false,
			callbackUrl: '/',
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
