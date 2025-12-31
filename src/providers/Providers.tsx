'use client'

import { SessionProvider } from "next-auth/react";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog/ConfirmDialogProvider";

interface Props {
    children: React.ReactNode;
}

export const Providers = ({ children }: Props) => {
  return (
    <SessionProvider
      // Reducir llamadas a /api/auth/session
      refetchInterval={5 * 60} // Refrescar cada 5 minutos (300 segundos) en lugar del default
      refetchOnWindowFocus={false} // No refrescar automáticamente al cambiar de ventana
    >
      {children}
      <ConfirmDialogProvider />
    </SessionProvider>
  )
}
