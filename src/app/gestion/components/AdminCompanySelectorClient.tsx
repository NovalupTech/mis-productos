"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IoArrowBackOutline, IoBusinessOutline } from "react-icons/io5";

interface Company {
  id: string;
  name: string;
  logo: string | null;
}

interface AdminCompanySelectorClientProps {
  companyId: string;
}

export function AdminCompanySelectorClient({ companyId }: AdminCompanySelectorClientProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const response = await fetch(`/api/admin/company/${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setCompany(data);
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, [companyId]);

  if (loading || !company) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {company.logo ? (
            <div className="relative w-8 h-8 flex-shrink-0 rounded overflow-hidden bg-white border border-gray-200">
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
            <IoBusinessOutline className="text-blue-600" size={20} />
          )}
          <div>
            <p className="text-xs text-blue-600 font-medium">Gestionando:</p>
            <p className="text-sm font-semibold text-blue-900">{company.name}</p>
          </div>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <IoArrowBackOutline size={16} />
          <span>Cambiar empresa</span>
        </Link>
      </div>
    </div>
  );
}

