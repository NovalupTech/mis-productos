import Link from "next/link";
import { Title } from "@/components";
import { ProductsInCart } from "./ui/ProductsInCart";
import { CartSummary } from "./ui/CartSummary";
import { CheckoutButton } from "./ui/CheckoutButton";
import { getCurrentCompanyId } from "@/lib/domain";
import { getShippingConfigPublic } from "@/actions/shipping/get-shipping-config-public";
import { middleware } from "@/auth.config";

export default async function CartPage() {
  const companyId = await getCurrentCompanyId();
  const session = await middleware();
  let handlesShipping = true; // Por defecto true

  if (companyId) {
    const shippingConfig = await getShippingConfigPublic(companyId);
    if (shippingConfig.ok && shippingConfig.config) {
      handlesShipping = shippingConfig.config.handlesShipping;
    }
  }

  return (
    <div className="flex justify-center items-center mb-72 px-8 sm:px-0">
      <div className="flex flex-col w-[1000px]">

        <Title title="Carrito" />

        {!session?.user && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-800 mb-1">
                  ¿Ya tienes una cuenta?
                </h3>
                <p className="text-sm text-blue-700">
                  Inicia sesión para una mejor experiencia: guarda tus direcciones, revisa tus pedidos anteriores y más.
                </p>
              </div>
              <Link
                href="/login?redirect=/catalog/cart"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          { /* Carrito */ }
          <div className="flex flex-col mt-5">
            <Link href={'/'} className="underline mb-5">
              Continuá comprando
            </Link>

          { /* Items */ }
          <ProductsInCart />

        </div>

        { /* Checkout - Resumen de orden */ }
        <div className="bg-white rounded-xl shadow-xl p-7 h-[300px] ">
          <h2 className="text-2xl mb-2">Resumen de orden</h2>
          <CartSummary/>

          <div>
            <CheckoutButton handlesShipping={handlesShipping} />
          </div>

        </div>


        </div>

      </div>
    </div>
  );
}