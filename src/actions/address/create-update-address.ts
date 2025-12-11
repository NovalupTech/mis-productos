'use server'

import { Address } from "@/interfaces/Address";
import prisma from "@/lib/prisma"

export const setUserAddress = async (address: Address, userId: string) => {
    try {
        const userAddress = await createOrUpdateAddress(address, userId);
        return userAddress;
    } catch (error) {
        console.log(error)
    }
}

const createOrUpdateAddress = async (address: Address, userId: string) => {
    try {
        const addressDB = await prisma.userAddress.findFirst
        ({
            where: {
                userId: userId
            }
        });

        const dataAddress = {
            userId: userId,
            city: address.city,
            address: address.address,
            firstName: address.firstName,
            lastName: address.lastName,
            phone: address.phone,
            postalCode: address.postalCode,
            address2: address.address2,
            countryId: address.country
        }

        if(!addressDB){
            const newAddress = await prisma.userAddress.create({
                data: dataAddress
            })
            return newAddress;
        }

        const updatedAddress = await prisma.userAddress.update({
            where: {
                id: addressDB.id
            },
            data: dataAddress
        })
        return updatedAddress;


    } catch (error) {
        console.log(error)
        throw new Error('Failed to create or update address')
    }
}