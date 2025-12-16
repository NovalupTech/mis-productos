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
  IoPricetagOutline,
  IoBookmarkOutline,
  IoBagOutline,
  IoStatsChartOutline,
} from "react-icons/io5";
import clsx from "clsx";
import { logout } from "@/actions/auth/logout";
import { useSidebar } from "../providers/SidebarProvider";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

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
    href: "/gestion/tags",
    label: "Tags",
    icon: IoBookmarkOutline,
  },
  {
    href: "/gestion/attributes",
    label: "Atributos",
    icon: IoBagOutline,
  },
  {
    href: "/gestion/stock",
    label: "Stock",
    icon: IoStatsChartOutline,
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
  const [isMobile, setIsMobile] = useState(false);
  const prevIsMobileRef = useRef<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const wasMobile = prevIsMobileRef.current;
      
      setIsMobile(mobile);
      
      // Si cambia de mobile a desktop, asegurar que el sidebar esté abierto
      if (!mobile && wasMobile === true && isCollapsed) {
        toggleSidebar();
      }
      // Si cambia de desktop a mobile, asegurar que el sidebar esté cerrado
      if (mobile && wasMobile === false && !isCollapsed) {
        toggleSidebar();
      }
      
      prevIsMobileRef.current = mobile;
    };
    
    // Verificar el tamaño inicial
    const initialMobile = window.innerWidth < 768;
    setIsMobile(initialMobile);
    prevIsMobileRef.current = initialMobile;
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isCollapsed, toggleSidebar]);

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

  const handleToggle = () => {
    toggleSidebar();
  };

  // En mobile, el sidebar está visible cuando isCollapsed es false (abierto)
  // En desktop, el sidebar está visible cuando isCollapsed es false (expandido)
  const sidebarVisible = !isCollapsed;
  const isMobileOpen = isMobile && !isCollapsed;

  return (
    <>
      {/* Overlay para mobile cuando el sidebar está abierto */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <aside
        className={clsx(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-30",
          {
            "w-64": sidebarVisible,
            "w-20": !sidebarVisible && !isMobile,
            "-translate-x-full": isMobile && !isMobileOpen,
            "translate-x-0": isMobile && isMobileOpen,
          },
          "md:translate-x-0"
        )}
      >
      {/* Header con logo y botón de menú */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {sidebarVisible && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Image src="/logo.png" alt="misproductos" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-semibold text-gray-800">misproductos</span>
          </div>
        )}
        {!sidebarVisible && !isMobile && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto">
            <Image src="/logo.png" alt="misproductos" width={32} height={32} className="object-contain" />
          </div>
        )}
        <button
          onClick={handleToggle}
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
              onClick={() => {
                if (isMobile && isMobileOpen) {
                  toggleSidebar();
                }
              }}
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
              {sidebarVisible && (
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
              "justify-center": !sidebarVisible,
            }
          )}
        >
          <IoArrowBackOutline size={22} className="text-gray-500" />
          {sidebarVisible && <span className="font-medium">Ir a mi tienda</span>}
        </Link>
      </div>

      {/* Logout al final */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-red-600 hover:bg-red-50",
            {
              "justify-center": !sidebarVisible,
            }
          )}
        >
          <IoLogOutOutline size={22} />
          {sidebarVisible && <span className="font-medium">Salir</span>}
        </button>
      </div>
    </aside>
    </>
  );
};
