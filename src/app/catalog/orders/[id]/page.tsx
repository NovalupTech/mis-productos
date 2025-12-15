import Image from "next/image";
import { notFound } from "next/navigation";
import { MercadoPagoButton, PaypalButtons, Title } from "@/components";
import { getOrderById } from "@/actions/orders/get-order-by-id";
import { formatCurrency } from '@/utils/currencyFormat';
import { OrderStatus } from "../ui/OrderStatus";

export default async function OrderPage({ params }: {params: Promise<{id: string}>}) {

  const { id } = await params;
  const { address, order, products  } = await getOrderById(id);

  if(!order){
    notFound();
  }

  return (
    <div className="flex justify-center items-center mb-72 px-10 sm:px-0">
      <div className="flex flex-col w-[1000px]">

        <Title title={`Orden: #${id.split("-").at(-1)}`} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          { /* Carrito */ }
          <div className="flex flex-col mt-5">
            <OrderStatus isPaid={order.isPaid} />
          { /* Items */ }
          {
            products?.map((product) => (
              <div key={product.product.slug} className="flex mb-5">
                  <Image
                    src={product.product.productImage[0].url.startsWith('http') || product.product.productImage[0].url.startsWith('https') ? product.product.productImage[0].url : `/products/${product.product.productImage[0].url}` as string}
                    style={{
                      width: '100px',
                      height: '100px',
                    }}
                    width={100}
                    height={100}
                    alt={product.product.title}
                    className="mr-5 rounded"
                  />
                  <div>
                    <p>{product.product.title}</p>
                    <p>${product.price} x {product.quantity}</p>
                    <p>Subtotal: ${product.price * product.quantity}</p>
                  </div>
                </div>
            ))
          }

        </div>

        { /* Checkout - Resumen de orden */ }
        <div className="bg-white rounded-xl shadow-xl p-7">

          <h2 className="text-2xl font-bold mb-2">Direccion de entrega</h2>
          <div className="mb-10">
            <p>{address?.firstName}</p>
            <p>{address?.lastName}</p>
            <p>{address?.address}</p>
            <p>{address?.address2}</p>
            <p>{address?.city}</p>
            <p>{address?.country.id +", "+ address?.country.name}</p>
            <p>{address?.postalCode}</p>
            <p>{address?.phone}</p>
          </div>

          <div className="w-full h-0.5 rounded bg-gray-200 mb-10" />

          <h2 className="text-2xl mb-2">Resumen de orden</h2>
          <div className="grid grid-cols-2">
            <span>Nº de productos</span>
            <span className="text-right">{formatCurrency(order.itemsInOrder)} </span>

            <span>Subtotal</span>
            <span className="text-right">{formatCurrency(order.subTotal)}</span>

            <span>Inpuestos (15%)</span>
            <span className="text-right">{formatCurrency(order.tax)}</span>

            <span className="mt-5 text-2xl">Total:</span>
            <span className="mt-5 text-2xl text-right">{formatCurrency(order?.total)}</span>
          </div>

          <div className="mt-5 mb-2 w-full">
            {
              !order.isPaid ?
                <>
                  <MercadoPagoButton amount={order!.total} orderId={order!.id} />
                  <PaypalButtons amount={order!.total} orderId={order!.id} />
                </> :
                <OrderStatus isPaid={order.isPaid} />
            }
          </div>

        </div>


        </div>

      </div>
    </div>
  );
}