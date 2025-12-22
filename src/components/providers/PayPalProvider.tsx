'use client'

import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { usePriceConfig } from "./PriceConfigProvider"
import { SessionProvider } from "next-auth/react"

interface PayPalProviderProps {
  children: React.ReactNode
  clientId?: string | null
}

export const PayPalProvider = ({ children, clientId }: PayPalProviderProps) => {
  const priceConfig = usePriceConfig()
  
  // Si no hay clientId, no renderizar PayPalProvider (los botones no funcionarán)
  if (!clientId) {
    return (
      <SessionProvider>
        {children}
      </SessionProvider>
    )
  }
  
  return (
    <PayPalScriptProvider 
      options={{ 
        clientId: clientId,
        currency: 'USD',
        intent: 'capture',
        locale: 'es_AR'
      }}
    >
      <SessionProvider>
        {children}
      </SessionProvider>
    </PayPalScriptProvider>
  )
}
