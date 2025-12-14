import { Title } from '@/components';
import { AddressForm } from './AddressForm';
import { getCountries } from '@/actions/country/getCountries';
import { getUserAddress } from '@/actions/address/get-user-address';
import { middleware } from '@/auth.config';

export default async function AddressPage() {

  const countries = await getCountries();
  const session = await middleware();

  if(!session?.user.id) return;

  const userAddress = await getUserAddress(session?.user.id);

  return (
    <div className="flex flex-col sm:justify-center sm:items-center mb-72 px-10 sm:px-0">
      <div className="w-full  xl:w-[1000px] flex flex-col justify-center text-left">
        <Title title="Dirección" subtitle="Dirección de entrega" />

        <AddressForm countries={countries!} userAddress={userAddress} />

      </div>




    </div>
  );
}