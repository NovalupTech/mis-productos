"use server"

export const runtime = 'nodejs';

import prisma from "@/lib/prisma";
import MercadoPagoConfig, { Preference } from "mercadopago";
import { redirect } from "next/navigation";
import { getOrderById } from "../orders/get-order-by-id";

const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN ?? '',
})

const site_url = process.env.SITE_URL ?? ''

interface Props {
    orderId: string;
    roundedAmount: number;
}

export async function submitPayment({orderId, roundedAmount}: Props): Promise<string> {
    // Buscamos la orden en la base de datos
    const { products, order } = await getOrderById(orderId);

    if(order.isPaid){
        return redirect(`/orders/${orderId}`);
    }

    const preference = await new Preference(mercadopago).create({
      body: {
        items: products.map(({price, quantity, product}) => ({
            id: orderId,
            unit_price: roundedAmount,
            quantity,
            title: product.title,
        })),
        back_urls:{
            success: `${site_url}/orders/${orderId}`,
        },
        external_reference: orderId,
        statement_descriptor: 'Tienda de ropa',
        metadata: {
          text: `Pago de la orden ${orderId}, total: ${roundedAmount}`,
          orderId,
        },
      },
    });

    // Devolvemos el init point (url de pago) para que el usuario pueda pagar
    const url = preference.init_point!;
    redirect(url)
  }