"use client";

import { useEffect, useState } from "react";
import { useAddressStore } from "@/store/address/address-stlore";
import { useCartStore } from "@/store/cart/cart-store";
import { formatPrice } from "@/utils";
import { usePriceConfig } from "@/components/providers/PriceConfigProvider";
import clsx from "clsx";
import { placeOrder } from "@/actions/orders/putOrder";

export const PlaceOrder = () => {
	const [loaded, setLoaded] = useState(false);
    const [OrderPlaced, setOrderPlaced] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
    const address = useAddressStore(state => state.address);
    const cart = useCartStore(store => store.cart);
    const priceConfig = usePriceConfig();
    const summaryInformation = useCartStore(store => store.getSummaryInformation(priceConfig));
    const clearCart = useCartStore(store => store.clearCart);

	useEffect(() => {
		setLoaded(true);
	}, []);

	if (!loaded) return <p>Cargando...</p>;

    const onPlaceOrder = async () => {
        setOrderPlaced(true)

        const productsToOrder = cart.map(product => {
            return {
                productId: product.id,
                quantity: product.quantity,
            }
        })

		const result = await placeOrder(productsToOrder, address);
		if(!result.ok){
			setErrorMessage(result?.message ?? '')
			setOrderPlaced(false)
			return;
		}

		clearCart();
		window.location.replace('/catalog/orders/' + result.orden?.id) 
    }

	return (
		<div className="bg-white rounded-xl shadow-xl p-7">
			<h2 className="text-2xl font-bold mb-2">Direccion de entrega</h2>
			<div className="mb-10">
				<p>{address.firstName}</p>
				<p>{address.lastName}</p>
				<p>{address.address}</p>
				<p>{address.address2}</p>
				<p>{address.postalCode}</p>
				<p>{address.city}</p>
				<p>{address.country}</p>
				<p>{address.phone}</p>
			</div>

			<div className="w-full h-0.5 rounded bg-gray-200 mb-10" />

			<h2 className="text-2xl mb-2">Resumen de orden</h2>
			<div className="grid grid-cols-2">
			<span>Nº de productos</span>
			<span className="text-right">
                {summaryInformation.totalItems === 1 ? "1 producto" : `${summaryInformation.totalItems} productos`}
            </span>

			<span>Subtotal</span>
			<span className="text-right">
                {formatPrice(summaryInformation.subTotal, priceConfig) || '-'}
            </span>

			{summaryInformation.discountTotal > 0 && (
				<>
					<span className="text-red-600">Descuentos</span>
					<span className="text-right text-red-600">
						-{formatPrice(summaryInformation.discountTotal, priceConfig) || '-'}
					</span>
				</>
			)}

			<span>
				{priceConfig.enableTax && priceConfig.taxValue && priceConfig.taxValue > 0
					? priceConfig.taxType === 'percentage'
						? `Impuestos (${priceConfig.taxValue}%)`
						: 'Impuestos'
					: 'Impuestos'}
			</span>
			<span className="text-right">
                {formatPrice(summaryInformation.tax, priceConfig) || '-'}
            </span>

			<span className="mt-5 text-2xl">Total:</span>
			<span className="mt-5 text-2xl text-right">
                {formatPrice(summaryInformation.total, priceConfig) || '-'}
            </span>
		</div>

			{
				errorMessage && (
					<div className="mt-5 bg-red-100 p-3 rounded">
						<p className="text-red-500">{errorMessage}</p>
					</div>
				)
			}

			<div className="mt-5 mb-2 w-full">
				<p>
					<span className="text-xs">
						Al hacer clic en &apos;Ir a pagar&apos; aceptas nuestros{" "}
						<a href="#" className="underline">
							Terminos y condiciones
						</a>
					</span>
				</p>
				<button disabled={OrderPlaced} onClick={onPlaceOrder} className={
                    clsx("flex justify-center", {
                        'btn-primary': !OrderPlaced,
                        'btn-disabled': OrderPlaced
                    })
                }>Ir a pagar</button>
			</div>
		</div>
	);
};
