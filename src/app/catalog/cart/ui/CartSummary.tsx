'use client'

import { useCartStore } from "@/store/cart/cart-store";
import { formatPrice } from "@/utils";
import { usePriceConfig } from "@/components/providers/PriceConfigProvider";
import { useEffect, useState } from "react";

export const CartSummary = () => {
  const priceConfig = usePriceConfig();
	const summaryInformation = useCartStore(store => store.getSummaryInformation());
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		setLoaded(true);
	}, []);

	if (!loaded) return <p>Loading...</p>;

	return (
		<div className="grid grid-cols-2">
			<span>Nº de productos</span>
			<span className="text-right">
                {summaryInformation.totalItems === 1 ? "1 producto" : `${summaryInformation.totalItems} productos`}
            </span>

			<span>Subtotal</span>
			<span className="text-right">
                {formatPrice(summaryInformation.subTotal, priceConfig) || '-'}
            </span>

			<span>Inpuestos (15%)</span>
			<span className="text-right">
                {formatPrice(summaryInformation.tax, priceConfig) || '-'}
            </span>

			<span className="mt-5 text-2xl">Total:</span>
			<span className="mt-5 text-2xl text-right">
                {formatPrice(summaryInformation.total, priceConfig) || '-'}
            </span>
		</div>
	);
};
