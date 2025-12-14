import { middleware } from "@/auth.config";
import { Title } from "@/components";
import { redirect } from "next/navigation";

export default async function ProfilePage() {

  const session = await middleware();

  if(!session?.user){
    redirect('/');
  }

  return (
    <div>
      <Title
        title="Perfil"
        subtitle="Configura tu perfil"
       />

        <pre>
            {
                JSON.stringify(session.user, null, 2)
            }
        </pre>
        <h3>
          {
            session?.user.role
          }
        </h3>
    </div>
  );
}