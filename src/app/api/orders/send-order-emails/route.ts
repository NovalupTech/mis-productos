import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * API Route para enviar emails después de confirmar un pago
 * Reutilizable para cualquier proveedor de pago (PayPal, MercadoPago, etc.)
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

    if (!order.isPaid) {
      return NextResponse.json(
        { ok: false, message: 'La orden no está pagada' },
        { status: 400 }
      );
    }

    // Obtener email del vendedor (empresa)
    const sellerEmail = order.company.email;

    if (!sellerEmail) {
      console.warn(`La empresa ${order.company.name} no tiene email configurado`);
    }

    // TODO: Obtener email del cliente cuando se implemente el registro
    // const customerEmail = order.customer?.email || order.user?.email;
    const customerEmail = null; // TODO: Implementar cuando se agregue el registro de clientes

    // Enviar emails
    const emailResults = await sendOrderEmails({
      orderId: order.id,
      orderNumber: orderId.split('-').at(-1) || orderId,
      sellerEmail,
      customerEmail,
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
      message: 'Emails enviados',
      results: emailResults,
    });
  } catch (error) {
    console.error('Error al enviar emails de orden:', error);
    return NextResponse.json(
      { ok: false, message: 'Error al enviar emails' },
      { status: 500 }
    );
  }
}

interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  sellerEmail: string | null;
  customerEmail: string | null;
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

async function sendOrderEmails(data: OrderEmailData) {
  const results = {
    sellerEmailSent: false,
    customerEmailSent: false,
  };

  // Enviar email al vendedor
  if (data.sellerEmail) {
    try {
      await sendSellerEmail(data);
      results.sellerEmailSent = true;
    } catch (error) {
      console.error('Error al enviar email al vendedor:', error);
    }
  }

  // Enviar email al cliente (TODO: cuando se implemente el registro)
  if (data.customerEmail) {
    try {
      await sendCustomerEmail(data);
      results.customerEmailSent = true;
    } catch (error) {
      console.error('Error al enviar email al cliente:', error);
    }
  } else {
    console.log('Email del cliente no disponible (TODO: implementar cuando se agregue registro)');
  }

  return results;
}

async function sendSellerEmail(data: OrderEmailData) {
  // Usar nodemailer (librería nativa de Node.js)
  // Instalar: pnpm add nodemailer
  // Instalar tipos: pnpm add -D @types/nodemailer
  
  // Variables de entorno necesarias:
  // SMTP_HOST=smtp.gmail.com (o tu servidor SMTP)
  // SMTP_PORT=587
  // SMTP_USER=tu-email@gmail.com
  // SMTP_PASS=tu-contraseña-de-aplicacion
  // SMTP_FROM=noreply@tudominio.com
  
  try {
    // Intentar importar nodemailer dinámicamente
    let nodemailer: any;
    try {
      nodemailer = await import('nodemailer');
    } catch (importError) {
      console.warn('⚠️ nodemailer no está instalado. Instala con: pnpm add nodemailer');
      console.log('📧 Email al vendedor (simulado):', {
        to: data.sellerEmail,
        subject: `Nueva orden #${data.orderNumber} - ${data.orderData.companyName}`,
      });
      return;
    }
    
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ Variables SMTP no configuradas. Configura SMTP_USER y SMTP_PASS en .env');
      console.log('📧 Email al vendedor (simulado):', {
        to: data.sellerEmail,
        subject: `Nueva orden #${data.orderNumber} - ${data.orderData.companyName}`,
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
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Nueva orden recibida</h1>
            <p>Has recibido una nueva orden <strong>#${data.orderNumber}</strong></p>
            
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
                <h2>Dirección de entrega</h2>
                <p><strong>${data.orderData.address.firstName} ${data.orderData.address.lastName}</strong></p>
                <p>${data.orderData.address.address}</p>
                ${data.orderData.address.address2 ? `<p>${data.orderData.address.address2}</p>` : ''}
                <p>${data.orderData.address.city}, ${data.orderData.address.postalCode}</p>
                <p>${data.orderData.address.country}</p>
                <p><strong>Teléfono:</strong> ${data.orderData.address.phone}</p>
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.sellerEmail!,
      subject: `Nueva orden #${data.orderNumber} - ${data.orderData.companyName}`,
      html: htmlContent,
    });

    console.log(`✅ Email enviado al vendedor: ${data.sellerEmail}`);
  } catch (error) {
    console.error('Error al enviar email al vendedor:', error);
    throw error;
  }
}

async function sendCustomerEmail(data: OrderEmailData) {
  // TODO: Implementar cuando se agregue el registro de clientes
  
  try {
    // Intentar importar nodemailer dinámicamente
    let nodemailer: any;
    try {
      nodemailer = await import('nodemailer');
    } catch (importError) {
      console.warn('⚠️ nodemailer no está instalado. Instala con: pnpm add nodemailer');
      console.log('📧 Email al cliente (simulado):', {
        to: data.customerEmail,
        subject: `Confirmación de compra #${data.orderNumber} - ${data.orderData.companyName}`,
      });
      return;
    }
    
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ Variables SMTP no configuradas. Configura SMTP_USER y SMTP_PASS en .env');
      console.log('📧 Email al cliente (simulado):', {
        to: data.customerEmail,
        subject: `Confirmación de compra #${data.orderNumber} - ${data.orderData.companyName}`,
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
            h1 { color: #27ae60; }
            h2 { color: #34495e; margin-top: 20px; }
            .order-summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .order-item { padding: 10px; border-bottom: 1px solid #dee2e6; }
            .order-item:last-child { border-bottom: none; }
            .total { font-size: 1.2em; font-weight: bold; color: #27ae60; margin-top: 15px; }
            .message { background: #d4edda; padding: 15px; border-radius: 5px; margin-top: 20px; color: #155724; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>¡Gracias por tu compra!</h1>
            <p>Tu orden <strong>#${data.orderNumber}</strong> ha sido confirmada.</p>
            
            <div class="order-summary">
              <h2>Resumen de tu compra</h2>
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

            <div class="message">
              <p><strong>Próximos pasos:</strong></p>
              <p>El vendedor se pondrá en contacto contigo pronto para coordinar la entrega de tu pedido.</p>
            </div>
            <div>
                <p>Datos del vendedor:</p>
                <p>${data.companyData.name}</p>
                <p>${data.companyData.email || 'No disponible'}</p>
                <p>${data.companyData.phone || 'No disponible'}</p>
            </div>
            <p>Gracias por tu compra!</p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.customerEmail!,
      subject: `Confirmación de compra #${data.orderNumber} - ${data.orderData.companyName}`,
      html: htmlContent,
    });

    console.log(`✅ Email enviado al cliente: ${data.customerEmail}`);
  } catch (error) {
    console.error('Error al enviar email al cliente:', error);
    throw error;
  }
}
