import Link from "next/link";
import { Title } from "@/components";
import { ProductsInCart } from "./ui/ProductsInCart";
import { PlaceOrder } from "./ui/PlaceOrder";

export default function CheckoutPage() {
  return (
    <div className="flex justify-center items-center mb-72 px-10 sm:px-0">
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
        <PlaceOrder/>


        </div>

      </div>
    </div>
  );
}