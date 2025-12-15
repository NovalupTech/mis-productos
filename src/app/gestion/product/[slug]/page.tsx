import { getCategories, getProductBySlug } from '@/actions';
import { Title } from '@/components';
import { redirect } from 'next/navigation';
import { ProductForm } from '../ui/ProductForm';
import { getCurrentCompanyId } from '@/lib/domain';



export default async function ProductPage({ params }: {params: Promise<{slug: string}>}) {

  const { slug } = await params;

  const [ product, categories, companyId ] = await Promise.all([
    getProductBySlug({slug}),
    getCategories(),
    getCurrentCompanyId()
  ]);
 

  // Todo: new
  if ( !product && slug !== 'new' ) {
    redirect('/gestion/products')
  }

  const title = (slug === 'new') ? 'Nuevo producto' : 'Editar producto'

  // Si es un producto nuevo, agregar el companyId
  const productWithCompanyId = product 
    ? product 
    : (companyId ? { companyId } : {});

  return (
    <>
      <Title title={ title } />

      <ProductForm product={ productWithCompanyId } categories={ categories } />
    </>
  );
}