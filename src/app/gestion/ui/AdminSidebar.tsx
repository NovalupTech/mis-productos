"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  IoHomeOutline, 
  IoCubeOutline, 
  IoTicketOutline, 
  IoPeopleOutline,
  IoLogOutOutline,
  IoMenuOutline,
  IoArrowBackOutline,
  IoDocumentTextOutline,
  IoBusinessOutline,
  IoColorPaletteOutline,
  IoPricetagOutline
} from "react-icons/io5";
import clsx from "clsx";
import { logout } from "@/actions/auth/logout";
import { useSidebar } from "../providers/SidebarProvider";
import Image from "next/image";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: "/gestion/dashboard",
    label: "Inicio",
    icon: IoHomeOutline,
  },
  {
    href: "/gestion/company",
    label: "Mi Empresa",
    icon: IoBusinessOutline,
  },
  {
    href: "/gestion/appearance",
    label: "Apariencia",
    icon: IoColorPaletteOutline,
  },
  {
    href: "/gestion/pages",
    label: "Páginas",
    icon: IoDocumentTextOutline,
  },
  {
    href: "/gestion/products",
    label: "Productos",
    icon: IoCubeOutline,
  },
  {
    href: "/gestion/prices",
    label: "Precios",
    icon: IoPricetagOutline,
  },
  {
    href: "/gestion/orders",
    label: "Pedidos",
    icon: IoTicketOutline,
  },
  {
    href: "/gestion/users",
    label: "Usuarios",
    icon: IoPeopleOutline,
  },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    try {
      // Primero redirigir a la raíz para evitar que el layout de gestión se ejecute
      // Luego hacer el logout en la nueva página
      window.location.href = '/api/auth/signout?callbackUrl=/';
    } catch (error) {
      console.error('Error al hacer logout:', error);
      // Si hay error, redirigir de todas formas
      window.location.href = '/';
    }
  };

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-30",
        {
          "w-64": !isCollapsed,
          "w-20": isCollapsed,
        }
      )}
    >
      {/* Header con logo y botón de menú */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Image src="/logo.png" alt="misproductos" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-semibold text-gray-800">misproductos</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto">
            <Image src="/logo.png" alt="misproductos" width={32} height={32} className="object-contain" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Toggle sidebar"
        >
          <IoMenuOutline size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex flex-col p-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                {
                  "bg-blue-50 text-blue-600": isActive,
                  "text-gray-700 hover:bg-gray-100": !isActive,
                }
              )}
            >
              <Icon
                size={22}
                className={clsx({
                  "text-blue-600": isActive,
                  "text-gray-500": !isActive,
                })}
              />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Botón para volver al sistema */}
      <div className="mt-auto px-4 pb-4">
        <Link
          href="/"
          className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-100",
            {
              "justify-center": isCollapsed,
            }
          )}
        >
          <IoArrowBackOutline size={22} className="text-gray-500" />
          {!isCollapsed && <span className="font-medium">Ir a mi tienda</span>}
        </Link>
      </div>

      {/* Logout al final */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-red-600 hover:bg-red-50",
            {
              "justify-center": isCollapsed,
            }
          )}
        >
          <IoLogOutOutline size={22} />
          {!isCollapsed && <span className="font-medium">Salir</span>}
        </button>
      </div>
    </aside>
  );
};
