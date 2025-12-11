'use server'

import prisma from "@/lib/prisma"
import bcryptjs from 'bcryptjs';

interface Props {
    name: string;
    email: string;
    password: string;
}

export const registerUser = async ({name, email, password}: Props) => {

    try {
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: bcryptjs.hashSync(password)
            },
            select: {
                name: true,
                email: true,
                id: true
            }
        })

        return {
            ok: true,
            user,
            message: 'Usuario creado'
        }
    } catch (error) {
        console.log(error)
        return {
            ok: false,
            message: 'No se pudo crear el usuario'
        }
    }
}