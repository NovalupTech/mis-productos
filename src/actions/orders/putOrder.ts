"use server";

import prisma from "@/lib/prisma";
import { middleware } from "@/auth.config";
import { Address } from "@/interfaces/Address";
import { requireCompanyId } from "@/lib/company-context";
import { getCompanyConfigPublic } from "@/actions/company-config/get-company-config-public";
import { getCurrentDomain } from "@/lib/domain";
import { Prisma } from "@prisma/client";
import { createPendingPaymentForOrder } from "@/lib/payments/payment-helpers";

interface productsInCart {
	productId: string;
	quantity: number;
}

export const placeOrder = async (
	productsInCart: productsInCart[],
	address?: Address
) => {
	const session = await middleware();
	const user = session?.user.id;
	const companyId = await requireCompanyId();

	// Si no hay usuario logueado, necesitamos crear/obtener un Customer
	// Para esto necesitamos el email de la dirección
	if (!user && (!address || !address.email)) {
		return {
			ok: false,
			message: "Se requiere email para realizar la compra sin registro",
		};
	}

	const products = await prisma.product.findMany({
		where: {
			id: {
				in: productsInCart.map((product) => product.productId),
			},
			active: true,
		},
	});

	// Obtener configuraciones de stock e IVA
	let subtractOnOrder = true; // Valor por defecto
	let enableTax = false; // Valor por defecto
	let taxType: 'percentage' | 'fixed' = 'percentage';
	let taxValue = 0;
	
	try {
		const configResult = await getCompanyConfigPublic(companyId);
		if (configResult.ok && configResult.configs) {
			const configs = configResult.configs as Record<string, any>;
			subtractOnOrder = configs['stock.subtractOnOrder'] !== undefined 
				? Boolean(configs['stock.subtractOnOrder']) 
				: true;
			enableTax = configs['prices.enableTax'] !== undefined 
				? Boolean(configs['prices.enableTax']) 
				: false;
			taxType = configs['prices.taxType'] || 'percentage';
			taxValue = configs['prices.taxValue'] !== undefined 
				? Number(configs['prices.taxValue']) 
				: 0;
		}
	} catch (error) {
		console.error('Error al obtener configuraciones:', error);
		// Usar valores por defecto si hay error
	}

	const itemsInOrder = productsInCart.reduce(
		(count, prod) => prod.quantity + count,
		0
	);

	const { subTotal, tax, total } = productsInCart.reduce(
		(totals, item) => {
			const quantity = item.quantity;
			const product = products.find((prod) => prod.id === item.productId);

			if (!product) throw new Error("Producto no encontrado");

			const itemSubTotal = product.price * quantity;
			let itemTax = 0;
			
			// Calcular IVA solo si está habilitado
			if (enableTax && taxValue > 0) {
				if (taxType === 'percentage') {
					itemTax = itemSubTotal * (taxValue / 100);
				} else {
					// Valor fijo: se aplica por item (o por orden completa, según lógica de negocio)
					// Aquí lo aplicamos por item para mantener consistencia
					itemTax = taxValue * quantity;
				}
			}
			
			const itemTotal = itemSubTotal + itemTax;

			return {
				subTotal: totals.subTotal + itemSubTotal,
				tax: totals.tax + itemTax,
				total: totals.total + itemTotal,
			};
		},
		{ subTotal: 0, tax: 0, total: 0 }
	);

	try {
		// Validar stock disponible antes de crear la orden
		products.forEach((prod) => {
			const productQuantity = productsInCart
				.filter((p) => p.productId === prod.id)
				.reduce((acc, p) => acc + p.quantity, 0);
			
			if (productQuantity === 0) {
				throw new Error("No se puede comprar un producto con cantidad 0");
			}

			if (prod.inStock < productQuantity) {
				throw new Error(`No hay suficiente stock del producto "${prod.title}". Disponible: ${prod.inStock}, Solicitado: ${productQuantity}`);
			}
		});

		// transaccion prisma
		const prismaTx = await prisma.$transaction(async (tx) => {
			let updatedProducts = products;
			let customerId: string | undefined = undefined;

			// Si no hay usuario logueado, crear/obtener Customer dentro de la transacción
			if (!user && address?.email) {
				// Buscar si ya existe un Customer con ese email y companyId
				const existingCustomer = await tx.customer.findFirst({
					where: {
						email: address.email.toLowerCase(),
						companyId: companyId
					}
				});

				if (existingCustomer) {
					// Actualizar datos si es necesario
					const updatedCustomer = await tx.customer.update({
						where: { id: existingCustomer.id },
						data: {
							name: `${address.firstName} ${address.lastName}`,
							phone: address.phone || existingCustomer.phone
						}
					});
					customerId = updatedCustomer.id;
				} else {
					// Crear nuevo Customer dentro de la transacción
					try {
						const newCustomer = await tx.customer.create({
							data: {
								name: `${address.firstName} ${address.lastName}`,
								email: address.email.toLowerCase(),
								phone: address.phone || null,
								companyId: companyId
							}
						});
						customerId = newCustomer.id;
					} catch (error: any) {
						// Si el email ya existe (en otra company), buscar el existente para esta company
						if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
							const existingCustomer = await tx.customer.findFirst({
								where: {
									email: address.email.toLowerCase(),
									companyId: companyId
								}
							});
							if (existingCustomer) {
								customerId = existingCustomer.id;
							} else {
								throw new Error("No se pudo crear el cliente. El email ya está en uso en otra empresa.");
							}
						} else {
							throw error;
						}
					}
				}
			}

			// Validar que al menos uno de userId o customerId esté presente
			if (!user && !customerId) {
				throw new Error("Se requiere usuario logueado o email para crear la orden");
			}

			// Restar stock de productos solo si está configurado
			if (subtractOnOrder) {
				const updatedProductsPromises = products.map((prod) => {
					const productQuantity = productsInCart
						.filter((p) => p.productId === prod.id)
						.reduce((acc, p) => acc + p.quantity, 0);

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

				updatedProducts = await Promise.all(updatedProductsPromises);

				// Validar que el stock no sea negativo después de restar
				updatedProducts.forEach((prod) => {
					if(prod.inStock < 0) {
						throw new Error("No hay suficiente stock del producto "+prod.title+" para completar la orden");
					}
				});
			}

			// insertar orden y productos en orden
			const orderData: Prisma.OrderUncheckedCreateInput = {
				companyId: companyId,
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
			};

			// Solo agregar userId si existe usuario
			if (user) {
				orderData.userId = user;
			}

			// Solo agregar customerId si existe customer
			if (customerId) {
				orderData.customerId = customerId;
			}

			const order = await tx.order.create({
				data: orderData,
			});

			// insertar direccion de la orden solo si se proporciona
			if (address) {
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
			}

			// Obtener la moneda de la configuración de la compañía
			let currency = 'USD'; // Por defecto USD
			try {
				const configResult = await getCompanyConfigPublic(companyId);
				if (configResult.ok && configResult.configs) {
					const configs = configResult.configs as Record<string, any>;
					currency = configs['prices.currency'] || 'USD';
				}
			} catch (error) {
				console.error('Error al obtener configuración de moneda:', error);
				// Usar USD por defecto si hay error
			}

			// Crear pago pendiente para la orden
			// Esto se hace fuera de la transacción porque createPendingPaymentForOrder
			// maneja su propia conexión a la BD
			const paymentResult = await createPendingPaymentForOrder(
				order.id,
				companyId,
				total,
				currency,
				order.id // externalReference = orderId
			);

			if (!paymentResult.ok) {
				console.error('Error al crear pago pendiente:', paymentResult.error);
				// No fallar la creación de la orden si falla el pago pendiente
			}

			return {
				ok: true,
				orden: order,
				updatedProducts,
			};
		});

		// Enviar email al vendedor sobre la nueva orden creada
		// No esperamos la respuesta para no bloquear la creación de la orden
		if (prismaTx.orden) {
			// Construir URL base para la llamada API
			const domain = await getCurrentDomain();
			const baseUrl = process.env.ENV === 'dev' ? 'http://localhost:3000' : `https://${domain}`;
			
			fetch(`${baseUrl}/api/orders/send-order-created-email`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ orderId: prismaTx.orden.id }),
			}).catch((error) => {
				console.error('Error al enviar email de orden creada:', error);
				// No fallar la creación de la orden si el email falla
			});
		}

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
