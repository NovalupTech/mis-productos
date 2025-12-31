import { TopMenu, Sidebar, Footer, FloatingSocialButton } from "@/components";
import { CompanyProvider } from "@/components/providers/CompanyProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PriceConfigProvider } from "@/components/providers/PriceConfigProvider";
import { PayPalProvider } from "@/components/providers/PayPalProvider";
import { DiscountProvider } from "@/components/providers/DiscountProvider";
import { FavoritesProvider } from "@/components/providers/FavoritesProvider";
import { Toast } from "@/components/ui/toast/Toast";
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
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

  // Si no hay companyId, retornar metadatos por defecto
  if (!companyId) {
    return {
      title: {
        default: 'Misproductos',
        template: '%s - Misproductos',
      },
      description: 'Catálogo online personalizable para vender tus productos y servicios',
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