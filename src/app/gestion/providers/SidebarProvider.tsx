"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Inicializar como true (cerrado) para mobile, se ajustará en el primer render
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar el estado basándose en el tamaño de la ventana
  useEffect(() => {
    if (isInitialized) return;
    
    const isMobile = window.innerWidth < 768;
    // En mobile, queremos que esté cerrado (true), en desktop abierto (false)
    setIsCollapsed(isMobile);
    setIsInitialized(true);
  }, [isInitialized]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
