export const revalidate = 0;

// https://tailwindcomponents.com/component/hoverable-table
import { getCompanyConfigPublic, getPaginatedOrders } from "@/actions";
import { Pagination, Title } from "@/components";
import { getCurrentCompanyId } from "@/lib/domain";
import { getPriceConfig, PriceConfig } from "@/utils";
import { redirect } from "next/navigation";
import { OrdersTable } from "./ui/OrdersTable";

export default async function OrdersPage() {

  const { ok, orders = [] } = await getPaginatedOrders();
  const companyId = await getCurrentCompanyId();

  let priceConfig: PriceConfig = { currency: 'USD', format: 'symbol-before', showPrices: true };
  if (companyId) {
    const { configs } = await getCompanyConfigPublic(companyId);
    if (configs && typeof configs === 'object' && !Array.isArray(configs)) {
      priceConfig = getPriceConfig(configs as Record<string, any>);
    }
  }

  if (!ok) {
    redirect("/gestion");
  }

  return (
    <>
      <Title title="Órdenes de clientes" />

      <OrdersTable orders={orders} priceConfig={priceConfig} />

      <Pagination totalPages={1} />
    </>
  );
}