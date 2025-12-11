'use server'

import { middleware } from "@/auth.config"
import prisma from "@/lib/prisma";


export const getOrders = async () => {

    const session = await middleware();
    if(!session?.user){
        return {
            ok: false,
            message: 'No hay una sesión activa'
        }
    }

    try {
        const orders = await prisma.order.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                OrderAddress: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        })

        return {
            ok: true,
            orders
        }
    } catch (error) {
        console.log(error)
        return {
            ok: false,
            message: 'No se pudo obtener las ordenes'
        }
    }

}