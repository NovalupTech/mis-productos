import { middleware } from "@/auth.config";
import { getCurrentCompanyId } from "@/lib/domain";
import { redirect } from "next/navigation";

export default async function AdminLayout({
 children
}: {
 children: React.ReactNode;
}) {

  const companyId = await getCurrentCompanyId();

  if(!companyId){
    redirect('/');
  }

  return (
    <main className="flex justify-center">
      <div className="w-full sm:w-[350px] px-10">
        {children}
      </div>
    </main>
  );
}
