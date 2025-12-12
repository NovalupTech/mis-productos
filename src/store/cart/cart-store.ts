import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductInCart } from "@/interfaces";
import { useToastStore } from "../toast/toast-store";

interface State {
	cart: ProductInCart[];
	addProductToCart: (product: ProductInCart) => void;
	getTotalItems: () => number;
	updateProductQuantity: (product: ProductInCart, quantity: number) => void;
	updateProductAttributes: (product: ProductInCart, newAttributes: Record<string, string | number>) => void;
	removeProduct: (product: ProductInCart) => void;
	getSummaryInformation: () => {
		totalItems: number;
		subTotal: number;
		tax: number;
		total: number;
	};
	clearCart: () => void;
}

// Función helper para generar una clave única del producto basada en ID y atributos
const getProductKey = (product: ProductInCart): string => {
	const attrsKey = product.selectedAttributes 
		? Object.entries(product.selectedAttributes)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, value]) => `${key}:${value}`)
			.join('|')
		: '';
	return `${product.id}${attrsKey ? `|${attrsKey}` : ''}`;
};

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
				const productKey = getProductKey(product);
				const productInCart = cart.find(
					(p) => getProductKey(p) === productKey
				);

				if (!productInCart) {
					set({ cart: [...cart, product] });
					useToastStore.getState().addToast(
						`${product.title} agregado al carrito`,
						'success'
					);
					return;
				}

				const updatedCart = cart.map((p) => {
					if (getProductKey(p) === productKey) {
						return { ...p, quantity: p.quantity + product.quantity };
					}
					return p;
				});
				set({ cart: updatedCart });
				useToastStore.getState().addToast(
					`Cantidad de ${product.title} actualizada`,
					'success'
				);
			},
			updateProductQuantity: (product, quantity) => {
				const { cart } = get();
				const productKey = getProductKey(product);
				const productInCart = cart.find((p) => getProductKey(p) === productKey);
				
				if (!productInCart) return;
				
				const updatedCart = cart.map((p) => {
					if (getProductKey(p) === productKey) {
						return { ...p, quantity };
					}
					return p;
				});
				set({ cart: updatedCart });
				
				if (quantity === 0) {
					useToastStore.getState().addToast(
						`${product.title} eliminado del carrito`,
						'info'
					);
				} else if (quantity > productInCart.quantity) {
					useToastStore.getState().addToast(
						`Cantidad de ${product.title} aumentada`,
						'success'
					);
				} else {
					useToastStore.getState().addToast(
						`Cantidad de ${product.title} disminuida`,
						'info'
					);
				}
			},
			updateProductAttributes: (product, newAttributes) => {
				const { cart } = get();
				const oldKey = getProductKey(product);
				const updatedProduct = { ...product, selectedAttributes: newAttributes };
				const newKey = getProductKey(updatedProduct);
				
				// Verificar si ya existe el mismo producto con los nuevos atributos
				const productWithNewAttrs = cart.find(
					(p) => getProductKey(p) === newKey
				);

				if (productWithNewAttrs) {
					// Si existe, actualizar la cantidad y eliminar el producto con los atributos antiguos
					const updatedCart = cart
						.map((p) => {
							if (getProductKey(p) === newKey) {
								return { ...p, quantity: p.quantity + product.quantity };
							}
							return p;
						})
						.filter((p) => getProductKey(p) !== oldKey);
					set({ cart: updatedCart });
				} else {
					// Si no existe, solo cambiar los atributos
					const updatedCart = cart.map((p) => {
						if (getProductKey(p) === oldKey) {
							return { ...p, selectedAttributes: newAttributes };
						}
						return p;
					});
					set({ cart: updatedCart });
				}
			},
			removeProduct: (product) => {
				const { cart } = get();
				const productKey = getProductKey(product);
				const updatedProducts = cart.filter(
					(p) => getProductKey(p) !== productKey
				);
				set({ cart: updatedProducts });
				useToastStore.getState().addToast(
					`${product.title} eliminado del carrito`,
					'info'
				);
			},
			clearCart: () => {
				set({ cart: [] });
				useToastStore.getState().addToast(
					'Carrito vaciado',
					'warning'
				);
			},
		}),
		{
			name: "shopping-cart",
		}
	)
);
