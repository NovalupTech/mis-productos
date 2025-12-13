import { titleFont } from '@/config/fonts';
import { middleware } from "@/auth.config";
import { redirect } from "next/navigation";
import { AdminLoginForm } from './ui/AdminLoginForm';

export default async function AdminLoginPage() {
  const session = await middleware();

  // Si el usuario ya está autenticado, redirigir al dashboard
  if(session?.user){
    redirect('/admin/dashboard')
  }

  return (
    <div className="flex flex-col min-h-screen pt-32 sm:pt-52">
      <h1 className={ `${ titleFont.className } text-4xl mb-5` }>Ingresar al Admin</h1>
      <AdminLoginForm/>
    </div>
  );
}
