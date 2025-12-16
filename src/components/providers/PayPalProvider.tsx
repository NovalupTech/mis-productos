'use client'

import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { usePriceConfig } from "./PriceConfigProvider"
import { SessionProvider } from "next-auth/react"

interface PayPalProviderProps {
  children: React.ReactNode
}

export const PayPalProvider = ({ children }: PayPalProviderProps) => {
  const priceConfig = usePriceConfig()
  
  return (
    <PayPalScriptProvider 
      options={{ 
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '',
        currency: 'USD',
        intent: 'capture',
        buyerCountry: 'AR',
        locale: 'es_AR'
      }}
    >
      <SessionProvider>
        {children}
      </SessionProvider>
    </PayPalScriptProvider>
  )
}
