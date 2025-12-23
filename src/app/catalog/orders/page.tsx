// https://tailwindcomponents.com/component/hoverable-table
import { getOrders } from '@/actions/orders/get-orders';
import { Title } from '@/components';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { IoCardOutline } from 'react-icons/io5';

export default async function OrdersPage() {

  const { ok, orders = [] } = await getOrders();

  if(!ok){
    redirect('/')
  }

  return (
    <div>
      <Title title="Mis compras" />

      {/* Vista de tabla para desktop */}
      <div className="mb-10 hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-200 border-b">
            <tr>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                #ID
              </th>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                Nombre completo
              </th>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                Estado
              </th>
              <th scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                Opciones
              </th>
            </tr>
          </thead>
          <tbody>
            {
              orders.map((order, index) => (
                <tr key={index} className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id.split("-").at(-1)}</td>
                  <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    {
                      order.OrderAddress ? order.OrderAddress?.firstName + ' ' + order.OrderAddress?.lastName : order.user?.name
                    }
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                    {
                      order.isPaid ? (
                        <div className='flex flex-row items-center'><IoCardOutline className="text-green-800" />
                        <span className='mx-2 text-green-800'>Pagada</span></div> 
                      ) :
                      (
                        <div  className='flex flex-row items-center'><IoCardOutline className="text-red-800" />
                        <span className='mx-2 text-red-800'>No Pagada</span></div>
                      )
                    }
                  </td>
                  <td className="text-sm text-gray-900 font-light px-6 ">
                    <Link href={`/catalog/orders/${order.id}`} className="hover:underline">
                      {
                        order.isPaid ? 'Detalles' : 'Pagar'
                      }
                    </Link>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para mobile */}
      <div className="mb-10 md:hidden space-y-4">
        {
          orders.map((order, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Orden #</p>
                  <p className="text-sm font-semibold text-gray-900">#{order.id.split("-").at(-1)}</p>
                </div>
                <div className="flex items-center">
                  {
                    order.isPaid ? (
                      <div className='flex flex-row items-center'>
                        <IoCardOutline className="text-green-800" size={18} />
                        <span className='ml-1 text-xs text-green-800 font-medium'>Pagada</span>
                      </div> 
                    ) :
                    (
                      <div className='flex flex-row items-center'>
                        <IoCardOutline className="text-red-800" size={18} />
                        <span className='ml-1 text-xs text-red-800 font-medium'>No Pagada</span>
                      </div>
                    )
                  }
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Cliente</p>
                <p className="text-sm text-gray-900">
                  {
                    order.OrderAddress ? order.OrderAddress?.firstName + ' ' + order.OrderAddress?.lastName : order.user?.name
                  }
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <Link 
                  href={`/catalog/orders/${order.id}`} 
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {
                    order.isPaid ? 'Ver Detalles' : 'Pagar Ahora'
                  }
                </Link>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}