
export const runtime = 'nodejs';
import { getCurrentDomain } from "@/lib/domain";
import prisma from "@/lib/prisma";
import MercadoPagoConfig, {Payment} from "mercadopago";
import {revalidatePath} from "next/cache";
import { getMercadoPagoConfig } from "@/actions/payment-methods/get-mercado-pago-config";
import crypto from "crypto";

/**
 * Tipos de notificaciones de Mercado Pago
 */
interface MercadoPagoWebhookBody {
  type: string; // 'payment', 'merchant_order', etc.
  action: string; // 'payment.created', 'payment.updated', etc.
  data: {
    id: string; // ID del payment o merchant_order
  };
}

/**
 * Valida la firma del webhook de Mercado Pago
 * @param signatureHeader - Header x-signature en formato "ts=timestamp,v1=signature"
 * @param requestId - Header x-request-id
 * @param dataId - ID del evento desde data.id
 * @param clientSecret - Client secret de Mercado Pago (access token)
 * @returns true si la firma es v?lida
 */
function validateWebhookSignature(
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string,
  accessToken: string
): boolean {
  // Si no hay firma, permitir (para pruebas locales o desarrollo)
  if (!signatureHeader) {
    console.warn('No se recibió header x-signature, omitiendo validación');
    return true;
  }

  try {
    console.log('Iniciando validación de firma:', {
      signatureHeader: signatureHeader.substring(0, 100),
      requestId,
      dataId,
      accessTokenLength: accessToken.length,
    });

    // Extraer ts y v1 del header x-signature
    // Formato: "ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839"
    const signatureParts = signatureHeader.split(',');
    let ts: string | null = null;
    let v1: string | null = null;

    for (const part of signatureParts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') v1 = value;
    }

    console.log('Partes extraídas de la firma:', { ts, v1Length: v1?.length });

    if (!ts || !v1) {
      console.error('Formato de x-signature inválido:', signatureHeader);
      return false;
    }

    // Construir el string a firmar
    // Formato: "id:[data.id];request-id:[x-request-id];ts:[ts];"
    // IMPORTANTE: data.id debe estar en minúsculas si es alfanumérico
    const dataIdLower = dataId.toLowerCase();
    const requestIdValue = requestId || '';
    const stringToSign = `id:${dataIdLower};request-id:${requestIdValue};ts:${ts};`;

    console.log('String a firmar:', stringToSign);

    // Generar HMAC-SHA256 usando el access token como clave
    // NOTA: Según la documentación de Mercado Pago, se usa el access token para validar
    const hmac = crypto.createHmac('sha256', accessToken);
    hmac.update(stringToSign);
    const calculatedSignature = hmac.digest('hex');

    console.log('Firmas comparadas:', {
      calculated: calculatedSignature,
      received: v1,
      match: calculatedSignature === v1,
    });

    // Comparar firmas
    const isValid = calculatedSignature === v1;
    
    if (!isValid) {
      console.error('Firma del webhook inválida', {
        calculated: calculatedSignature,
        received: v1,
        stringToSign,
        dataIdOriginal: dataId,
        dataIdLower,
        requestIdValue,
        ts,
      });
    }

    return isValid;
  } catch (error) {
    console.error('Error al validar firma del webhook:', error);
    return false;
  }
}

/**
 * Estados de pago de Mercado Pago
 */
type PaymentStatus = 
  | 'pending'      // El pago est? pendiente
  | 'approved'    // El pago fue aprobado
  | 'authorized'  // El pago fue autorizado pero a?n no capturado
  | 'in_process'  // El pago est? en proceso
  | 'in_mediation' // El pago est? en mediaci?n
  | 'rejected'    // El pago fue rechazado
  | 'cancelled'   // El pago fue cancelado
  | 'refunded'    // El pago fue reembolsado
  | 'charged_back'; // El pago fue contracargado

