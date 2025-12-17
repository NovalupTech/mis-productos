import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import prisma from '@/lib/prisma';
import { getCurrentDomain } from '@/lib/domain';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;
    const contactType = formData.get('contactType') as 'email' | 'whatsapp';
    const email = formData.get('email') as string | null;
    const whatsappNumber = formData.get('whatsappNumber') as string | null;

    if (!file || !orderId || !contactType) {
      return NextResponse.json(
        { ok: false, message: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, message: 'Tipo de archivo no válido. Solo se permiten PDF e imágenes' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, message: 'El archivo es demasiado grande. Máximo 10MB' },
        { status: 400 }
      );
    }

    // Obtener información de la orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        OrderItem: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, message: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Guardar archivo temporalmente
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'receipts');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `receipt-${orderId}-${Date.now()}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Obtener dominio actual para el enlace de la orden y del archivo
    const domain = await getCurrentDomain();
    const baseUrl = process.env.ENV === 'dev' ? 'http://localhost:3000' : `https://${domain}`;
    const orderUrl = `${baseUrl}/catalog/orders/${orderId}`;
    const fileUrl = `${baseUrl}/uploads/receipts/${fileName}`;

    // Preparar información del pedido
    const orderInfo = `
Orden #${orderId.split('-').at(-1) || orderId}
Empresa: ${order.company.name}
Total: $${order.total.toFixed(2)}
Productos: ${order.OrderItem.map(item => `${item.product.title} x${item.quantity}`).join(', ')}
Enlace de la orden: ${orderUrl}
    `.trim();

    // Enviar según el tipo de contacto
    let result: { whatsappUrl?: string } = {};
    if (contactType === 'email' && email) {
      await sendReceiptByEmail(email, filePath, fileName, orderInfo, orderId);
    } else if (contactType === 'whatsapp' && whatsappNumber) {
      // Para WhatsApp, enviamos un mensaje con el enlace del archivo y la información de la orden
      // El archivo está disponible públicamente en /uploads/receipts/
      result = await sendReceiptByWhatsApp(whatsappNumber, fileUrl, orderInfo, orderId);
    } else {
      return NextResponse.json(
        { ok: false, message: 'No se proporcionó email o número de WhatsApp válido' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Comprobante enviado exitosamente',
      whatsappUrl: result.whatsappUrl,
    });
  } catch (error) {
    console.error('Error al enviar comprobante:', error);
    return NextResponse.json(
      { ok: false, message: 'Error al enviar el comprobante' },
      { status: 500 }
    );
  }
}

async function sendReceiptByWhatsApp(
  whatsappNumber: string,
  fileUrl: string,
  orderInfo: string,
  orderId: string
) {
  // Para WhatsApp, generamos un mensaje con el enlace del archivo
  // Nota: Para enviar archivos directamente por WhatsApp necesitarías una API como Twilio o WhatsApp Business API
  // Por ahora, el mensaje incluye el enlace para descargar el archivo
  
  const message = `Hola, aquí está el comprobante de transferencia para la orden:\n\n${orderInfo}\n\nDescarga el comprobante aquí: ${fileUrl}`;
  
  // Formatear número para WhatsApp
  let phoneNumber = whatsappNumber.replace(/[^\d+]/g, '');
  if (!phoneNumber.startsWith('+')) {
    phoneNumber = `+54${phoneNumber}`;
  }
  
  // Retornar el enlace de WhatsApp con el mensaje prellenado
  // El frontend abrirá este enlace
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  
  // Por ahora, solo logueamos el mensaje ya que necesitaríamos una API de WhatsApp para enviar automáticamente
  console.log('WhatsApp URL:', whatsappUrl);
  console.log('Message:', message);
  
  // Retornar la URL para que el frontend pueda abrirla
  return { whatsappUrl, message };
}

async function sendReceiptByEmail(
  toEmail: string,
  filePath: string,
  fileName: string,
  orderInfo: string,
  orderId: string
) {
  try {
    // Intentar importar nodemailer dinámicamente
    let nodemailer: any;
    try {
      nodemailer = await import('nodemailer');
    } catch (importError) {
      console.warn('⚠️ nodemailer no está instalado. Instala con: pnpm add nodemailer');
      console.log('📧 Email con comprobante (simulado):', {
        to: toEmail,
        subject: `Comprobante de transferencia - Orden #${orderId.split('-').at(-1) || orderId}`,
        file: filePath,
      });
      return;
    }

    // Verificar que las variables de entorno estén configuradas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ Variables SMTP no configuradas. Configura SMTP_USER y SMTP_PASS en .env');
      console.log('📧 Email con comprobante (simulado):', {
        to: toEmail,
        subject: `Comprobante de transferencia - Orden #${orderId.split('-').at(-1) || orderId}`,
        file: filePath,
      });
      return;
    }

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #2c3e50; }
            .order-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Comprobante de transferencia recibido</h1>
            <p>Se ha recibido un comprobante de transferencia para la siguiente orden:</p>
            <div class="order-info">${orderInfo.replace(/\n/g, '<br>')}</div>
            <p>El comprobante se encuentra adjunto en este email.</p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `Comprobante de transferencia - Orden #${orderId.split('-').at(-1) || orderId}`,
      html: htmlContent,
      attachments: [
        {
          filename: fileName,
          path: filePath,
        },
      ],
    });
  } catch (error) {
    console.error('Error al enviar email con comprobante:', error);
    throw error;
  }
}
