"use client";

import { AdminSidebar } from "../ui/AdminSidebar";
import { useSidebar } from "../providers/SidebarProvider";

export function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{
          marginLeft: isCollapsed ? "80px" : "256px",
        }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
