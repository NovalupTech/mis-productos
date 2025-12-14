import { middleware } from "@/auth.config";
import { getCurrentCompanyId } from "@/lib/domain";
import { redirect } from "next/navigation";
import { SidebarProvider } from "./providers/SidebarProvider";
import { AdminLayoutContent } from "./components/AdminLayoutContent";

export default async function AdminLayout({
 children
}: {
 children: React.ReactNode;
}) {
  const session = await middleware();
  const companyId = await getCurrentCompanyId();

  // Si no hay sesión, mostrar el login sin sidebar
  if (!session?.user) {
    return (
      <main className="flex justify-center items-center h-screen">
        {children}
      </main>
    );
  }

  // Si hay companyId, el usuario debe ser companyAdmin
  // Si no hay companyId, el usuario debe ser admin superior
  if (companyId) {
    if (session.user.role !== 'companyAdmin') {
      redirect('/');
    }
  } else {
    if (session.user.role !== 'admin') {
      redirect('/');
    }
  }

  // Si llegamos aquí, el usuario está autenticado y tiene el rol correcto
  return (
    <SidebarProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}
