'use client'

import { useEffect } from 'react'
import { useCompanyStore, type Company } from '@/store/company/company-store'

interface CompanyProviderProps {
  company: Company | null
}

export const CompanyProvider = ({ company }: CompanyProviderProps) => {
  const setCompany = useCompanyStore((state) => state.setCompany)

  useEffect(() => {
    setCompany(company)
  }, [company, setCompany])

  return null
}
