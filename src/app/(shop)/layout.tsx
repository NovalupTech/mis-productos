import { TopMenu, Sidebar, Footer } from "@/components";
import { Metadata } from 'next';
import { getCompanyIdFromContext } from '@/lib/company-context';
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
  // Evaluar si hay companyId
  const companyId = await getCompanyIdFromContext();

  // Si no hay companyId, renderizar la landing page
  if (!companyId) {
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