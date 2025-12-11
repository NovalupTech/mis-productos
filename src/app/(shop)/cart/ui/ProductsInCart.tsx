'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QuantitySelector } from "@/components";
import { useCartStore } from "@/store/cart/cart-store";

export const ProductsInCart = () => {
    const { cart, updateProductQuantity, removeProduct } = useCartStore(state => state)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
      setLoaded(true)
    }, [])
    
    if(!loaded) return <p>Loading...</p>

	if(loaded) if(cart.length === 0) redirect('/empty')

	return (
		<>
			{cart.map((product) => (
				<div key={product.slug} className="flex mb-5">
					<Image
						src={`/products/${product.image}`}
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
                        <Link className="hover:underline cursor-pointer" href={`/product/${product.slug}`}>
						    <p>{product.title}</p>
                        </Link>
						<p>${product.price}</p>
						<QuantitySelector onQuantityChanged={(quantity) => updateProductQuantity(product, quantity)} quantity={product.quantity} />
						<button onClick={() => removeProduct(product)} className="underline mt-3">Remover</button>
					</div>
				</div>
			))}
		</>
	);
};
