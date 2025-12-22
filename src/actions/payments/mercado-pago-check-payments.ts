"use server"

import MercadoPagoConfig, { Preference } from "mercadopago";
import { redirect } from "next/navigation";
import { getOrderById } from "../orders/get-order-by-id";
import { getMercadoPagoConfig } from "../payment-methods/get-mercado-pago-config";
import { getCurrentDomain } from "@/lib/domain";
import { getCompany } from "../company/get-company";

const site_url = process.env.SITE_URL ?? ''

interface Props {
    orderId: string;
    roundedAmount: number;
}

export async function submitPayment({orderId, roundedAmount}: Props): Promise<string> {
    // Buscamos la orden en la base de datos
    const { products, order } = await getOrderById(orderId);

    if(order.isPaid){
        return redirect(`/catalog/orders/${orderId}`);
    }

    if (!order.companyId) {
        throw new Error('La orden no tiene companyId asociado');
    }

    // Obtener configuración de Mercado Pago desde la base de datos
    const { accessToken } = await getMercadoPagoConfig(order.companyId);
    
    if (!accessToken) {
        throw new Error('Mercado Pago no está configurado para esta empresa');
    }

    // Crear instancia de MercadoPagoConfig con el accessToken de la DB
    const mercadopago = new MercadoPagoConfig({
        accessToken: accessToken,
    });

    // Obtener el dominio actual para las URLs de retorno
    const domain = await getCurrentDomain();
    const baseUrl = process.env.ENV === 'dev' ? 'https://e7c78ba4e6f7.ngrok-free.ap' : `https://${domain}`;

    // Construir las URLs de retorno
    const successUrl = `${baseUrl}/catalog/orders/${orderId}`;
    const failureUrl = `${baseUrl}/catalog/orders/${orderId}`;
    const pendingUrl = `${baseUrl}/catalog/orders/${orderId}`;

    const company = await getCompany();
    if(!company.ok){
        throw new Error(company.message);
    }

    console.log('Creando preferencia de Mercado Pago con URLs:', {
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl,
      orderId,
    });

    // Construir la URL del webhook
    const webhookUrl = `${baseUrl}/api/webhooks/mercado-pago`;
    console.log('URL del webhook:', webhookUrl);

    // Construir el body de la preferencia
    const preferenceBody: any = {
      items: products.map(({price, quantity, product}) => ({
        id: product.slug, // Usar slug como identificador único
        unit_price: price,
        quantity,
        title: product.title,
        category_id: product.categoryId,
        description: product.description,
      })),
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      external_reference: orderId,
      statement_descriptor: `Tienda ${company.company?.name}`,
      notification_url: webhookUrl, // URL específica para notificaciones de esta preferencia
      metadata: {
        text: `Pago de la orden ${orderId}, total: ${roundedAmount}`,
        orderId,
      },
    };

    // Solo agregar auto_return si success está definido y no está vacío
    if (successUrl && successUrl.trim() !== '') {
      preferenceBody.auto_return = 'approved';
    }

    console.log('Body de la preferencia:', JSON.stringify(preferenceBody, null, 2));

    const preference = await new Preference(mercadopago).create({
      body: preferenceBody,
    });

    // Devolvemos el init point (url de pago) para que el usuario pueda pagar
    const url = preference.init_point!;
    redirect(url)
  }