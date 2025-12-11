'use server'

import { PaypalOrderResponse } from "@/interfaces";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const paypalCheckPaymnent = async (paypalTransactionId: string) => {

    const authToken = await getPaypalToken();
    if(!authToken){
        return {
            ok: false,
            message: 'Error getting paypal token'
        }
    }

    const resp = await checkPaypalPayment(paypalTransactionId, authToken);

    if(!resp){
        return {
            ok: false,
            message: 'Error checking paypal payment'
        }
    }

    const { status, purchase_units } = resp;

    if(status !== 'COMPLETED'){
        return {
            ok: false,
            message: 'Payment not completed'
        }
    }

    const orderId = purchase_units[0].invoice_id;

    await prisma.order.update({
        where: {
            id: orderId
        },
        data: {
            isPaid: true,
            paidAt: new Date(),
        }
    })

    revalidatePath(`/orders/${orderId}`);

    return {
        ok: true,
        message: 'Payment completed'
    }

}


const getPaypalToken = async () => {

    const client_id = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    const token_url = process.env.PAYPAL_OAUTH_URL ?? '';

    const token_base64 = Buffer.from(`${client_id}:${secret}`,'utf-8').toString('base64');

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", `Basic ${token_base64}`);

    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
    };

    try {
        const resp = await fetch(token_url, {
            ...requestOptions,
            cache: 'no-store',
        }).then(res => res.json());
        return resp.access_token;
    } catch (error) {
        console.log(error);
        return  null;
    }

}

const checkPaypalPayment = async (paypalTransactionId: string, authToken: string):Promise<PaypalOrderResponse|null> => {

    const paypal_order_url = (process.env.PAYPAL_ORDERS_URL+"/"+paypalTransactionId);

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${authToken}`);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
    };

    try {
        const resp = await fetch(paypal_order_url, {
            ...requestOptions,
            cache: 'no-store',
        }).then(res => res.json());
        return resp;
    } catch (error) {
        console.log(error);
        return  null;
    }

}