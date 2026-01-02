import { getAllTags, getAllCategories } from '@/actions';
import { Title } from '@/components';
import { TagsTable } from './ui/TagsTable';
import { CreateTagButton } from './ui/CreateTagButton';
import { CategoriesTable } from './ui/CategoriesTable';
import { CreateCategoryButton } from './ui/CreateCategoryButton';

export default async function TagsPage() {
  const { ok: tagsOk, tags = [] } = await getAllTags();
  const { ok: categoriesOk, categories = [] } = await getAllCategories();

  if (!tagsOk && !categoriesOk) {
    return (
      <div>
        <Title title="Tags y Categorías" />
        <p className="text-red-500">No se pudieron cargar los datos</p>
      </div>
    );
  }

  return (
    <>

      {/* Categories Section */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
          <Title title="Gestión de Categorías" />
          <CreateCategoryButton />
        </div>
        {categoriesOk ? (
          <CategoriesTable categories={categories} />
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-500">No se pudieron cargar las categorías</p>
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
          <Title title="Gestión de Tags" />
          <CreateTagButton />
        </div>
        {tagsOk ? (
          <TagsTable tags={tags} />
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-500">No se pudieron cargar los tags</p>
          </div>
        )}
      </div>
    </>
  );
}
