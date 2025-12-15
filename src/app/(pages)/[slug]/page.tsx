import { notFound, redirect } from 'next/navigation';
import { getCurrentCompanyId } from '@/lib/domain';
import prisma from '@/lib/prisma';
import {
  HeroSection,
  BannerSection,
  TextSection,
  ImageSection,
  FeaturesSection,
  GallerySection,
  CTASection,
} from '@/components/page-sections';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const companyId = await getCurrentCompanyId();

  // Rutas reservadas que no deben ser manejadas por esta página dinámica
  const reservedRoutes = ['catalog', 'cart', 'checkout', 'orders', 'profile', 'product', 'products', 'auth', 'gestion', 'api', 'landing'];
  
  // Si el slug es una ruta reservada, mostrar 404
  if (reservedRoutes.includes(slug)) {
    notFound();
  }

  // Si no hay companyId, no hay páginas personalizadas
  if (!companyId) {
    notFound();
  }

  // Buscar la página por slug
  const page = await prisma.page.findFirst({
    where: {
      companyId,
      slug,
      enabled: true,
    },
    include: {
      sections: {
        where: {
          enabled: true,
        },
        orderBy: {
          position: 'asc',
        },
      },
    },
  });

  // Si no se encuentra la página, redirigir al root
  if (!page) {
    redirect('/');
  }

  // Renderizar las secciones según su tipo
  return (
    <div className="min-h-screen">
      {page.sections.length === 0 ? (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">{page.title}</h1>
            <p className="text-gray-600">Esta página aún no tiene contenido configurado.</p>
          </div>
        </div>
      ) : (
        <>
          {page.sections.map((section) => {
            const content = section.content as Record<string, unknown>;

            switch (section.type) {
              case 'HERO':
                return <HeroSection key={section.id} content={content} />;
              case 'BANNER':
                return <BannerSection key={section.id} content={content} />;
              case 'TEXT':
                return <TextSection key={section.id} content={content} />;
              case 'IMAGE':
                return <ImageSection key={section.id} content={content} />;
              case 'FEATURES':
                return <FeaturesSection key={section.id} content={content} />;
              case 'GALLERY':
                return <GallerySection key={section.id} content={content} />;
              case 'CTA':
                return <CTASection key={section.id} content={content} />;
              default:
                return null;
            }
          })}
        </>
      )}
    </div>
  );
}
