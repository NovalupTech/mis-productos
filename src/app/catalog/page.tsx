export const revalidate = 60;

import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getPaginatedProductsWithImages, getCompanyConfigPublic } from "@/actions";
import { Product } from "@/interfaces";
import { getCurrentCompanyId, getCurrentDomain } from '@/lib/domain';
import { CatalogHeaderWrapper } from "./ui/CatalogHeaderWrapper";
import { PriceConfig } from "@/utils";
import prisma from '@/lib/prisma';
import { StructuredData } from '@/components/seo/StructuredData';

export async function generateMetadata(): Promise<Metadata> {
  const companyId = await getCurrentCompanyId();
  const domain = await getCurrentDomain();
  
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = host ? `${protocol}://${host}` : 'https://misproductos.shop';

  if (!companyId) {
    return {
      title: 'Catálogo - Misproductos',
      description: 'Explora nuestro catálogo de productos online',
    };
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      logo: true,
      address: true,
    },
  });

  const domainParts = domain.split('.');
  const subdomain = domainParts.length > 2 ? domainParts[0] : null;
  const keywords = [
    company?.name || 'tienda',
    'misproductos',
    domain,
    ...(subdomain ? [`${subdomain} misproductos`, `${subdomain}.misproductos.shop`] : []),
    'catálogo',
    'productos',
    'comprar online',
  ];

  const companyName = company?.name || 'Tienda';
  const description = `Catálogo de productos de ${companyName}. Compra online en ${domain}.`;

  return {
    title: `Catálogo - ${companyName} | Misproductos`,
    description,
    keywords,
    openGraph: {
      title: `Catálogo - ${companyName}`,
      description,
      url: `${baseUrl}/catalog`,
      type: 'website',
    },
  };
}

export default async function CatalogPage({ searchParams } :{searchParams: Promise<{page?: string, search?: string, [key: string]: string | undefined}>} & {params: Promise<{page?: string, search?: string}>}) {

  const params = await searchParams;
  const {page, search, tag, category, ...restParams} = params;
  const pageNumber = page ? +page : 1;
  const searchQuery = search ? search : '';
  const tagFilter = tag ? tag : undefined;
  const categoryFilter = category ? category : undefined;
  
  // Extraer filtros de atributos (parámetros que empiezan con filter_)
  const attributeFilters: Record<string, string> = {};
  Object.entries(restParams).forEach(([key, value]) => {
    if (key.startsWith('filter_') && value) {
      const attributeId = key.replace('filter_', '');
      attributeFilters[attributeId] = value;
    }
  });
  
  const { products, totalPages } = await getPaginatedProductsWithImages({
    page: 1, // Siempre empezar desde la página 1 para el scroll infinito
    search: searchQuery,
    tag: tagFilter,
    categoryId: categoryFilter,
    attributeFilters: Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined,
  });

  // Obtener configuración de columnas, imagen y precios
  const companyId = await getCurrentCompanyId();
  let columns = 4; // Valor por defecto: 4 columnas
  let imageSize: 'small' | 'medium' | 'large' = 'medium'; // Valor por defecto: medium
  let gridCentered = false; // Valor por defecto: extended (ancho total)
  let priceConfig: PriceConfig = { currency: 'USD', format: 'symbol-before', showPrices: true, decimals: 2 }; // Valores por defecto
  if (companyId) {
    const { configs } = await getCompanyConfigPublic(companyId);
    if (configs && typeof configs === 'object' && !Array.isArray(configs)) {
      const configsMap = configs as Record<string, any>;
      const catalogColumns = configsMap['catalog.columns'];
      if (typeof catalogColumns === 'number' && catalogColumns >= 1 && catalogColumns <= 6) {
        columns = catalogColumns;
      }
      const catalogImageSize = configsMap['catalog.imageSize'];
      if (typeof catalogImageSize === 'string' && ['small', 'medium', 'large'].includes(catalogImageSize)) {
        imageSize = catalogImageSize as 'small' | 'medium' | 'large';
      }
      const catalogCentered = configsMap['catalog.centered'];
      if (catalogCentered === 'centered') {
        gridCentered = true;
      }
      // Configuración de precios
      priceConfig = {
        currency: configsMap['prices.currency'] || 'USD',
        format: configsMap['prices.format'] || 'symbol-before',
        showPrices: configsMap['prices.showPrices'] !== undefined ? configsMap['prices.showPrices'] : true,
        decimals: configsMap['prices.decimals'] !== undefined ? Number(configsMap['prices.decimals']) : 2,
      };
    }
  }

  // Generar structured data para SEO
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = host ? `${protocol}://${host}` : 'https://misproductos.shop';

  let structuredData = null;
  if (companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        logo: true,
        address: true,
        email: true,
        phone: true,
      },
    });

    if (company) {
      const domain = await getCurrentDomain();
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: company.name,
        url: baseUrl,
        image: company.logo 
          ? (company.logo.startsWith('http') ? company.logo : `${baseUrl}${company.logo.startsWith('/') ? company.logo : `/logos/${company.logo}`}`)
          : `${baseUrl}/oc_image.png`,
        description: `Tienda online de ${company.name} - Catálogo de productos en ${domain}`,
        ...(company.address && { address: {
          '@type': 'PostalAddress',
          addressLocality: company.address,
        }}),
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
    }
  }

  return (
    <>
      {structuredData && <StructuredData data={structuredData} />}
      <CatalogHeaderWrapper 
        tag={tagFilter} 
        search={searchQuery}
        categoryId={categoryFilter}
        initialProducts={products as unknown as Product[]}
        initialPage={1}
        initialTotalPages={totalPages}
        attributeFilters={Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined}
        catalogColumns={columns}
        catalogImageSize={imageSize}
        catalogCentered={gridCentered}
      />
    </>
  );
}
