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
  IoCashOutline,
  IoCarOutline,
  IoChevronDownOutline,
  IoCardOutline,
} from "react-icons/io5";
import clsx from "clsx";
import { useSidebar } from "../providers/SidebarProvider";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { logout } from "@/actions/auth/logout";

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
    label: "Categorias y Tags",
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
    href: "/gestion/descuentos",
    label: "Descuentos",
    icon: IoPricetagOutline,
  },
  {
    href: "/gestion/orders",
    label: "Pedidos",
    icon: IoTicketOutline,
  },
  {
    href: "/gestion/shippings",
    label: "Envíos",
    icon: IoCarOutline,
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
  const [paymentsDropdownOpen, setPaymentsDropdownOpen] = useState(false);
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
      // Ejecutar el logout primero
      await logout();
      // Luego redirigir a la página de signout usando window.location para forzar recarga completa
      window.location.href = '/';
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
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-30 flex flex-col",
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
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

      {/* Navegación - Scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
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

        {/* Dropdown de Pagos */}
        <div className="relative">
          <button
            onClick={() => setPaymentsDropdownOpen(!paymentsDropdownOpen)}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              {
                "bg-blue-50 text-blue-600": pathname.startsWith("/gestion/payments") || pathname.startsWith("/gestion/payment-methods"),
                "text-gray-700 hover:bg-gray-100": !(pathname.startsWith("/gestion/payments") || pathname.startsWith("/gestion/payment-methods")),
                "justify-center": !sidebarVisible,
              }
            )}
          >
            <IoCashOutline
              size={22}
              className={clsx({
                "text-blue-600": pathname.startsWith("/gestion/payments") || pathname.startsWith("/gestion/payment-methods"),
                "text-gray-500": !(pathname.startsWith("/gestion/payments") || pathname.startsWith("/gestion/payment-methods")),
              })}
            />
            {sidebarVisible && (
              <>
                <span className="font-medium flex-1 text-left">Pagos</span>
                <IoChevronDownOutline
                  size={18}
                  className={clsx("transition-transform", {
                    "rotate-180": paymentsDropdownOpen,
                  })}
                />
              </>
            )}
          </button>

          {sidebarVisible && paymentsDropdownOpen && (
            <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
              <Link
                href="/gestion/payments"
                onClick={() => {
                  if (isMobile && isMobileOpen) {
                    toggleSidebar();
                  }
                  setPaymentsDropdownOpen(false);
                }}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm",
                  {
                    "bg-blue-50 text-blue-600": pathname === "/gestion/payments" || pathname.startsWith("/gestion/payments/"),
                    "text-gray-700 hover:bg-gray-100": pathname !== "/gestion/payments" && !pathname.startsWith("/gestion/payments/"),
                  }
                )}
              >
                <IoCardOutline size={18} />
                <span>Pagos</span>
              </Link>
              <Link
                href="/gestion/payment-methods"
                onClick={() => {
                  if (isMobile && isMobileOpen) {
                    toggleSidebar();
                  }
                  setPaymentsDropdownOpen(false);
                }}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm",
                  {
                    "bg-blue-50 text-blue-600": pathname === "/gestion/payment-methods" || pathname.startsWith("/gestion/payment-methods/"),
                    "text-gray-700 hover:bg-gray-100": pathname !== "/gestion/payment-methods" && !pathname.startsWith("/gestion/payment-methods/"),
                  }
                )}
              >
                <IoCashOutline size={18} />
                <span>Métodos de pago</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Footer con botones - Siempre visible */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
        {/* Botón para volver al sistema */}
        <div className="p-4 pb-2">
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

        {/* Logout */}
        <div className="px-4 pb-4">
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
      </div>
    </aside>
    </>
  );
};
