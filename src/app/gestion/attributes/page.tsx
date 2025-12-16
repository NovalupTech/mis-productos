import { getAllAttributes } from '@/actions';
import { Title } from '@/components';
import { AttributesTable } from './ui/AttributesTable';
import { CreateAttributeButton } from './ui/CreateAttributeButton';

export default async function AttributesPage() {
  const { ok, attributes = [] } = await getAllAttributes();

  if (!ok) {
    return (
      <div>
        <Title title="Atributos" />
        <p className="text-red-500">No se pudieron cargar los atributos</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
        <Title title="Gestión de Atributos" />
        <CreateAttributeButton />
      </div>
      <div className="mb-10">
        <AttributesTable attributes={attributes} />
      </div>
    </>
  );
}

