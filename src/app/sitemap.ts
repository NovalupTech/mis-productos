import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://misproductos.shop';

  // Obtener todas las compañías activas con sus dominios
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const domains = await prisma.domain.findMany({
    where: {
      isPrimary: true,
    },
    select: {
      domain: true,
      companyId: true,
    },
  });

  // Crear mapa de dominios por compañía
  const domainMap = new Map<string, string>();
  domains.forEach((d) => {
    if (d.companyId) {
      domainMap.set(d.companyId, d.domain);
    }
  });

  // URLs base
  const urls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Agregar URLs de cada compañía
  for (const company of companies) {
    const domain = domainMap.get(company.id);
    if (domain) {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const companyUrl = `${protocol}://${domain}`;
      
      urls.push({
        url: companyUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
      
      urls.push({
        url: `${companyUrl}/catalog`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.9,
      });

      // Obtener páginas de la compañía
      const pages = await prisma.page.findMany({
        where: {
          companyId: company.id,
          enabled: true,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      });

      pages.forEach((page) => {
        urls.push({
          url: `${companyUrl}/${page.slug}`,
          lastModified: page.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });

      // Obtener productos de la compañía
      const products = await prisma.product.findMany({
        where: {
          companyId: company.id,
          active: true,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        take: 1000, // Limitar para no sobrecargar el sitemap
      });

      products.forEach((product) => {
        urls.push({
          url: `${companyUrl}/catalog/product/${product.slug}`,
          lastModified: product.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });
    }
  }

  return urls;
}
