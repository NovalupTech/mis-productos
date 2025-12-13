import { TopMenu, Sidebar, Footer } from "@/components";
import { CompanyProvider } from "@/components/providers/CompanyProvider";
import { Toast } from "@/components/ui/toast/Toast";
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentCompanyId, getCurrentDomain } from '@/lib/domain';
import prisma from '@/lib/prisma';
import LandingPage from '../landing/page';

export async function generateMetadata(): Promise<Metadata> {
  // Buscar el companyId asociado al dominio
  const companyId = await getCurrentCompanyId();

  // Si no hay companyId, retornar metadatos por defecto
  if (!companyId) {
    return {
      title: {
        default: 'Shop',
        template: '%s - Catalogo',
      },
      description: 'Una tienda de productos',
    };
  }

  // Obtener la información de la compañía para los metadatos
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      logo: true,
    },
  });

  // Construir la URL del favicon basado en el logo de la compañía
  let faviconUrl = '/icon.svg'; // Favicon por defecto
  
  if (company?.logo) {
    // Si el logo es una URL completa, usarla directamente
    // Si no, construir la ruta relativa
    faviconUrl = company.logo.startsWith('http') || company.logo.startsWith('https')
      ? company.logo
      : `/logos/${company.logo}`;
  }

  return {
    title: {
      default: company?.name || 'Shop',
      template: `%s - ${company?.name || 'Shop'}`,
    },
    description: `Tienda de productos de ${company?.name || 'Shop'}`,
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
    openGraph: {
      images: company?.logo 
        ? [company.logo.startsWith('http') || company.logo.startsWith('https')
            ? company.logo
            : `/logos/${company.logo}`]
        : ['/oc_image.png'],
    },
  };
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