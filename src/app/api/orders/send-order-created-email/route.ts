import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentDomain } from '@/lib/domain';

/**
 * API Route para enviar email al vendedor cuando se crea una nueva orden
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { ok: false, message: 'OrderId es requerido' },
        { status: 400 }
      );
    }

    // Obtener datos completos de la orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        OrderAddress: {
          include: {
            country: true,
          },
        },
        OrderItem: {
          include: {
            product: {
              select: {
                title: true,
                slug: true,
                productImage: {
                  select: {
                    url: true,
                  },
                  take: 1,
                },
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

    // Obtener email del vendedor (empresa)
    const sellerEmail = order.company.email;

    if (!sellerEmail) {
      console.warn(`La empresa ${order.company.name} no tiene email configurado`);
      return NextResponse.json({
        ok: false,
        message: 'La empresa no tiene email configurado',
      });
    }

    // Construir URL de la orden
    const domain = await getCurrentDomain();
    const baseUrl = process.env.ENV === 'dev' ? 'http://localhost:3000' : `https://${domain}`;
    const orderUrl = `${baseUrl}/catalog/orders/${orderId}`;
    const orderNumber = orderId.split('-').at(-1) || orderId;

    // Enviar email al vendedor
    try {
      await sendOrderCreatedEmail({
        orderId: order.id,
        orderNumber,
        orderUrl,
        sellerEmail,
        companyData: {
          name: order.company.name,
          email: order.company.email || '',
          phone: order.company.phone || '',
        },
        orderData: {
          total: order.total,
          subTotal: order.subTotal,
          tax: order.tax,
          itemsInOrder: order.itemsInOrder,
          items: order.OrderItem.map((item) => ({
            title: item.product.title,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
          address: order.OrderAddress
            ? {
                firstName: order.OrderAddress.firstName,
                lastName: order.OrderAddress.lastName,
                address: order.OrderAddress.address,
                address2: order.OrderAddress.address2,
                city: order.OrderAddress.city,
                postalCode: order.OrderAddress.postalCode,
                phone: order.OrderAddress.phone,
                country: order.OrderAddress.country.name,
              }
            : null,
          companyName: order.company.name,
        },
      });

      return NextResponse.json({
        ok: true,
        message: 'Email enviado al vendedor',
      });
    } catch (error) {
      console.error('Error al enviar email:', error);
      return NextResponse.json(
        { ok: false, message: 'Error al enviar email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return NextResponse.json(
      { ok: false, message: 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}

interface OrderCreatedEmailData {
  orderId: string;
  orderNumber: string;
  orderUrl: string;
  sellerEmail: string;
  companyData: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  orderData: {
    total: number;
    subTotal: number;
    tax: number;
    itemsInOrder: number;
    items: Array<{
      title: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    address: {
      firstName: string;
      lastName: string;
      address: string;
      address2: string | null;
      city: string;
      postalCode: string;
      phone: string;
      country: string;
    } | null;
    companyName: string;
  };
}

async function sendOrderCreatedEmail(data: OrderCreatedEmailData) {
  try {
    // Intentar importar nodemailer dinámicamente
    let nodemailer: any;
    try {
      nodemailer = await import('nodemailer');
    } catch (importError) {
      console.warn('⚠️ nodemailer no está instalado. Instala con: pnpm add nodemailer');
      console.log('📧 Email al vendedor (simulado):', {
        to: data.sellerEmail,
        subject: `Nueva orden creada #${data.orderNumber} - ${data.orderData.companyName}`,
        orderUrl: data.orderUrl,
      });
      return;
    }
    
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ Variables SMTP no configuradas. Configura SMTP_USER y SMTP_PASS en .env');
      console.log('📧 Email al vendedor (simulado):', {
        to: data.sellerEmail,
        subject: `Nueva orden creada #${data.orderNumber} - ${data.orderData.companyName}`,
        orderUrl: data.orderUrl,
      });
      return;
    }
    
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
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
            h2 { color: #34495e; margin-top: 20px; }
            .order-summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .order-item { padding: 10px; border-bottom: 1px solid #dee2e6; }
            .order-item:last-child { border-bottom: none; }
            .total { font-size: 1.2em; font-weight: bold; color: #27ae60; margin-top: 15px; }
            .address { background: #e9ecef; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .button:hover { background-color: #2980b9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Nueva orden creada</h1>
            <p>Se ha creado una nueva orden <strong>#${data.orderNumber}</strong> en tu tienda.</p>
            
            <div style="margin: 20px 0;">
              <a href="${data.orderUrl}" class="button">Ver orden completa</a>
            </div>
            
            <div class="order-summary">
              <h2>Resumen de la orden</h2>
              <p><strong>Número de productos:</strong> ${data.orderData.itemsInOrder}</p>
              <p><strong>Subtotal:</strong> $${data.orderData.subTotal.toFixed(2)}</p>
              <p><strong>Impuestos:</strong> $${data.orderData.tax.toFixed(2)}</p>
              <p class="total"><strong>Total:</strong> $${data.orderData.total.toFixed(2)}</p>
            </div>

            <h2>Productos</h2>
            <div>
              ${data.orderData.items.map(item => `
                <div class="order-item">
                  <strong>${item.title}</strong><br>
                  Cantidad: ${item.quantity} | Precio unitario: $${item.price.toFixed(2)} | Subtotal: $${item.subtotal.toFixed(2)}
                </div>
              `).join('')}
            </div>

            ${data.orderData.address ? `
              <div class="address">
                <h2>Datos del comprador</h2>
                <p><strong>${data.orderData.address.firstName} ${data.orderData.address.lastName}</strong></p>
                <p>${data.orderData.address.address}</p>
                ${data.orderData.address.address2 ? `<p>${data.orderData.address.address2}</p>` : ''}
                <p>${data.orderData.address.city}, ${data.orderData.address.postalCode}</p>
                <p>${data.orderData.address.country}</p>
                <p><strong>Teléfono:</strong> ${data.orderData.address.phone}</p>
              </div>
            ` : '<p><em>Orden sin dirección de entrega (no se manejan envíos)</em></p>'}

            <p style="margin-top: 30px;">
              <a href="${data.orderUrl}" style="color: #3498db; text-decoration: underline;">Haz clic aquí para ver la orden completa</a>
            </p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.sellerEmail,
      subject: `Nueva orden creada #${data.orderNumber} - ${data.orderData.companyName}`,
      html: htmlContent,
    });

    console.log(`✅ Email de orden creada enviado al vendedor: ${data.sellerEmail}`);
  } catch (error) {
    console.error('Error al enviar email de orden creada:', error);
    throw error;
  }
}
