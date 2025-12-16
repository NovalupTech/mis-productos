import { Title } from '@/components';
import { DiscountsTable } from './ui/DiscountsTable';
import { CreateDiscountButton } from './ui/CreateDiscountButton';
import { getAllDiscounts } from '@/actions';

export default async function DiscountsPage() {
  const { ok, discounts = [] } = await getAllDiscounts();

  if (!ok) {
    return (
      <div>
        <Title title="Descuentos" />
        <p className="text-red-500">No se pudieron cargar los descuentos</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
        <Title title="Gestión de Descuentos" />
        <CreateDiscountButton />
      </div>
      <div className="mb-10">
        <DiscountsTable discounts={discounts} />
      </div>
    </>
  );
}
