'use server'

import prisma from "@/lib/prisma"
import bcryptjs from 'bcryptjs';

interface Props {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
}

export const registerUser = async ({name, email, password, phoneNumber}: Props) => {

    try {
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: bcryptjs.hashSync(password),
                phone: phoneNumber
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
    } catch (error: any) {
        console.log(error)
        
        // Verificar si es un error de email duplicado (código P2002 de Prisma)
        if (error?.code === 'P2002' && error?.message.includes('email')) {
            return {
                ok: false,
                message: 'El correo electrónico ya está registrado'
            }
        }
        
        return {
            ok: false,
            message: 'No se pudo crear el usuario'
        }
    }
}