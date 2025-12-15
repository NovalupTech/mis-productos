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
  const syncCartFromStorage = useCartStore((state) => state.syncCartFromStorage)
  const previousCompanyIdRef = useRef<string | null>(null)
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    const previousCompanyId = previousCompanyIdRef.current
    const currentCompanyId = company?.id || null

    // Si cambió el companyId y había uno anterior, limpiar el carrito
    if (previousCompanyId && currentCompanyId && previousCompanyId !== currentCompanyId) {
      clearCart()
      hasSyncedRef.current = false
    }

    // Actualizar la referencia
    previousCompanyIdRef.current = currentCompanyId

    // Establecer la compañía en el store
    setCompany(company)

    // Sincronizar el carrito desde localStorage cuando el companyId esté disponible
    // Solo hacerlo una vez por companyId para evitar sobrescribir cambios del usuario
    if (currentCompanyId && !hasSyncedRef.current) {
      syncCartFromStorage(currentCompanyId)
      hasSyncedRef.current = true
    }
  }, [company, setCompany, clearCart, syncCartFromStorage])

  return null
}
