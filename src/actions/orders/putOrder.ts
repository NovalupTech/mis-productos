"use server";

export const runtime = 'nodejs';

import prisma from "@/lib/prisma";
import { middleware } from "@/auth.config";
import { Address } from "@/interfaces/Address";
import { requireCompanyId } from "@/lib/company-context";

interface productsInCart {
	productId: string;
	quantity: number;
}

export const placeOrder = async (
	productsInCart: productsInCart[],
	address: Address
) => {
	const session = await middleware();
	const user = session?.user.id;
	const companyId = await requireCompanyId();

	if (!user) {
		return {
			ok: false,
			message: "No se ha encontrado el usuario",
		};
	}

	const products = await prisma.product.findMany({
		where: {
			id: {
				in: productsInCart.map((product) => product.productId),
			},
		},
	});

	const itemsInOrder = productsInCart.reduce(
		(count, prod) => prod.quantity + count,
		0
	);

	const { subTotal, tax, total } = productsInCart.reduce(
		(totals, item) => {
			const quantity = item.quantity;
			const product = products.find((prod) => prod.id === item.productId);

			if (!product) throw new Error("Producto no encontrado");

			const subTotal = product.price * quantity;
			const tax = subTotal * 0.15;
			const total = subTotal + tax;

			return {
				subTotal: totals.subTotal + subTotal,
				tax: totals.tax + tax,
				total: totals.total + total,
			};
		},
		{ subTotal: 0, tax: 0, total: 0 }
	);

	try {
		// transaccion prisma
		const prismaTx = await prisma.$transaction(async (tx) => {
			// restar stock de productos
			const updatedProductsPromises = products.map((prod) => {
				const productQuantity = productsInCart
					.filter((p) => p.productId === prod.id)
					.reduce((acc, p) => acc + p.quantity, 0);
				if (productQuantity === 0) {
					throw new Error("No se puede comprar un producto con cantidad 0");
				}

				return tx.product.update({
					where: {
						id: prod.id,
					},
					data: {
						inStock: {
							decrement: productQuantity,
						},
					},
				});
			});

			const updatedProducts = await Promise.all(updatedProductsPromises);

            updatedProducts.forEach((prod) => {
                if(prod.inStock < 0) {
                    throw new Error("No hay suficiente stock del producto "+prod.title+" para completar la orden");
                }
            })

			// insertar orden y productos en orden
			const order = await tx.order.create({
				data: {
					companyId: companyId,
					userId: user,
					subTotal: subTotal,
					total: total,
					tax: tax,
					itemsInOrder: itemsInOrder,
					OrderItem: {
						createMany: {
							data: productsInCart.map((prod) => ({
								productId: prod.productId,
								quantity: prod.quantity,
								price:
									products.find((p) => p.id === prod.productId)?.price ?? 0,
							})),
						},
					},
				},
			});

			// insertar direccion de la orden
			await tx.orderAddress.create({
				data: {
					orderId: order.id,
					firstName: address.firstName,
					lastName: address.lastName,
					address: address.address,
					address2: address.address2,
					city: address.city,
					countryId: address.country,
					postalCode: address.postalCode,
					phone: address.phone,
				},
			});

			return {
				ok: true,
				orden: order,
				updatedProducts,
			};
		});

        return {
            ok: true,
            orden: prismaTx.orden,
            updatedProducts: prismaTx.updatedProducts
        }
	} catch (error: unknown) {
		console.log(error)
		return {
			ok: false,
		};
	}
};
