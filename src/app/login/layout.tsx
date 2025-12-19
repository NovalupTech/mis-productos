import { middleware } from "@/auth.config";
import { redirect } from "next/navigation";
import { getCurrentCompanyId } from "@/lib/domain";
import prisma from "@/lib/prisma";

export default async function ShopLayout({
 children
}: {
 children: React.ReactNode;
}) {

  const session = await middleware();

  if(session?.user){
    redirect('/')
  }

  // Obtener información de la compañía por dominio
  const companyId = await getCurrentCompanyId();
  let company = null;
  
  if (companyId) {
    company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });
  }

  return (
    <main className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}