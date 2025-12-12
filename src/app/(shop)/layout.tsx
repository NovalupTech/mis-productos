import { TopMenu, Sidebar, Footer } from "@/components";
import { CompanyProvider } from "@/components/providers/CompanyProvider";
import { Toast } from "@/components/ui/toast/Toast";
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentCompanyId, getCurrentDomain } from '@/lib/domain';
import prisma from '@/lib/prisma';
import LandingPage from '../landing/page';

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
  // Buscar el companyId asociado al dominio
  const companyId = await getCurrentCompanyId();

  // Si no hay companyId, verificar si debemos redirigir
  if (!companyId) {
    // Si ya estamos en el dominio base, mostrar la landing page
    return <LandingPage />;
  }

  // Obtener la información completa de la compañía con sus atributos
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      logo: true,
      attributes: {
        select: {
          id: true,
          name: true,
          type: true,
          values: {
            select: {
              id: true,
              value: true,
            },
            orderBy: {
              value: 'asc',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      },
    },
  });

  // Si hay companyId, renderizar el shop normal
  return (
    <main className="min-h-screen">
      <CompanyProvider company={company} />
      <TopMenu />
      <Sidebar/>
      <Toast />

      <div className="mx-0 sm:mx-10">
        { children }
      </div>

      <Footer />

    </main>
  );
}