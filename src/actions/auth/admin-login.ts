'use server'

import { signIn } from "@/auth.config";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";

export async function authenticateAdmin(
	prevState: string | undefined,
	formData: FormData
) {
	try {
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		// Buscar usuario con role "admin" y companyId null (independientemente del dominio)
		const userDB = await prisma.user.findFirst({
			where: {
				email: email.toLowerCase(),
				role: 'admin',
				companyId: null,
			},
		});

		if (!userDB) {
			return 'CredentialsSignin';
		}

		if (!userDB.password || !bcryptjs.compareSync(password, userDB.password)) {
			return 'CredentialsSignin';
		}

		// Actualizar provider si no está establecido
		if (!userDB.provider || userDB.provider === 'credentials') {
			await prisma.user.update({
				where: { id: userDB.id },
				data: { provider: 'credentials' },
			});
		}

		// Iniciar sesión usando el provider 'admin-credentials' específico para admin
		await signIn('admin-credentials', {
			email: userDB.email,
			password: password,
			redirect: false,
		});

		return 'success';
	} catch (error) {
		console.error('Error en authenticateAdmin:', error);
		return 'CredentialsSignin';
	}
}

