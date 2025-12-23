import Image from "next/image";
import { notFound } from "next/navigation";
import { MercadoPagoButton, PaypalButtons, Title } from "@/components";
import { getOrderById } from "@/actions/orders/get-order-by-id";
import { formatPrice, getPriceConfig, type PriceConfig } from '@/utils/priceFormat';
import { getCompanyConfigPublic } from '@/actions/company-config/get-company-config-public';
import { getPaymentMethodsPublic } from '@/actions/payment-methods/get-payment-methods-public';
import { OrderStatus } from "../ui/OrderStatus";
import { BankTransferButton } from "@/components/ui/bank-transfer/BankTransferButton";
import { CoordinateWithSellerButton } from "@/components/ui/coordinate-with-seller/CoordinateWithSellerButton";
import { PaymentMethodType } from '@prisma/client';
import Link from "next/link";

export default async function OrderPage({ params }: {params: Promise<{id: string}>}) {

  const { id } = await params;
  const { address, order, products  } = await getOrderById(id);

  if(!order){
    notFound();
  }

  // Obtener configuración de precios de la compañía
  let priceConfig: PriceConfig = { currency: 'USD', format: 'symbol-before', showPrices: true };
  if (order.companyId) {
    const { configs } = await getCompanyConfigPublic(order.companyId);
    if (configs && typeof configs === 'object' && !Array.isArray(configs)) {
      priceConfig = getPriceConfig(configs as Record<string, any>);
    }
  }

  // Obtener métodos de pago habilitados
  const { paymentMethods = [] } = await getPaymentMethodsPublic(order.companyId);
  
  // Si los precios no se muestran, solo mostrar "coordinar con el vendedor"
  const hidePrices = priceConfig.showPrices === false;
  
  // Si no hay métodos configurados, mostrar "coordinar con el vendedor" por defecto
  const hasConfiguredMethods = paymentMethods.length > 0;
  
  // Determinar qué métodos mostrar
  // Si los precios están ocultos, solo mostrar "coordinar con el vendedor"
  // PayPal: mostrar solo si está específicamente habilitado (solo si se muestran precios)
  const showPayPal = !hidePrices && paymentMethods.some(pm => pm.type === 'PAYPAL');
  const showMercadoPago = !hidePrices && paymentMethods.some(pm => pm.type === 'MERCADOPAGO');
  const bankTransferMethod = !hidePrices ? paymentMethods.find(pm => pm.type === 'BANK_TRANSFER') : null;
  const coordinateWithSellerMethod = paymentMethods.find(pm => pm.type === ('COORDINATE_WITH_SELLER' as PaymentMethodType));

  return (
    <div className="flex justify-center items-center mb-72 px-8 sm:px-0">
      <div className="flex flex-col w-[1000px]">

        <Title title={"Tu orden"} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          { /* Carrito */ }
          <div className="flex flex-col mt-5">
            <OrderStatus isPaid={order.isPaid} />
          { /* Items */ }
          {
            products?.map((product) => (
              <div key={product.product.slug} className="flex mb-5">
                <a href={`/catalog/product/${product.product.slug}`}>
                  <Image
                    src={product.product.productImage[0].url.startsWith('http') || product.product.productImage[0].url.startsWith('https') ? product.product.productImage[0].url : `/products/${product.product.productImage[0].url}` as string}
                    width={100}
                    height={100}
                    alt={product.product.title}
                    className="mr-5 rounded w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden"
                    style={{ viewTransitionName: `product-image-${product.product.slug}` }}
                  />
                </a>
                  <div>
                    <Link href={`/catalog/product/${product.product.slug}`}>
                      <p>{product.product.title}</p>
                    </Link>
                    <p>{formatPrice(product.price, priceConfig)} x {product.quantity}</p>
                    <p>Subtotal: {formatPrice(product.price * product.quantity, priceConfig)}</p>
                  </div>
                </div>
            ))
          }

        </div>

        { /* Checkout - Resumen de orden */ }
        <div className="bg-white rounded-xl shadow-xl p-7">

          {address && (
            <>
              <h2 className="text-2xl font-bold mb-2">Direccion de entrega</h2>
              <div className="mb-10">
                <p>{address.firstName}</p>
                <p>{address.lastName}</p>
                <p>{address.address}</p>
                <p>{address.address2}</p>
                <p>{address.city}</p>
                <p>{address.country.id +", "+ address.country.name}</p>
                <p>{address.postalCode}</p>
                <p>{address.phone}</p>
              </div>

              <div className="w-full h-0.5 rounded bg-gray-200 mb-10" />
            </>
          )}

          <h2 className="text-2xl mb-2">Resumen de orden</h2>
          <div className="grid grid-cols-2">
            <span>Nº de productos</span>
            <span className="text-right">{order.itemsInOrder}</span>

            {priceConfig.showPrices !== false && (
              <>
                <span>Subtotal</span>
                <span className="text-right">{formatPrice(order.subTotal, priceConfig)}</span>

                <span>Impuestos</span>
                <span className="text-right">{formatPrice(order.tax, priceConfig)}</span>

                <span className="mt-5 text-2xl">Total:</span>
                <span className="mt-5 text-2xl text-right">{formatPrice(order?.total, priceConfig)}</span>
              </>
            )}
          </div>

          <div className="mt-5 mb-2 w-full">
            {
              !order.isPaid ?
                <>
                  {hidePrices ? (
                    // Si los precios están ocultos, solo mostrar "coordinar con el vendedor"
                    coordinateWithSellerMethod && coordinateWithSellerMethod.config ? (
                      <CoordinateWithSellerButton 
                        amount={order!.total} 
                        orderId={order!.id}
                        config={coordinateWithSellerMethod.config as {
                          contactType: 'whatsapp' | 'email';
                          whatsappNumber?: string;
                          email?: string;
                        }}
                      />
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          Por favor, contacta al vendedor para coordinar el pago de tu pedido.
                        </p>
                      </div>
                    )
                  ) : (
                    // Si los precios se muestran, mostrar todos los métodos configurados
                    // Si no hay métodos configurados, mostrar "coordinar con el vendedor" por defecto
                    <>
                      {!hasConfiguredMethods ? (
                        // Si no hay métodos configurados, mostrar mensaje para coordinar con el vendedor
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Por favor, contacta al vendedor para coordinar el pago de tu pedido.
                          </p>
                        </div>
                      ) : (
                        // Si hay métodos configurados, mostrar los que estén habilitados
                        <>
                          {showPayPal && (
                            <PaypalButtons amount={order!.total} orderId={order!.id} />
                          )}
                          {showMercadoPago && (
                            <MercadoPagoButton amount={order!.total} orderId={order!.id} />
                          )}
                          {bankTransferMethod && bankTransferMethod.config && (
                            <BankTransferButton 
                              amount={order!.total} 
                              orderId={order!.id}
                              config={bankTransferMethod.config as {
                                bankName: string;
                                accountHolder: string;
                                cbu: string;
                                alias?: string;
                                dni?: string;
                                notes?: string;
                                receiptContactType?: 'email' | 'whatsapp';
                                receiptEmail?: string;
                                receiptWhatsApp?: string;
                              }}
                              coordinateWithSellerConfig={coordinateWithSellerMethod?.config as {
                                contactType: 'whatsapp' | 'email';
                                whatsappNumber?: string;
                                email?: string;
                              } | undefined}
                            />
                          )}
                          {coordinateWithSellerMethod && coordinateWithSellerMethod.config && (
                            <CoordinateWithSellerButton 
                              amount={order!.total} 
                              orderId={order!.id}
                              config={coordinateWithSellerMethod.config as {
                                contactType: 'whatsapp' | 'email';
                                whatsappNumber?: string;
                                email?: string;
                              }}
                            />
                          )}
                        </>
                      )}
                    </>
                  )}
                </> :
                <>
                  <OrderStatus isPaid={order.isPaid} />
                  <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-semibold text-green-800">
                        ¡Pago confirmado!
                      </h3>
                      <p className="text-sm text-green-700">
                        Se ha enviado un email con los detalles de tu compra a tu dirección de correo electrónico.
                      </p>
                      <p className="text-sm text-green-700">
                        El vendedor se pondrá en contacto contigo pronto para coordinar la entrega de tu pedido.
                      </p>
                    </div>
                  </div>
                </>
            }
          </div>

        </div>


        </div>

      </div>
    </div>
  );
}