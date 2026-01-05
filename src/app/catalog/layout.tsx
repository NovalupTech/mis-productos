import { TopMenu, Sidebar, Footer, FloatingSocialButton, StructuredData } from "@/components";
import { CompanyProvider } from "@/components/providers/CompanyProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PriceConfigProvider } from "@/components/providers/PriceConfigProvider";
import { PayPalProvider } from "@/components/providers/PayPalProvider";
import { DiscountProvider } from "@/components/providers/DiscountProvider";
import { FavoritesProvider } from "@/components/providers/FavoritesProvider";
import { Toast } from "@/components/ui/toast/Toast";
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentCompanyId, getCurrentDomain } from '@/lib/domain';
import { getCompanyConfigPublic, getPaymentMethodsPublic } from '@/actions';
import { getPaypalConfig } from '@/actions/payment-methods/get-paypal-config';
import { getPriceConfig } from '@/utils';
import prisma from '@/lib/prisma';
import LandingPage from '../landing/page';

/**
 * Calcula el color hover oscureciendo el color base en un 15%
 */
function calculateHoverColor(hex: string): string {
  // Remover el # si existe
  let cleanHex = hex.replace('#', '');
  
  // Si es un color de 3 dígitos, expandirlo a 6
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  // Convertir a número
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return hex.startsWith('#') ? hex : `#${hex}`;
  }
  
  // Extraer RGB
  const r = (num >> 16) & 0xFF;
  const g = (num >> 8) & 0xFF;
  const b = num & 0xFF;
  
  // Ajustar brillo (oscurecer 15%)
  const factor = 0.85; // 1 - 0.15
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  
  // Convertir de vuelta a hexadecimal
  const newHex = ((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0');
  return `#${newHex}`;
}

export async function generateMetadata(): Promise<Metadata> {
  // Buscar el companyId asociado al dominio
  const companyId = await getCurrentCompanyId();
  const domain = await getCurrentDomain();
  
  // Obtener headers para construir URLs absolutas
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = host ? `${protocol}://${host}` : 'https://misproductos.shop';

  // Si no hay companyId, retornar metadatos por defecto
  if (!companyId) {
    return {
      title: {
        default: 'Misproductos - Catálogo Online',
        template: '%s - Misproductos',
      },
      description: 'Catálogo online personalizable para vender tus productos y servicios',
      keywords: ['misproductos', 'catálogo online', 'tienda online', 'ecommerce'],
      openGraph: {
        url: baseUrl,
        type: 'website',
      },
    };
  }

  // Obtener la información de la compañía para los metadatos
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
    },
  });

  // Construir keywords dinámicos incluyendo el dominio y "misproductos"
  const domainParts = domain.split('.');
  const subdomain = domainParts.length > 2 ? domainParts[0] : null;
  const keywords = [
    company?.name || 'tienda',
    'misproductos',
    domain,
    ...(subdomain ? [`${subdomain} misproductos`, `${subdomain}.misproductos.shop`] : []),
    'catálogo online',
    'tienda online',
    'ecommerce',
    'comprar online',
  ];

  // Construir la URL del favicon basado en el logo de la compañía
  let faviconUrl = '/icon.svg';
  let logoUrl = '/oc_image.png';
  
  if (company?.logo) {
    faviconUrl = company.logo.startsWith('http') || company.logo.startsWith('https')
      ? company.logo
      : `/logos/${company.logo}`;
    logoUrl = faviconUrl;
  }

  const companyName = company?.name || 'Tienda';
  const description = `Catálogo online de ${companyName}. Compra productos de calidad en ${domain}. Tienda online con Misproductos.`;

  return {
    title: {
      default: `${companyName} - Catálogo Online | Misproductos`,
      template: `%s - ${companyName}`,
    },
    description,
    keywords,
    authors: [{ name: companyName }],
    creator: companyName,
    publisher: companyName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
    openGraph: {
      title: `${companyName} - Catálogo Online`,
      description,
      url: `${baseUrl}/catalog`,
      siteName: companyName,
      type: 'website',
      locale: 'es_ES',
      images: [
        {
          url: logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`,
          width: 1200,
          height: 630,
          alt: `${companyName} - Catálogo Online`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${companyName} - Catálogo Online`,
      description,
      images: [logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`],
    },
    alternates: {
      canonical: `${baseUrl}/catalog`,
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
  const domain = await getCurrentDomain();
  
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = host ? `${protocol}://${host}` : 'https://misproductos.shop';

  // Si no hay companyId, verificar si debemos redirigir
  if (!companyId) {
    // Si ya estamos en el dominio base, mostrar la landing page
    return <LandingPage />;
  }

  // Obtener la información completa de la compañía con sus atributos y páginas
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
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
      pages: {
        select: {
          id: true,
          type: true,
          slug: true,
          title: true,
          enabled: true,
          isLanding: true,
        },
        orderBy: {
          type: 'asc',
        },
      },
      socials: {
        select: {
          id: true,
          type: true,
          url: true,
          label: true,
          enabled: true,
          order: true,
        },
        where: {
          enabled: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  // Obtener configuraciones de la empresa para los colores del tema y precios
  const { configs } = await getCompanyConfigPublic(companyId);
  const configsMap: Record<string, any> = configs && typeof configs === 'object' ? configs : {};
  const primaryColor = (configsMap['theme.primaryColor'] as string | undefined) || '#ffffff'; // Blanco por defecto
  const secondaryColor = (configsMap['theme.secondaryColor'] as string | undefined) || '#2563eb'; // Azul eléctrico por defecto
  const primaryTextColor = (configsMap['theme.primaryTextColor'] as string | undefined) || '#1f2937'; // Gris oscuro por defecto
  const secondaryTextColor = (configsMap['theme.secondaryTextColor'] as string | undefined) || '#ffffff'; // Blanco por defecto
  
  // Calcular color hover (oscurecer 15%)
  const secondaryHover = calculateHoverColor(secondaryColor);

  // Configuración de precios
  const priceConfig = getPriceConfig(configsMap);

  // Obtener métodos de pago habilitados
  const { paymentMethods = [] } = await getPaymentMethodsPublic(companyId);

  // Obtener configuración de PayPal
  const { clientId: paypalClientId } = await getPaypalConfig(companyId);

  // Si hay companyId, renderizar el shop normal
  return (
    <main className="min-h-screen" style={{ backgroundColor: primaryColor }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --theme-primary-color: ${primaryColor};
            --theme-secondary-color: ${secondaryColor};
            --theme-secondary-color-hover: ${secondaryHover};
            --theme-primary-text-color: ${primaryTextColor};
            --theme-secondary-text-color: ${secondaryTextColor};
          }
        `
      }} />
      {company && (() => {
        const logoUrl = company.logo 
          ? (company.logo.startsWith('http') ? company.logo : `${baseUrl}${company.logo.startsWith('/') ? company.logo : `/logos/${company.logo}`}`)
          : `${baseUrl}/oc_image.png`;
        
        const storeSchema = {
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: company.name,
          url: baseUrl,
          image: logoUrl,
          description: `Tienda online de ${company.name} - Catálogo de productos en ${domain}`,
          ...(company.address && {
            address: {
              '@type': 'PostalAddress',
              addressLocality: company.address,
            },
          }),
          ...(company.email && { email: company.email }),
          ...(company.phone && { telephone: company.phone }),
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/catalog?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        };

        const organizationSchema = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: company.name,
          url: baseUrl,
          logo: logoUrl,
          ...(company.address && {
            address: {
              '@type': 'PostalAddress',
              addressLocality: company.address,
            },
          }),
          ...(company.email && { email: company.email }),
          ...(company.phone && { telephone: company.phone }),
        };

        return (
          <>
            <StructuredData data={storeSchema} />
            <StructuredData data={organizationSchema} />
          </>
        );
      })()}
      <CompanyProvider company={company} />
      <ThemeProvider 
        primaryColor={primaryColor} 
        secondaryColor={secondaryColor}
        primaryTextColor={primaryTextColor}
        secondaryTextColor={secondaryTextColor}
      >
        <PriceConfigProvider priceConfig={priceConfig}>
          <PayPalProvider clientId={paypalClientId}>
            <DiscountProvider>
              <FavoritesProvider>
                <TopMenu />
                <Sidebar/>
                <Toast />

          <div className="mx-0 sm:mx-10" style={{ backgroundColor: primaryColor }}>
            { children }
          </div>

          <Footer paymentMethods={paymentMethods} />
          <FloatingSocialButton />
              </FavoritesProvider>
            </DiscountProvider>
          </PayPalProvider>
        </PriceConfigProvider>
      </ThemeProvider>
    </main>
  );
}