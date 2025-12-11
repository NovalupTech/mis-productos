'use server'

export const runtime = 'nodejs';

import { middleware } from "@/auth.config";
import prisma from "@/lib/prisma"

export const getOrderById = async (orderId: string) => {

    const session = await middleware();

    if(!session?.user){
        throw new Error("Unauthorized")
    }

    const order = await prisma.order.findUnique({
        where: {
            id: orderId
        },
        include: {
            OrderAddress: {
                include: {
                    country: true
                }
            },
            OrderItem: {
                select: {
                    price: true,
                    quantity: true,
                    product: {
                        select: {
                            title: true,
                            slug: true,
                            productImage: {
                                select: {
                                    url: true
                                },
                                take: 1
                            }
                        }
                    }
                },
            },
        }
    });

    if(!order){
        throw new Error("Order not found")
    }


    return {
        order,
        products: order.OrderItem,
        address: order.OrderAddress
    }
}