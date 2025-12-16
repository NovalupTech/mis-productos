import { middleware } from "@/auth.config";
import { redirect } from "next/navigation";

export default async function ShopLayout({
 children
}: {
 children: React.ReactNode;
}) {

  const session = await middleware();

  if(session?.user){
    redirect('/')
  }

  return (
    <main className="flex justify-center">
      <div className="w-full px-10">
        {children}
      </div>
    </main>
  );
}