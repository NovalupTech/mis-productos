export const revalidate = 60;


import { getPaginatedProductsWithImages } from "@/actions";
import { Title } from "@/components";
import { InfiniteScrollProducts } from "@/components/ui/infinite-scroll/InfiniteScrollProducts";
import { Product } from "@/interfaces";

export default async function Home({ searchParams } :{searchParams: Promise<{page?: string, search?: string, [key: string]: string | undefined}>} & {params: Promise<{page?: string, search?: string}>}) {

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

  return (
    <>
      <Title
        title=""
        subtitle={
          tag 
            ? `Productos con tag: ${tag}` 
            : search 
              ? `Resultados de la búsqueda: ${search}` 
              : 'Todos los productos'
        }
        className="mb-2"
      />

      <InfiniteScrollProducts
        initialProducts={products as unknown as Product[]}
        initialPage={1}
        initialTotalPages={totalPages}
        search={searchQuery}
        tag={tagFilter}
        attributeFilters={Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined}
      />
    </>
  );
}
