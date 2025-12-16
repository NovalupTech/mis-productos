import { getAllTags } from '@/actions';
import { Title } from '@/components';
import { TagsTable } from './ui/TagsTable';
import { CreateTagButton } from './ui/CreateTagButton';

export default async function TagsPage() {
  const { ok, tags = [] } = await getAllTags();

  if (!ok) {
    return (
      <div>
        <Title title="Tags" />
        <p className="text-red-500">No se pudieron cargar los tags</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
        <Title title="Gestión de Tags" />
        <CreateTagButton />
      </div>
      <div className="mb-10">
        <TagsTable tags={tags} />
      </div>
    </>
  );
}
