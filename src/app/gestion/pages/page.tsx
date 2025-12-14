import { getPages } from '@/actions/page/get-pages';
import { Title } from '@/components';
import { PagesTable } from './ui/PagesTable';
import { CreatePageButton } from './ui/CreatePageButton';
import { Page, PageSection } from '@prisma/client';

export default async function PagesPage() {
  const { ok, pages = [] } = await getPages();

  if (!ok) {
    return (
      <div>
        <Title title="Páginas" />
        <p className="text-red-500">No se pudieron cargar las páginas</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Title title="Gestión de Páginas" />
        <CreatePageButton />
      </div>
      <div className="mb-10">
        <PagesTable pages={pages as unknown as (Page & { sections: (PageSection & { content: Record<string, unknown> })[] })[]} />
      </div>
    </>
  )
}
