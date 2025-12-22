import { middleware } from "@/auth.config";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/actions/dashboard/get-dashboard-stats";
import { DashboardTasks } from "./ui/DashboardTasks";
import { DashboardStats } from "./ui/DashboardStats";

export default async function AdminDashboardPage() {
  const session = await middleware();

  if (!session?.user) {
    redirect('/gestion');
  }

  // Verificar que el usuario tenga rol de admin
  if (session.user.role !== 'admin' && session.user.role !== 'companyAdmin') {
    redirect('/');
  }

  // Obtener estadísticas
  const { ok, stats } = await getDashboardStats();

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Columna principal: Tareas */}
        <div className="lg:col-span-2">
          <DashboardTasks />
        </div>

        {/* Columna lateral: Estadísticas */}
        <div className="lg:col-span-1">
          {ok && stats ? (
            <DashboardStats
              totalProducts={stats.totalProducts}
              totalUsers={stats.totalUsers}
              totalOrders={stats.totalOrders}
              recentOrders={stats.recentOrders}
              recentPayments={stats.recentPayments}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">No se pudieron cargar las estadísticas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
