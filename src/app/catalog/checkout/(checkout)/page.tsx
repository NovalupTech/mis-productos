import Link from "next/link";
import { Title } from "@/components";
import { ProductsInCart } from "./ui/ProductsInCart";
import { PlaceOrder } from "./ui/PlaceOrder";
import { getCurrentCompanyId } from "@/lib/domain";
import { getShippingConfigPublic } from "@/actions/shipping/get-shipping-config-public";

export default async function CheckoutPage() {
  const companyId = await getCurrentCompanyId();
  let handlesShipping = true; // Por defecto true

  if (companyId) {
    const shippingConfig = await getShippingConfigPublic(companyId);
    if (shippingConfig.ok && shippingConfig.config) {
      handlesShipping = shippingConfig.config.handlesShipping;
    }
  }

  return (
    <div className="flex justify-center items-center mb-72 px-8 sm:px-0" style={{ backgroundColor: 'var(--theme-primary-color)' }}>
      <div className="flex flex-col w-[1000px]">

        <Title title="Todo listo! esta es tu orden" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          { /* Carrito */ }
          <div className="flex flex-col mt-5">
            <Link href={'/catalog/cart'} className="underline mb-5">
              Modificar carrito
            </Link>

          { /* Items */ }
          <ProductsInCart />

        </div>

        { /* Checkout - Resumen de orden */ }
        <PlaceOrder handlesShipping={handlesShipping} />


        </div>

      </div>
    </div>
  );
}