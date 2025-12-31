import { getOrders } from '@/actions/orders/get-orders';
import { Title } from '@/components';
import { formatPrice, getPriceConfig } from '@/utils/priceFormat';
import { getCompanyConfigPublic } from '@/actions/company-config/get-company-config-public';
import { getCurrentCompanyId } from '@/lib/domain';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { IoCardOutline, IoCheckmarkCircle, IoTimeOutline } from 'react-icons/io5';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long'
  }).format(new Date(date));
}

function groupOrdersByDate(orders: any[]) {
  const grouped: Record<string, any[]> = {};
  
  orders.forEach(order => {
    const dateKey = formatDateShort(new Date(order.createdAt));
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(order);
  });
  
  return grouped;
}

export default async function OrdersPage() {
  const { ok, orders = [] } = await getOrders();

  if(!ok){
    redirect('/')
  }

  // Obtener configuración de precios
  const companyId = await getCurrentCompanyId();
  let priceConfig = { currency: 'USD', format: 'symbol-before', showPrices: true };
  if (companyId) {
    const { configs } = await getCompanyConfigPublic(companyId);
    if (configs && typeof configs === 'object' && !Array.isArray(configs)) {
      const config = getPriceConfig(configs as Record<string, any>);
      priceConfig = {
        currency: config.currency || 'USD',
        format: config.format || 'symbol-before',
        showPrices: config.showPrices !== false
      };
    }
  }

  const groupedOrders = groupOrdersByDate(orders);

  if (orders.length === 0) {
    return (
      <div>
        <Title title="Mis compras" />
        <div className="text-center py-12">
          <IoCardOutline className="mx-auto text-gray-400" size={64} />
          <p className="mt-4 text-gray-600">No tienes compras aún</p>
          <Link href="/catalog" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Explorar productos →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <Title title="Mis compras" />

        {/* Vista mejorada para todas las pantallas */}
        <div className="mb-10 space-y-6">
          {Object.entries(groupedOrders).map(([date, dateOrders]) => (
            <div key={date}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 px-2">{date}</h2>
              <div className="space-y-4">
                {dateOrders.map((order) => {
                const orderItems = order.OrderItem || [];
                const totalItems = order.itemsInOrder || 0;
                const hasMoreItems = totalItems > orderItems.length;
                
                return (
                  <div 
                    key={order.id} 
                    className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    style={{
                      backgroundColor: 'var(--theme-primary-color)',
                    }}
                  >
                    {/* Header de la orden */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">Orden #{order.id.split("-").at(-1)}</span>
                            {order.company?.name && (
                              <span className="text-xs text-gray-400">•</span>
                            )}
                            {order.company?.name && (
                              <span className="text-xs text-gray-600">{order.company.name}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate(new Date(order.createdAt))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.isPaid ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
                              <IoCheckmarkCircle className="text-green-600" size={16} />
                              <span className="text-xs font-medium text-green-700">Pagada</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-full">
                              <IoTimeOutline className="text-orange-600" size={16} />
                              <span className="text-xs font-medium text-orange-700">Pendiente</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Productos */}
                    {orderItems.length > 0 && (
                      <div className="p-4">
                        <div className="flex gap-3 mb-3">
                          {orderItems.map((item: any, idx: number) => {
                            const imageUrl = item.product?.productImage?.[0]?.url;
                            return (
                              <div key={idx} className="relative flex-shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                  {imageUrl ? (
                                    <Image
                                      src={imageUrl.startsWith('http') || imageUrl.startsWith('https') ? imageUrl : `/products/${imageUrl}`}
                                      alt={item.product?.title || 'Producto'}
                                      width={80}
                                      height={80}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <IoCardOutline className="text-gray-400" size={24} />
                                    </div>
                                  )}
                                </div>
                                {item.quantity > 1 && (
                                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                                    {item.quantity}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {hasMoreItems && (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-600 font-medium">
                                +{totalItems - orderItems.length}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                        </p>
                      </div>
                    )}

                    {/* Footer con total y acción */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total</p>
                        <p className="text-base font-semibold text-gray-900">
                          {formatPrice(order.total, priceConfig)}
                        </p>
                      </div>
                      <Link
                        href={`/catalog/orders/${order.id}`}
                        className="px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: 'var(--theme-secondary-color)',
                          color: 'var(--theme-secondary-text-color)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color)';
                        }}
                      >
                        {order.isPaid ? 'Ver compra' : 'Pagar ahora'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}