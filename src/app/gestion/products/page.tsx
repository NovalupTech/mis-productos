export const revalidate = 0;

// https://tailwindcomponents.com/component/hoverable-table
import { getPaginatedOrders, getPaginatedProductsWithImages, getCompanyConfig } from "@/actions";
import { Pagination, ProductImage, Title } from "@/components";
import { formatPrice, getPriceConfig } from "@/utils";
import Link from "next/link";
import { getCurrentCompanyId } from "@/lib/domain";
import { PriceConfig } from "@/utils/priceFormat";

interface Props {
  searchParams: {
    page?: string;
  };
}

export default async function OrdersPage({ searchParams }: {searchParams: Promise<{page?: string}>}) {
  const {page} = await searchParams;
  const pageNumber = page ? +page : 1;

  const { products, totalPages } =
    await getPaginatedProductsWithImages({ page: pageNumber, take: 10 });

  // Obtener configuración de precios de la compañía
  const companyId = await getCurrentCompanyId();
  let priceConfig = { currency: 'USD', format: 'symbol-before', showPrices: true }; // Valores por defecto
  
  if (companyId) {
    const { ok, configs } = await getCompanyConfig();
    if (ok && configs && typeof configs === 'object' && !Array.isArray(configs)) {
      priceConfig = getPriceConfig(configs as unknown as Record<string, any>) as unknown as { currency: string; format: string; showPrices: boolean };
    }
  }

  return (
    <>
      <Title title="Mantenimiento de productos" />

      <div className="flex justify-end mb-5">
        <Link href="/gestion/product/new" className="btn-primary">
          Nuevo producto
        </Link>
      </div>

      <div className="mb-10">
        <table className="min-w-full">
          <thead className="bg-gray-200 border-b">
            <tr>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Imagen
              </th>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Titulo
              </th>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Precio
              </th>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Categoría
              </th>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Stock
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <Link href={`/gestion/product/${product.slug}`}>
                    <ProductImage
                      src={ product.productImage[0].url}
                      width={80}
                      height={80}
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  </Link>
                </td>
                <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/gestion/product/${product.slug}`}
                    className="hover:underline"
                  >
                    {product.title}
                  </Link>
                </td>
                <td className="text-sm font-bold  text-gray-900 px-6 py-4 whitespace-nowrap">
                  {formatPrice(product.price, priceConfig) || '-'}
                </td>

                <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                  {product.category?.name}
                </td>

                <td className="text-sm text-gray-900 font-bold px-6 py-4 whitespace-nowrap">
                  {product.inStock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination totalPages={totalPages} />
      </div>
    </>
  );
}