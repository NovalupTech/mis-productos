import { getCategories, getProductBySlug } from '@/actions';
import { Title } from '@/components';
import { redirect } from 'next/navigation';
import { ProductForm } from '../ui/ProductForm';
import { getCurrentCompanyId } from '@/lib/domain';
import Link from 'next/link';



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
      <div className="flex items-center gap-4 mt-3">
        <Title title={ title } className="flex-1" />
        <Link 
          href="/gestion/products"
          className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
        >
          ← Volver al listado
        </Link>
      </div>

      <ProductForm product={ productWithCompanyId } categories={ categories } />
    </>
  );
}