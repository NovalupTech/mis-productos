'use client'

import { useEffect, useRef } from 'react'
import { useCompanyStore, type Company } from '@/store/company/company-store'
import { useCartStore } from '@/store/cart/cart-store'

interface CompanyProviderProps {
  company: Company | null
}

export const CompanyProvider = ({ company }: CompanyProviderProps) => {
  const setCompany = useCompanyStore((state) => state.setCompany)
  const clearCart = useCartStore((state) => state.clearCart)
  const previousCompanyIdRef = useRef<string | null>(null)

  useEffect(() => {
    const previousCompanyId = previousCompanyIdRef.current
    const currentCompanyId = company?.id || null

    // Si cambió el companyId y había uno anterior, limpiar el carrito
    if (previousCompanyId && currentCompanyId && previousCompanyId !== currentCompanyId) {
      clearCart()
    }

    // Actualizar la referencia
    previousCompanyIdRef.current = currentCompanyId

    // Establecer la compañía en el store
    setCompany(company)
  }, [company, setCompany, clearCart])

  return null
}
