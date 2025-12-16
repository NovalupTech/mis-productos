"use client";

import { AdminSidebar } from "../ui/AdminSidebar";
import { useSidebar } from "../providers/SidebarProvider";
import { useEffect, useState } from "react";
import { IoMenuOutline } from "react-icons/io5";

export function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{
          marginLeft: isMobile ? "0px" : (isCollapsed ? "80px" : "256px"),
        }}
      >
        {/* Botón para abrir sidebar en mobile */}
        {isMobile && isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="fixed top-1 left-4 z-40 p-1 bg-white border border-gray-200 rounded-md shadow-md hover:bg-gray-50 md:hidden"
            aria-label="Abrir menú"
          >
            <IoMenuOutline size={24} className="text-gray-600" />
          </button>
        )}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
