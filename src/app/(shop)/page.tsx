export const revalidate = 60;


import { getPaginatedProductsWithImages } from "@/actions";
import { Pagination, Title } from "@/components";
import ProductGrid from "@/components/ui/product-grid/ProductGrid";
import { redirect } from "next/navigation";
//import { geistSans, titleFont } from "@/config/fonts";

interface Props {
  searchParams: {
    page?: string;
    search?: string;
  }
}

export default async function Home({ searchParams } :{searchParams: Promise<{page?: string, search?: string}>} & {params: Promise<{page?: string, search?: string}>}) {

  const {page, search} = await searchParams;
  const pageNumber = page ? +page : 1;
  const searchQuery = search ? search : '';
  const { products, totalPages } = await getPaginatedProductsWithImages({page: pageNumber, search: searchQuery});

  return (
    <>
      {/*<h1 className={titleFont.className}>hola mundo (Fuente desde google)</h1>*/}
      {/*<h1 className={geistSans.className}>hola mundo (Fuente desde local)</h1>*/}
      {/*<h1 className={geistSans.className}>hola mundo</h1>*/}
      <Title
        title="Tienda"
        subtitle={search ? `Resultados de la búsqueda: ${search}` : 'Todos los productos'}
        className="mb-2"
      />

      <ProductGrid products={products} />

      {
        totalPages === 0 && <p className="text-center mt-10 mb-20">No se encontraron productos</p>
      }
      {
        totalPages ? <Pagination totalPages={totalPages}  /> : null
      }
    </>
  );
}
