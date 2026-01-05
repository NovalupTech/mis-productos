import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getCurrentCompanyId, getCurrentDomain } from '@/lib/domain';
import prisma from '@/lib/prisma';
import LandingPage from './landing/page';

export async function generateMetadata(): Promise<Metadata> {
  const companyId = await getCurrentCompanyId();
  const domain = await getCurrentDomain();
  
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = host ? `${protocol}://${host}` : 'https://misproductos.shop';

  // Si no hay companyId, es la landing page principal
  if (!companyId) {
    return {
      title: 'Misproductos | Catálogo online personalizable para vender',
      description: 'Crea tu catálogo online, acepta pagos y personaliza la experiencia de tus clientes con Misproductos. Lanzamos tu tienda en 48 horas.',
      keywords: [
        'misproductos',
        'catálogo online',
        'tienda online',
        'ecommerce',
        'vender online',
        'plataforma ecommerce',
        'misproductos.shop',
      ],
      openGraph: {
        url: baseUrl,
        type: 'website',
      },
    };
  }

  // Si hay companyId, metadata para la tienda del cliente
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      logo: true,
    },
  });

  const domainParts = domain.split('.');
  const subdomain = domainParts.length > 2 ? domainParts[0] : null;
  const keywords = [
    company?.name || 'tienda',
    'misproductos',
    domain,
    ...(subdomain ? [`${subdomain} misproductos`, `${subdomain}.misproductos.shop`] : []),
    'catálogo online',
    'tienda online',
    'comprar online',
  ];

  const companyName = company?.name || 'Tienda';
  const description = `Bienvenido a ${companyName}. Catálogo online de productos. Compra en ${domain}.`;

  return {
    title: `${companyName} - Tienda Online | Misproductos`,
    description,
    keywords,
    openGraph: {
      title: `${companyName} - Tienda Online`,
      description,
      url: baseUrl,
      type: 'website',
    },
  };
}

export default async function RootPage() {
  // Buscar el companyId asociado al dominio
  const companyId = await getCurrentCompanyId();

  // Si no hay companyId, mostrar la landing page del sistema
  if (!companyId) {
    return <LandingPage />;
  }

  // Buscar la landing page configurada para esta compañía
  const landingPage = await prisma.page.findFirst({
    where: {
      companyId,
      enabled: true,
      isLanding: true,
    },
  });

  // Si hay una landing page, redirigir a ella
  if (landingPage) {
    redirect(`/${landingPage.slug}`);
  }

  // Si no hay landing page, redirigir al catálogo por defecto
  redirect('/catalog');
}