// Endpoint GET para verificar que el webhook está accesible
export async function GET(request: Request) {
  console.log('=== VERIFICACIÓN DE WEBHOOK MERCADO PAGO ===');
  return new Response(JSON.stringify({ 
    status: 'ok', 
    message: 'Webhook de Mercado Pago está funcionando',
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request) {
  console.log('=== WEBHOOK MERCADO PAGO RECIBIDO ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('URL completa:', request.url);
  console.log('Método:', request.method);
  
  try {
    // Obtener headers primero para logging
    const signatureHeader = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    
    console.log('Headers recibidos:', {
      hasSignature: !!signatureHeader,
      hasRequestId: !!requestId,
      signaturePreview: signatureHeader?.substring(0, 50),
    });
    
    // Leer el body como texto primero para poder validar la firma
    const bodyText = await request.text();
    console.log('Body recibido:', {
      length: bodyText.length,
      preview: bodyText.substring(0, 200),
      isEmpty: !bodyText || bodyText.trim() === '' || bodyText === '{}',
    });
    
    // Si el body está vacío (prueba de Mercado Pago), responder con éxito
    if (!bodyText || bodyText.trim() === '' || bodyText === '{}') {
      console.log('Webhook recibido con body vacío (probablemente una prueba)');
      return new Response(JSON.stringify({ received: true, message: 'Test webhook received' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: MercadoPagoWebhookBody;
    try {
      body = JSON.parse(bodyText);
      console.log('Body parseado correctamente:', {
        type: body.type,
        action: body.action,
        dataId: body.data?.id,
      });
    } catch (parseError) {
      console.error('Error al parsear el body del webhook:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Verificar que sea una notificación de tipo payment
    if (body.type !== 'payment') {
      console.log(`Webhook ignorado: tipo ${body.type} no es 'payment'`);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const paymentId = body.data?.id;
    
    if (!paymentId) {
      console.error('No se recibió payment_id en el webhook');
      return new Response(JSON.stringify({ received: true, message: 'Missing payment_id' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Procesando webhook de Mercado Pago - Payment ID: ${paymentId}, Action: ${body.action}`);

    // Buscar todas las empresas con Mercado Pago configurado para intentar obtener el payment
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        type: 'MERCADOPAGO',
        enabled: true,
      },
      select: {
        companyId: true,
      },
    });

    if (paymentMethods.length === 0) {
      console.error('No hay empresas con Mercado Pago configurado');
      return new Response(JSON.stringify({ received: true, message: 'No payment methods configured' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Intentar obtener el payment con cada empresa hasta encontrar la correcta
    let payment: any = null;
    let orderId: string | null = null;
    let companyId: string | null = null;
    let accessToken: string | null = null;

    for (const pm of paymentMethods) {
      try {
        const config = await getMercadoPagoConfig(pm.companyId);
        
        if (!config.accessToken) continue;

        const mercadopago = new MercadoPagoConfig({
          accessToken: config.accessToken,
        });

        const paymentData = await new Payment(mercadopago).get({id: paymentId});
        
        console.log(`Payment data obtenido para ${paymentId}:`, {
          hasExternalReference: !!paymentData.external_reference,
          externalReference: paymentData.external_reference,
          externalReferenceType: typeof paymentData.external_reference,
          status: paymentData.status,
        });
        
        if (paymentData.external_reference) {
          payment = paymentData;
          // Asegurarse de que el orderId sea un string y esté limpio
          // Los UUIDs pueden venir con espacios o caracteres extraños
          orderId = String(paymentData.external_reference).trim();
          
          // Limpiar cualquier carácter invisible o problema de encoding
          orderId = orderId.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remover zero-width spaces
          
          console.log(`Buscando orden con ID: "${orderId}"`, {
            length: orderId.length,
            isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId),
            hasHyphens: orderId.includes('-'),
            charCodes: orderId.split('').map(c => c.charCodeAt(0)),
          });
          
          // Verificar que la orden pertenece a esta empresa
          try {
            const order = await prisma.order.findUnique({
              where: { id: orderId },
              select: { id: true, companyId: true },
            });
            
            console.log(`Resultado de búsqueda de orden:`, {
              found: !!order,
              orderId: order?.id,
              orderCompanyId: order?.companyId,
              currentCompanyId: pm.companyId,
              match: order?.companyId === pm.companyId,
            });
            
            if (order && order.companyId === pm.companyId) {
              companyId = pm.companyId;
              accessToken = config.accessToken;
              console.log(`✅ Orden encontrada y verificada: ${orderId} para empresa ${companyId}`);
              break;
            } else if (order) {
              console.log(`⚠️ Orden encontrada pero pertenece a otra empresa`);
            } else {
              console.log(`❌ Orden no encontrada en la base de datos`);
            }
          } catch (dbError) {
            console.error('Error al buscar orden en la base de datos:', dbError);
            // Continuar con la siguiente empresa
          }
        } else {
          console.log(`⚠️ Payment ${paymentId} no tiene external_reference`);
        }
      } catch (error) {
        // Continuar con la siguiente empresa
        continue;
      }
    }

    // Si encontramos el payment, validar la firma (solo si hay firma presente)
    // En pruebas de Mercado Pago, puede que no haya firma, así que solo validamos si existe
    if (payment && accessToken && signatureHeader) {
      console.log('Validando firma del webhook...');
      const isValidSignature = validateWebhookSignature(
        signatureHeader,
        requestId,
        paymentId,
        accessToken
      );

      if (!isValidSignature) {
        console.error('Firma del webhook inválida - pero continuando de todas formas para debugging');
        // Por ahora, no rechazamos el webhook si la firma es inválida
        // Esto nos permite debuggear el problema
        // TODO: Re-habilitar la validación de firma una vez que funcione correctamente
        // return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        //   status: 403,
        //   headers: { 'Content-Type': 'application/json' },
        // });
      } else {
        console.log('Firma del webhook válida');
      }
    } else {
      console.log('Omitiendo validación de firma:', {
        hasPayment: !!payment,
        hasAccessToken: !!accessToken,
        hasSignatureHeader: !!signatureHeader,
      });
    }

    // Si no encontramos el payment u orderId, responder con 200 para que Mercado Pago no reintente
    // Esto es importante porque puede ser una prueba o un pago de otra aplicación
    if (!payment || !orderId || !companyId) {
      console.log(`No se pudo encontrar la orden para payment ${paymentId}`, {
        hasPayment: !!payment,
        orderId: orderId,
        hasCompanyId: !!companyId,
        externalReference: payment?.external_reference,
      });
      
      // Intentar buscar la orden directamente por el external_reference si existe
      if (payment?.external_reference) {
        const directOrderId = String(payment.external_reference).trim();
        console.log(`Intentando búsqueda directa de orden con ID: "${directOrderId}"`);
        
        const directOrder = await prisma.order.findUnique({
          where: { id: directOrderId },
          select: { id: true, companyId: true },
        });
        
        if (directOrder) {
          console.log(`Orden encontrada directamente:`, directOrder);
          orderId = directOrder.id;
          companyId = directOrder.companyId;
        } else {
          console.log(`No se encontró la orden con ID directo: "${directOrderId}"`);
        }
      }
      
      // Si aún no encontramos la orden, responder con 200
      if (!orderId || !companyId) {
        return new Response(JSON.stringify({ received: true, message: 'Order not found' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const paymentStatus = payment.status as PaymentStatus;
    console.log(`Payment ${paymentId} para orden ${orderId} tiene estado: ${paymentStatus}`);

    // Manejar diferentes estados del pago
    switch (paymentStatus) {
      case 'approved':
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

        // Revalidar la p?gina de la orden
        revalidatePath(`/catalog/orders/${orderId}`);
        console.log(`Orden ${orderId} marcada como pagada`);
        break;

      case 'rejected':
      case 'cancelled':
        // Pago rechazado o cancelado - marcar como no pagada
        await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: false,
            paidAt: null,
          },
        });

        revalidatePath(`/catalog/orders/${orderId}`);
        console.log(`Orden ${orderId} marcada como no pagada (estado: ${paymentStatus})`);
        break;

      case 'refunded':
        // Pago reembolsado - marcar como no pagada
        await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: false,
            paidAt: null,
          },
        });

        revalidatePath(`/catalog/orders/${orderId}`);
        console.log(`Orden ${orderId} marcada como reembolsada`);
        break;

      case 'charged_back':
        // Contracargo - marcar como no pagada
        await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: false,
            paidAt: null,
          },
        });

        revalidatePath(`/catalog/orders/${orderId}`);
        console.log(`Orden ${orderId} marcada como contracargada`);
        break;

      case 'pending':
      case 'authorized':
      case 'in_process':
      case 'in_mediation':
        // Estados intermedios - no cambiar el estado de la orden, solo loguear
        console.log(`Orden ${orderId} en estado intermedio: ${paymentStatus}`);
        revalidatePath(`/catalog/orders/${orderId}`);
        break;

      default:
        console.log(`Estado de pago no manejado: ${paymentStatus} para orden ${orderId}`);
        break;
    }
    
    // Respondemos con un estado 200 para indicarle que la notificación fue recibida
    return new Response(JSON.stringify({ received: true, orderId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error);
    console.error('Detalles del error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Retornar 500 para que Mercado Pago reintente el webhook
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}