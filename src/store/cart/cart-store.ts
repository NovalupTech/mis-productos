import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductInCart } from "@/interfaces";

interface State {
	cart: ProductInCart[];
	addProductToCart: (product: ProductInCart) => void;
	getTotalItems: () => number;
	updateProductQuantity: (product: ProductInCart, quantity: number) => void;
	updateProductSize: (product: ProductInCart, newSize: ProductInCart['size']) => void;
	removeProduct: (product: ProductInCart) => void;
	getSummaryInformation: () => {
		totalItems: number;
		subTotal: number;
		tax: number;
		total: number;
	};
	clearCart: () => void;
}

export const useCartStore = create<State>()(
	persist(
		(set, get) => ({
			cart: [],
			getTotalItems: () => {
				const { cart } = get();
				return cart.reduce((acc, p) => acc + p.quantity, 0);
			},
			getSummaryInformation: () => {
				const { cart } = get();
				const totalItems = cart.reduce((acc, p) => acc + p.quantity, 0);
				const subTotal = cart.reduce((acc, p) => acc + p.price * p.quantity, 0);
				const tax = subTotal * 0.15;
				const total = subTotal + tax;
				return { totalItems, subTotal, tax, total };
			},
			addProductToCart: (product) => {
				const { cart } = get();
				const productInCart = cart.some(
					(p) => p.id === product.id && p.size === product.size
				);

				if (!productInCart) {
					set({ cart: [...cart, product] });
					return;
				}

				const updatedCart = cart.map((p) => {
					if (p.id === product.id && p.size === product.size) {
						return { ...p, quantity: p.quantity + product.quantity };
					}
					return p;
				});
				set({ cart: updatedCart });
			},
			updateProductQuantity: (product, quantity) => {
				const { cart } = get();
				const updatedCart = cart.map((p) => {
					if (p.id === product.id && p.size === product.size) {
						return { ...p, quantity };
					}
					return p;
				});
				set({ cart: updatedCart });
			},
			updateProductSize: (product, newSize) => {
				const { cart } = get();
				// Verificar si ya existe el mismo producto con la nueva talla
				const productWithNewSize = cart.find(
					(p) => p.id === product.id && p.size === newSize
				);

				if (productWithNewSize) {
					// Si existe, actualizar la cantidad y eliminar el producto con la talla antigua
					const updatedCart = cart
						.map((p) => {
							if (p.id === product.id && p.size === newSize) {
								return { ...p, quantity: p.quantity + product.quantity };
							}
							return p;
						})
						.filter((p) => !(p.id === product.id && p.size === product.size));
					set({ cart: updatedCart });
				} else {
					// Si no existe, solo cambiar la talla
					const updatedCart = cart.map((p) => {
						if (p.id === product.id && p.size === product.size) {
							return { ...p, size: newSize };
						}
						return p;
					});
					set({ cart: updatedCart });
				}
			},
			removeProduct: (product) => {
				const { cart } = get();
				const updatedProducts = cart.filter(
					(p) => p.id !== product.id || p.size !== product.size
				);
				set({ cart: updatedProducts });
			},
			clearCart: () => set({ cart: [] }),
		}),
		{
			name: "shopping-cart",
		}
	)
);
