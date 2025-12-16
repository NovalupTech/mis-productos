

export const runtime = 'nodejs';
import { getCurrentDomain } from "@/lib/domain";
import prisma from "@/lib/prisma";
import MercadoPagoConfig, {Payment} from "mercadopago";
import {revalidatePath} from "next/cache";


const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN ?? '',
})

export async function POST(request: Request) {
  // Obtenemos el cuerpo de la petición que incluye información sobre la notificación
  const body: {data: {id: string}} = await request.json();
  // Obtenemos el pago
  try {
      const payment = await new Payment(mercadopago).get({id: body.data.id});
      if (payment.status === "approved") {
        // Obtenemos los datos
        // actualizar la orden a pagada
        const orderId = payment.external_reference;
        await prisma.order.update({
            where: {
                id: orderId,
            },
            data: {
                isPaid: true,
                paidAt: new Date(),
            }
        })

        // Enviar emails al vendedor y cliente (no bloqueante)
        const domain = await getCurrentDomain();
        try {
            const emailResponse = await fetch(`${process.env.ENV === 'dev' ? 'http://localhost:3000' : `https://${domain}`}/api/orders/send-order-emails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId }),
            });
            
            if (!emailResponse.ok) {
                console.error('Error al enviar emails:', await emailResponse.text());
            }
        } catch (error) {
            // No fallar el pago si hay error en el email
            console.error('Error al enviar emails de orden:', error);
        }

        // Revalidamos la página de inicio para mostrar los datos actualizados
        revalidatePath(`/catalog/orders/${orderId}`);
    }
    // Respondemos con un estado 200 para indicarle que la notificación fue recibida
    return new Response(null, {status: 200});
  } catch (error) {
    return new Response(null, {status: 404});
  }
}