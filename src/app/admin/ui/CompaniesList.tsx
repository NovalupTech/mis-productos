"use client"

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { setSelectedCompany } from "../actions/set-selected-company";
import { IoBusinessOutline, IoMailOutline, IoCubeOutline, IoCardOutline, IoPeopleOutline, IoSearchOutline, IoAddOutline } from "react-icons/io5";
import { CreateCompanyModal } from "./CreateCompanyModal";

interface Company {
  id: string;
  name: string;
  email: string | null;
  logo: string | null;
  createdAt: Date;
  _count: {
    products: number;
    orders: number;
    users: number;
  };
}

interface CompaniesListProps {
  companies: Company[];
}

export const CompaniesList = ({ companies }: CompaniesListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCompany = async (companyId: string) => {
    startTransition(async () => {
      const result = await setSelectedCompany(companyId);
      if (result.ok) {
        router.push('/gestion/dashboard');
      }
    });
  };

  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <IoBusinessOutline className="mx-auto text-gray-400" size={64} />
        <p className="mt-4 text-gray-600">No hay empresas registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y botón agregar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar empresa por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
          >
            <IoAddOutline size={20} />
            <span>Nueva Compañía</span>
          </button>
        </div>
      </div>

      {/* Lista de empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No se encontraron empresas que coincidan con la búsqueda</p>
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow hover:border-blue-300 cursor-pointer"
              onClick={() => handleSelectCompany(company.id)}
            >
              <div className="flex items-start gap-4 mb-4">
                {company.logo ? (
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <Image
                      src={company.logo.startsWith('http') || company.logo.startsWith('https') 
                        ? company.logo 
                        : `/logos/${company.logo}`}
                      alt={company.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <IoBusinessOutline className="text-gray-400" size={32} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                    {company.name}
                  </h3>
                  {company.email && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <IoMailOutline size={14} />
                      <span className="truncate">{company.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                    <IoCubeOutline size={16} />
                  </div>
                  <p className="text-xs text-gray-500">Productos</p>
                  <p className="text-sm font-semibold text-gray-900">{company._count.products}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                    <IoCardOutline size={16} />
                  </div>
                  <p className="text-xs text-gray-500">Órdenes</p>
                  <p className="text-sm font-semibold text-gray-900">{company._count.orders}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                    <IoPeopleOutline size={16} />
                  </div>
                  <p className="text-xs text-gray-500">Usuarios</p>
                  <p className="text-sm font-semibold text-gray-900">{company._count.users}</p>
                </div>
              </div>

              {/* Botón de acción */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className={`w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-center text-sm font-medium hover:bg-blue-700 transition-colors ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isPending ? 'Cargando...' : 'Gestionar empresa'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para crear nueva compañía */}
      <CreateCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // El modal ya maneja el router.refresh()
        }}
      />
    </div>
  );
};

