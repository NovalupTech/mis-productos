export const revalidate = 0;

// https://tailwindcomponents.com/component/hoverable-table
import { getPaginatedOrders, getPaginatedProductsWithImages, getCompanyConfig } from "@/actions";
import { Pagination, ProductImage, Title } from "@/components";
import { formatPrice, getPriceConfig } from "@/utils";
import Link from "next/link";
import { getCurrentCompanyId } from "@/lib/domain";
import { PriceConfig } from "@/utils/priceFormat";
import { ImportProductsButton } from "./ui/ImportProductsButton";
import { ApiImportButton } from "./ui/ApiImportButton";
import { ProductSearch } from "./ui/ProductSearch";

interface Props {
  searchParams: {
    page?: string;
    search?: string;
  };
}

export default async function OrdersPage({ searchParams }: {searchParams: Promise<{page?: string; search?: string}>}) {
  const {page, search} = await searchParams;
  const pageNumber = page ? +page : 1;

  const companyId = await getCurrentCompanyId();
  const { products, totalPages } =
    await getPaginatedProductsWithImages({ 
      page: pageNumber, 
      take: 10,
      companyId: companyId || undefined,
      search: search || undefined
    });

  // Obtener configuración de precios de la compañía
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

      <div className="mb-5">
        <div className="mb-4">
          <ProductSearch />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <ImportProductsButton />
          <ApiImportButton />
          <Link href="/gestion/product/new" className="btn-primary text-center">
            Nuevo producto
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex justify-center items-center h-full mt-10">
          <p className="text-gray-500">
            {search ? `No se encontraron productos que coincidan con "${search}"` : 'No hay productos cargados'}
          </p>
        </div>
      ) : (
        <div className="mb-10">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
                    Código
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
                          src={product.productImage[0]?.url}
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
                    <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                      {product.code}
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
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/gestion/product/${product.slug}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <ProductImage
                      src={product.productImage[0]?.url}
                      width={80}
                      height={80}
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {product.title}
                    </h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Código:</span> {product.code}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Precio:</span> {formatPrice(product.price, priceConfig) || '-'}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Categoría:</span> {product.category?.name || '-'}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Stock:</span> {product.inStock}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Pagination totalPages={totalPages} />
        </div>
      )}
    </>
  );
}