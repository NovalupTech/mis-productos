import { TopMenu, Sidebar, Footer } from "@/components";
import { CompanyProvider } from "@/components/providers/CompanyProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PriceConfigProvider } from "@/components/providers/PriceConfigProvider";
import { PayPalProvider } from "@/components/providers/PayPalProvider";
import { Toast } from "@/components/ui/toast/Toast";
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getCurrentCompanyId, getCurrentDomain } from '@/lib/domain';
import { getCompanyConfigPublic, getPaymentMethodsPublic } from '@/actions';
import { getPaypalConfig } from '@/actions/payment-methods/get-paypal-config';
import { getPriceConfig } from '@/utils';
import prisma from '@/lib/prisma';

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
  
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = host ? `${protocol}://${host}` : 'https://misproductos.shop';

  // Si no hay companyId, retornar metadatos por defecto
  if (!companyId) {
    return {
      title: {
        default: 'Misproductos',
        template: '%s - Misproductos',
      },
      description: 'Catálogo online personalizable para vender tus productos y servicios',
      keywords: ['misproductos', 'catálogo online', 'tienda online'],
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

  // Construir keywords dinámicos
  const domainParts = domain.split('.');
  const subdomain = domainParts.length > 2 ? domainParts[0] : null;
  const keywords = [
    company?.name || 'tienda',
    'misproductos',
    domain,
    ...(subdomain ? [`${subdomain} misproductos`, `${subdomain}.misproductos.shop`] : []),
    'página',
    'contenido',
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

  const companyName = company?.name || 'Shop';
  const description = `Página de ${companyName}. Contenido y productos en ${domain}.`;

  return {
    title: {
      default: `${companyName} | Misproductos`,
      template: `%s - ${companyName}`,
    },
    description,
    keywords,
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
    openGraph: {
      title: `${companyName}`,
      description,
      url: baseUrl,
      siteName: companyName,
      type: 'website',
      locale: 'es_ES',
      images: [
        {
          url: logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`,
          width: 1200,
          height: 630,
          alt: companyName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: companyName,
      description,
      images: [logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`],
    },
    alternates: {
      canonical: baseUrl,
    },
  };
}

export default async function DynamicPageLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Buscar el companyId asociado al dominio
  const companyId = await getCurrentCompanyId();

  // Si no hay companyId, no renderizar nada (debería redirigir desde page.tsx)
  if (!companyId) {
    return <>{children}</>;
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

  // Renderizar el layout con la información de la compañía
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
      <CompanyProvider company={company} />
      <ThemeProvider 
        primaryColor={primaryColor} 
        secondaryColor={secondaryColor}
        primaryTextColor={primaryTextColor}
        secondaryTextColor={secondaryTextColor}
      >
        <PriceConfigProvider priceConfig={priceConfig}>
          <PayPalProvider clientId={paypalClientId}>
            <TopMenu />
            <Sidebar/>
            <Toast />

          <div className="mx-0 sm:mx-10" style={{ backgroundColor: primaryColor }}>
            {children}
          </div>

          <Footer paymentMethods={paymentMethods} />
          </PayPalProvider>
        </PriceConfigProvider>
      </ThemeProvider>
    </main>
  );
}
