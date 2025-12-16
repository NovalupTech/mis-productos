export const revalidate = 0;

// https://tailwindcomponents.com/component/hoverable-table
import {  getPaginatedOrders } from "@/actions";
import { Pagination, Title } from "@/components";

import Link from "next/link";
import { redirect } from "next/navigation";
import { IoCardOutline } from "react-icons/io5";

export default async function OrdersPage() {

  const { ok, orders = [] } = await getPaginatedOrders();

  if (!ok) {
    redirect("/gestion");
  }

  return (
    <>
      <Title title="Todas las orders" />

      <div className="mb-10">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-200 border-b">
              <tr>
                <th
                  scope="col"
                  className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                >
                  #ID
                </th>
                <th
                  scope="col"
                  className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                >
                  Nombre completo
                </th>
                <th
                  scope="col"
                  className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                >
                  Opciones
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id.split("-").at(-1)}
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    {order.OrderAddress?.firstName} {order.OrderAddress?.lastName}
                  </td>
                  <td className="flex items-center text-sm  text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    {order.isPaid ? (
                      <>
                        <IoCardOutline className="text-green-800" />
                        <span className="mx-2 text-green-800">Pagada</span>
                      </>
                    ) : (
                      <>
                        <IoCardOutline className="text-red-800" />
                        <span className="mx-2 text-red-800">No Pagada</span>
                      </>
                    )}
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6 ">
                    <Link href={`/catalog/orders/${ order.id }`} className="hover:underline">
                      Ver orden
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/catalog/orders/${ order.id }`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">ID: {order.id.split("-").at(-1)}</span>
                <div className="flex items-center">
                  {order.isPaid ? (
                    <>
                      <IoCardOutline className="text-green-800" />
                      <span className="ml-2 text-sm text-green-800 font-medium">Pagada</span>
                    </>
                  ) : (
                    <>
                      <IoCardOutline className="text-red-800" />
                      <span className="ml-2 text-sm text-red-800 font-medium">No Pagada</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {order.OrderAddress?.firstName} {order.OrderAddress?.lastName}
              </p>
              <p className="text-xs text-blue-600 mt-2">Toca para ver detalles →</p>
            </Link>
          ))}
        </div>

        <Pagination totalPages={ 1 } />
      </div>
    </>
  );
}