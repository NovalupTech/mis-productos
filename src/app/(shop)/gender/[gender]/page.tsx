export const revalidate = 60;

import { notFound, redirect } from "next/navigation";
import ProductGrid from "@/components/ui/product-grid/ProductGrid";
import { Pagination, Title } from "@/components";
import { getPaginatedProductsWithImages } from "@/actions";
import { Gender } from "@prisma/client";

interface Props {
  params: {
    gender: Gender;
  },
  searchParams: {
    page?: string;
  }
}

export default async function GenderPage({ params, searchParams }: {params: Promise<{gender: Gender}>, searchParams: Promise<{page?: string}>}) {

  const {page} = await searchParams;
  const pageNumber = page ? +page : 1;

  const labels = {
    'kid': 'Niños',
    'women': 'Mujeres',
    'men': 'Hombres',
    'unisex': 'Todos'
  }
  const {gender} = await params;
  if(!labels[gender]){
    notFound();
  }

  const { products, totalPages } = await getPaginatedProductsWithImages({page: pageNumber, gender});

  if(!products.length){
    redirect('/gender/'+gender
    );
  }

  return (
    <>
      <Title
        title="Tienda"
        subtitle={`Productos para ${labels[gender]}`}
        className="mb-2"
      />
      <ProductGrid products={products.filter(prod => prod.gender === gender)} />

      <Pagination totalPages={totalPages}  />
    </>
  );
}