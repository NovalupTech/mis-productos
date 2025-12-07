'use server'

import prisma from "@/lib/prisma";
import { Gender } from "@prisma/client";

interface PaginatedProducts {
    page?: number;
    take?: number;
    gender?: Gender;
    search? : string;
}

export const getPaginatedProductsWithImages = async ({ page = 1, take = 40, gender, search }:PaginatedProducts) => {

    if(isNaN(page) || page < 1) page = 1;
    if(isNaN(take) || take < 0) take = 12;

    try {
        const productsPromise = prisma.product.findMany({
            take,
            skip: (page - 1) * take,
            where: {
                gender,
                title: {
                    contains: search,
                    mode: 'insensitive',
                }
            },
            include: {
                productImage: {
                    take: 2,
                    select: {
                        url: true,
                    },
                }
            }
        });

        const totalProductsPromise = prisma.product.count({
            where: {
                gender,
                title: {
                    contains: search,
                    mode: 'insensitive',
                }
            }
        });
        const [products, totalProducts] = await Promise.all([productsPromise, totalProductsPromise]);

        const totalPages = Math.ceil(totalProducts / take);

        return {
            currentPage: page,
            totalPages,
            products: products.map(product => ({
                ...product,
                images: product.productImage.map((image) => image.url),
            }))
        }
    } catch (error) {
        console.log(error);
        throw new Error('No se pudieron cargar los productos, Asegurese de tener una conexión a internet o a la base de datos');
    }
};