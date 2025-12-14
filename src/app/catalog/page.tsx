export const revalidate = 60;

import { getPaginatedProductsWithImages, getCompanyConfigPublic } from "@/actions";
import { Title } from "@/components";
import { InfiniteScrollProducts } from "@/components/ui/infinite-scroll/InfiniteScrollProducts";
import { Product } from "@/interfaces";
import { RemoveTagButton } from "./ui/RemoveTagButton";
import { getCurrentCompanyId } from '@/lib/domain';

export default async function CatalogPage({ searchParams } :{searchParams: Promise<{page?: string, search?: string, [key: string]: string | undefined}>} & {params: Promise<{page?: string, search?: string}>}) {

  const params = await searchParams;
  const {page, search, tag, ...restParams} = params;
  const pageNumber = page ? +page : 1;
  const searchQuery = search ? search : '';
  const tagFilter = tag ? tag : undefined;
  
  // Extraer filtros de atributos (parámetros que empiezan con filter_)
  const attributeFilters: Record<string, string> = {};
  Object.entries(restParams).forEach(([key, value]) => {
    if (key.startsWith('filter_') && value) {
      const attributeId = key.replace('filter_', '');
      attributeFilters[attributeId] = value;
    }
  });
  
  const { products, totalPages } = await getPaginatedProductsWithImages({
    page: 1, // Siempre empezar desde la página 1 para el scroll infinito
    search: searchQuery,
    tag: tagFilter,
    attributeFilters: Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined,
  });

  // Obtener configuración de columnas, imagen y precios
  const companyId = await getCurrentCompanyId();
  let columns = 4; // Valor por defecto: 4 columnas
  let imageSize: 'small' | 'medium' | 'large' = 'medium'; // Valor por defecto: medium
  let priceConfig = { currency: 'USD', format: 'symbol-before', showPrices: true }; // Valores por defecto
  if (companyId) {
    const { configs } = await getCompanyConfigPublic(companyId);
    if (configs && typeof configs === 'object' && !Array.isArray(configs)) {
      const configsMap = configs as Record<string, any>;
      const catalogColumns = configsMap['catalog.columns'];
      if (typeof catalogColumns === 'number' && catalogColumns >= 1 && catalogColumns <= 6) {
        columns = catalogColumns;
      }
      const catalogImageSize = configsMap['catalog.imageSize'];
      if (typeof catalogImageSize === 'string' && ['small', 'medium', 'large'].includes(catalogImageSize)) {
        imageSize = catalogImageSize as 'small' | 'medium' | 'large';
      }
      // Configuración de precios
      priceConfig = {
        currency: configsMap['prices.currency'] || 'USD',
        format: configsMap['prices.format'] || 'symbol-before',
        showPrices: configsMap['prices.showPrices'] !== undefined ? configsMap['prices.showPrices'] : true,
      };
    }
  }

  return (
    <>
      <div className="mb-2">
        <div className="mt-3">
          <h1 className="antialiased text-4xl font-semibold my-7"></h1>
          {(tag || search) && (
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-xl">
                {tag 
                  ? `Productos con tag: ${tag}` 
                  : search 
                    ? `Resultados de la búsqueda: ${search}` 
                    : 'Todos los productos'}
              </h2>
              {tag && <RemoveTagButton />}
            </div>
          )}
          {!tag && !search && (
            <h2 className="text-xl mb-5">Todos los productos</h2>
          )}
        </div>
      </div>

      <InfiniteScrollProducts
        initialProducts={products as unknown as Product[]}
        initialPage={1}
        initialTotalPages={totalPages}
        search={searchQuery}
        tag={tagFilter}
        attributeFilters={Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined}
        catalogColumns={columns}
        catalogImageSize={imageSize}
      />
    </>
  );
}
