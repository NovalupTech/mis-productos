import { getCompany, getCompanySocials } from '@/actions';
import { Title } from '@/components';
import { CompanyForm } from './ui/CompanyForm';
import { SocialsManager } from './ui/SocialsManager';

export default async function CompanyPage() {
  const [companyResult, socialsResult] = await Promise.all([
    getCompany(),
    getCompanySocials(),
  ]);

  if (!companyResult.ok || !companyResult.company) {
    return (
      <div className="p-8">
        <Title title="Mi Empresa" />
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{companyResult.message}</p>
        </div>
      </div>
    );
  }

  const socials = socialsResult.ok ? socialsResult.socials : [];

  return (
    <div className="p-8">
      <Title title="Mi Empresa" />
      
      <div className="mt-8 space-y-8">
        {/* Formulario de datos de la compañía */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información de la Empresa
          </h2>
          <CompanyForm company={companyResult.company} />
        </div>

        {/* Gestión de redes sociales */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Redes Sociales
          </h2>
          <SocialsManager initialSocials={socials || []} />
        </div>
      </div>
    </div>
  );
}
