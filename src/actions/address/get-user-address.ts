'use server'

import prisma from "@/lib/prisma";

export const getUserAddress = async (userId: string) => {
    try {
        const userAddress = await prisma.userAddress.findFirst({
            where: {
                userId: userId
            }
        });
        if(!userAddress) return null;
        return {
            ...userAddress,
            country: userAddress?.countryId,
            address2: userAddress?.address2 ?? ''
        }
    } catch (error) {
        console.log(error)
    }
}