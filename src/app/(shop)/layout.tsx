import { TopMenu, Sidebar, Footer } from "@/components";
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentCompanyId, getCurrentDomain } from '@/lib/domain';
import LandingPage from './landing/page';

export const metadata: Metadata = {
  title: {
    default: 'Shop',
    template: '%s - Teslo | shop',
  },
  description: 'Una tienda de productos',
}

export default async function ShopLayout({
 children
}: {
 children: React.ReactNode;
}) {
  // Obtener el dominio actual
  const domain = await getCurrentDomain();
  
  // Buscar el companyId asociado al dominio
  const companyId = await getCurrentCompanyId();

  // Si no hay companyId, verificar si debemos redirigir
  if (!companyId) {
    const baseDomain = process.env.BASE_DOMAIN || 'misproductos.shop';
    const siteUrl = process.env.SITE_URL;
    
    // Si el dominio actual no es el dominio base, redirigir al dominio base
    if (domain !== baseDomain) {
      const redirectUrl = siteUrl || `https://${baseDomain}/`;
      redirect(redirectUrl);
    }
    
    // Si ya estamos en el dominio base, mostrar la landing page
    return <LandingPage />;
  }

  // Si hay companyId, renderizar el shop normal
  return (
    <main className="min-h-screen">

      <TopMenu/>
      <Sidebar/>

      <div className="mx-0 sm:mx-10">
        { children }
      </div>

      <Footer />

    </main>
  );
}