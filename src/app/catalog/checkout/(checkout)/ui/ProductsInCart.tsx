'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useCartStore } from "@/store/cart/cart-store";
import { formatPrice } from "@/utils";
import { usePriceConfig } from "@/components/providers/PriceConfigProvider";

export const ProductsInCart = () => {
    const { cart } = useCartStore(state => state)
    const [loaded, setLoaded] = useState(false)
    const priceConfig = usePriceConfig()

    useEffect(() => {
      setLoaded(true)
    }, [])
    
    if(!loaded) return <p>Loading...</p>

	if(loaded) if(cart.length === 0) redirect('/catalog/empty')

	return (
		<>
			{cart.map((product) => (
				<div key={product.slug} className="flex mb-5">
					<Image
						src={product.image.startsWith('http') || product.image.startsWith('https') ? product.image : `/products/${product.image}` as string}
						style={{
							width: "100px",
							height: "100px",
						}}
						width={100}
						height={100}
						alt={product.title}
						className="mr-5 rounded"
					/>
					<div>
						<p>{product.title} ({product.quantity}) </p>
						<p className="font-bold">{formatPrice(product.price, priceConfig) || '-'}</p>
					</div>
				</div>
			))}
		</>
	);
};
