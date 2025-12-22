'use client'

import { SessionProvider } from "next-auth/react";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog/ConfirmDialogProvider";

interface Props {
    children: React.ReactNode;
}

export const Providers = ({ children }: Props) => {
  return (
    <SessionProvider>
      {children}
      <ConfirmDialogProvider />
    </SessionProvider>
  )
}
