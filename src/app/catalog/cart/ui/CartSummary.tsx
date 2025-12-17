'use client'

import { useCartStore } from "@/store/cart/cart-store";
import { formatPrice } from "@/utils";
import { usePriceConfig } from "@/components/providers/PriceConfigProvider";
import { useEffect, useState } from "react";

export const CartSummary = () => {
  const priceConfig = usePriceConfig();
	const summaryInformation = useCartStore(store => store.getSummaryInformation(priceConfig));
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		setLoaded(true);
	}, []);

	if (!loaded) return <p>Loading...</p>;

	// Formatear el texto del IVA según la configuración
	const getTaxLabel = () => {
		if (!priceConfig.enableTax || !priceConfig.taxValue || priceConfig.taxValue === 0) {
			return 'Impuestos';
		}
		if (priceConfig.taxType === 'percentage') {
			return `Impuestos (${priceConfig.taxValue}%)`;
		}
		return 'Impuestos';
	};

	return (
		<div className="grid grid-cols-2">
			<span>Nº de productos</span>
			<span className="text-right">
                {summaryInformation.totalItems === 1 ? "1 producto" : `${summaryInformation.totalItems} productos`}
            </span>

			{priceConfig.showPrices !== false && (
				<>
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

					<span>{getTaxLabel()}</span>
					<span className="text-right">
						{formatPrice(summaryInformation.tax, priceConfig) || '-'}
					</span>

					<span className="mt-5 text-2xl">Total:</span>
					<span className="mt-5 text-2xl text-right">
						{formatPrice(summaryInformation.total, priceConfig) || '-'}
					</span>
				</>
			)}
		</div>
	);
};
