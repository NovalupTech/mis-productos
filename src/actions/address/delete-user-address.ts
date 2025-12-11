'use server'

import prisma from "@/lib/prisma";

export const deleteUserAddress = async (userId: string) => {
    try {
        const deletedAddress = await prisma.userAddress.delete({
            where: {
                userId: userId
            }
        });
        return deletedAddress;
    } catch (error) {
        console.log(error)
    }
}