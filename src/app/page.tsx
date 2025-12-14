import { redirect } from 'next/navigation';
import { getCurrentCompanyId } from '@/lib/domain';
import prisma from '@/lib/prisma';
import LandingPage from './landing/page';

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
