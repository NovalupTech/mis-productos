'use client'

import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { usePriceConfig } from "./PriceConfigProvider"

interface PayPalProviderProps {
  children: React.ReactNode
  clientId?: string | null
}

export const PayPalProvider = ({ children, clientId }: PayPalProviderProps) => {
  const priceConfig = usePriceConfig()
  
  // Si no hay clientId, solo renderizar children (SessionProvider ya está en el layout raíz)
  if (!clientId) {
    return <>{children}</>
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
      {children}
    </PayPalScriptProvider>
  )
}
