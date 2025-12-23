import { middleware } from "@/auth.config";
import { getCurrentCompanyId } from "@/lib/domain";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SidebarProvider } from "./providers/SidebarProvider";
import { AdminLayoutContent } from "./components/AdminLayoutContent";

export default async function AdminLayout({
 children
}: {
 children: React.ReactNode;
}) {
  const session = await middleware();
  const domainCompanyId = await getCurrentCompanyId();
  const cookieStore = await cookies();
  
  // Si el usuario es admin y hay un companyId en cookies, usarlo
  let selectedCompanyId: string | null = null;
  if (session?.user?.role === 'admin') {
    selectedCompanyId = cookieStore.get('admin-selected-company-id')?.value || null;
  }

  // Si no hay sesión, mostrar el login sin sidebar
  if (!session?.user) {
    return (
      <main className="flex justify-center items-center h-screen">
        {children}
      </main>
    );
  }

  // Si hay companyId (del dominio o seleccionado), el usuario debe ser companyAdmin o admin
  // Si no hay companyId, el usuario debe ser admin superior
  const finalCompanyId = selectedCompanyId || domainCompanyId;
  
  if (finalCompanyId) {
    // Si hay companyId, permitir tanto companyAdmin como admin
    if (session.user.role !== 'companyAdmin' && session.user.role !== 'admin') {
      redirect('/');
    }
  } else {
    // Si no hay companyId, solo permitir admin superior
    if (session.user.role !== 'admin') {
      redirect('/');
    }
  }

  // Si llegamos aquí, el usuario está autenticado y tiene el rol correcto
  return (
    <SidebarProvider>
      <AdminLayoutContent selectedCompanyId={selectedCompanyId || null}>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}
