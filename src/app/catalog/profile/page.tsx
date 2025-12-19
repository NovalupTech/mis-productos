import { Title } from '@/components';
import { ProfileForm } from './ui/ProfileForm';
import { getCountries } from '@/actions/country/getCountries';
import { getUserProfile } from '@/actions/user/get-user-profile';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const countries = await getCountries();
  const { ok, user } = await getUserProfile();

  if (!ok || !user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col sm:justify-center sm:items-center mb-72 px-10 sm:px-0">
      <div className="w-full xl:w-[1000px] flex flex-col justify-center text-left">
        <Title title="Mi perfil" subtitle="Gestiona tu información personal y dirección" />

        <ProfileForm countries={countries!} user={user} />
      </div>
    </div>
  );
}
