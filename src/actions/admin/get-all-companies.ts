'use server'

import { middleware } from "@/auth.config"
import prisma from "@/lib/prisma";

export const getAllCompanies = async () => {
    const session = await middleware();
    
    if (!session?.user || session.user.role !== 'admin') {
        return {
            ok: false,
            message: 'No tienes permisos para acceder a esta información'
        }
    }

    try {
        const companies = await prisma.company.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                logo: true,
                createdAt: true,
                _count: {
                    select: {
                        products: true,
                        orders: true,
                        users: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return {
            ok: true,
            companies
        }
    } catch (error) {
        console.log(error)
        return {
            ok: false,
            message: 'No se pudieron obtener las empresas'
        }
    }
}

