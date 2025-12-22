import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentDomain } from '@/lib/domain';
import { revalidatePath } from 'next/cache';
import { decrypt } from '@/lib/encryption';

// Función para obtener el token de acceso de PayPal usando configuración de la BD
async function getPaypalToken(companyId: string): Promise<string | null> {
  try {
    // Obtener configuración de PayPal desde la BD
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: {
        companyId_type: {
          companyId,
          type: 'PAYPAL',
        },
      },
      select: {
        config: true,
        enabled: true,
      },
    });

    if (!paymentMethod || !paymentMethod.enabled || !paymentMethod.config) {
      console.error('PayPal no está configurado o habilitado para esta empresa');
      return null;
    }

    const config = paymentMethod.config as { clientId: string; clientSecret: string };
    const client_id = config.clientId;
    const encryptedSecret = config.clientSecret;

    if (!client_id || !encryptedSecret) {
      console.error('Faltan credenciales de PayPal en la configuración');
      return null;
    }

    // Desencriptar el secret
    let secret: string;
    try {
      secret = decrypt(encryptedSecret);
    } catch (error) {
      console.error('Error al desencriptar el secret de PayPal:', error);
      return null;
    }

    const token_url = process.env.PAYPAL_OAUTH_URL ?? '';
    if (!token_url) {
      console.error('Falta PAYPAL_OAUTH_URL en variables de entorno');
      return null;
    }

    const token_base64 = Buffer.from(`${client_id}:${secret}`, 'utf-8').toString('base64');

    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
    myHeaders.append('Authorization', `Basic ${token_base64}`);

    const urlencoded = new URLSearchParams();
    urlencoded.append('grant_type', 'client_credentials');

    try {
      const resp = await fetch(token_url, {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        cache: 'no-store',
      }).then((res) => res.json());
      return resp.access_token;
    } catch (error) {
      console.error('Error obteniendo token de PayPal:', error);
      return null;
    }
  } catch (error) {
    console.error('Error obteniendo configuración de PayPal:', error);
    return null;
  }
}

// Función para obtener los detalles de una orden de PayPal
async function getPaypalOrderDetails(orderId: string, companyId: string): Promise<any | null> {
  const authToken = await getPaypalToken(companyId);
  if (!authToken) {
    return null;
  }

  const paypal_order_url = `${process.env.PAYPAL_ORDERS_URL}/${orderId}`;

  const myHeaders = new Headers();
  myHeaders.append('Authorization', `Bearer ${authToken}`);

  try {
    const resp = await fetch(paypal_order_url, {
      method: 'GET',
      headers: myHeaders,
      cache: 'no-store',
    }).then((res) => res.json());
    return resp;
  } catch (error) {
    console.error('Error obteniendo detalles de orden de PayPal:', error);
    return null;
  }
}

interface PayPalWebhookEvent {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: {
    id?: string; // Order ID o Capture ID
    intent?: string;
    status?: string;
    purchase_units?: Array<{
      reference_id?: string;
      invoice_id?: string;
      amount?: {
        currency_code: string;
        value: string;
      };
    }>;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PayPalWebhookEvent = await request.json();
    
    const { event_type, resource } = body;

    let orderId: string | null = null;

    // Identificar el evento y extraer el orderId
    switch (event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        // En este evento, el invoice_id está en purchase_units
        if (resource.purchase_units && resource.purchase_units.length > 0) {
          orderId = resource.purchase_units[0].invoice_id || null;
        }
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'PAYMENT.CAPTURE.DENIED':
        // En estos eventos, el order_id de PayPal está en supplementary_data.related_ids.order_id
        const paypalOrderId = resource.supplementary_data?.related_ids?.order_id || resource.id;
        
        if (paypalOrderId) {
          // Buscar la orden en nuestra BD usando el transactionId (que es el order_id de PayPal)
          const order = await prisma.order.findFirst({
            where: {
              transactionId: paypalOrderId,
            },
            select: {
              id: true,
              companyId: true,
            },
          });
          
          if (order) {
            orderId = order.id;
          } else {
            // Si no encontramos por transactionId, intentar obtener el invoice_id de PayPal
            // Pero necesitamos el companyId para hacer la llamada, así que primero buscamos
            // en todas las órdenes recientes o intentamos obtenerlo de otra manera
            // Por ahora, retornamos error si no encontramos la orden
            console.error(`No se pudo encontrar la orden para transactionId: ${paypalOrderId}`);
            return NextResponse.json(
              { error: 'Order not found' },
              { status: 404 }
            );
          }
        }
        break;

      default:
        // Evento no manejado, retornar 200 para que PayPal no reintente
        return NextResponse.json({ received: true }, { status: 200 });
    }

    if (!orderId) {
      console.error('No se pudo obtener el orderId del webhook');
      return NextResponse.json(
        { error: 'Order ID not found in webhook' },
        { status: 400 }
      );
    }

    // Verificar que la orden existe y obtener companyId
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, companyId: true },
    });

    if (!order) {
      console.error(`Orden no encontrada en BD: ${orderId}`);
      return NextResponse.json(
        { error: 'Order not found in database' },
        { status: 404 }
      );
    }

    // Verificar que PayPal está configurado para esta empresa
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: {
        companyId_type: {
          companyId: order.companyId,
          type: 'PAYPAL',
        },
      },
      select: {
        enabled: true,
        config: true,
      },
    });

    if (!paymentMethod || !paymentMethod.enabled) {
      console.error(`PayPal no está configurado o habilitado para la empresa ${order.companyId}`);
      return NextResponse.json(
        { error: 'PayPal not configured for this company' },
        { status: 400 }
      );
    }

    // Actualizar el estado de la orden según el evento
    if (event_type === 'CHECKOUT.ORDER.APPROVED' || event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      // Pago aprobado - marcar como pagada
      await prisma.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          paidAt: new Date(),
        },
      });

      // Enviar emails al vendedor y cliente (no bloqueante)
      const domain = await getCurrentDomain();
      try {
        const emailResponse = await fetch(
          `${process.env.ENV === 'dev' ? 'http://localhost:3000' : `https://${domain}`}/api/orders/send-order-emails`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId }),
          }
        );

        if (!emailResponse.ok) {
          console.error('Error al enviar emails:', await emailResponse.text());
        }
      } catch (error) {
        // No fallar el webhook si hay error en el email
        console.error('Error al enviar emails de orden:', error);
      }

      // Revalidar la página de la orden
      revalidatePath(`/catalog/orders/${orderId}`);
      
      console.log(`Orden ${orderId} marcada como pagada por evento ${event_type}`);
    } else if (event_type === 'PAYMENT.CAPTURE.DENIED') {
      // Pago rechazado - marcar como no pagada
      await prisma.order.update({
        where: { id: orderId },
        data: {
          isPaid: false,
          paidAt: null,
        },
      });

      // Revalidar la página de la orden
      revalidatePath(`/catalog/orders/${orderId}`);
      
      console.log(`Orden ${orderId} marcada como no pagada por evento ${event_type}`);
    }

    // Responder con 200 para indicar que el webhook fue procesado correctamente
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error procesando webhook de PayPal:', error);
    // Retornar 500 para que PayPal reintente el webhook
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
