import { middleware } from "@/auth.config";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await middleware();

  if (!session?.user) {
    redirect('/gestion');
  }

  // Verificar que el usuario tenga rol de admin
  if (session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="flex flex-col min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Panel de Administración</h1>
      <p className="text-gray-600">Bienvenido, {session.user.email}</p>
    </div>
  );
}
