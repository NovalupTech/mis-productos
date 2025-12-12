'use client'

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { titleFont } from "@/config/fonts"
import { useCartStore } from "@/store/cart/cart-store"
import { useUIStore } from "@/store/ui/ui-store"
import { useCompanyStore } from "@/store/company/company-store"
import { IoCartOutline, IoSearchOutline } from "react-icons/io5"
import { Search } from "../search/Search"
import { CartDropdown } from "../cart-dropdown/CartDropdown"

export const TopMenu = () => {
  const company = useCompanyStore((state) => state.company)
  const pathname = usePathname()
  const router = useRouter()

  const { openSideMenu } = useUIStore(state => state)
  const totalItemsInCart = useCartStore(state => state.getTotalItems());
  const cart = useCartStore(state => state.cart);
  const [loaded, setLoaded] = useState(false);
  const [showSearch, setShowSearch] = useState(false)
  const [showCartDropdown, setShowCartDropdown] = useState(false)
  const [imageError, setImageError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const previousTotalItemsRef = useRef(totalItemsInCart);
  const autoOpenTimeoutRef = useRef<number | null>(null);

  // Verificar si estamos en la home (donde se muestran los productos)
  const isHomePage = pathname === '/';

  useEffect(() => {
    setLoaded(true);
    
    // Detectar si estamos en mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint de Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [])

  // Cerrar los filtros cuando salimos de la home
  useEffect(() => {
    if (!isHomePage && showSearch) {
      setShowSearch(false);
    }
  }, [isHomePage, showSearch])

  // Abrir automáticamente el dropdown cuando se agrega un producto al carrito (solo en desktop)
  useEffect(() => {
    // Solo abrir si estamos en desktop, el carrito ya está cargado y hay un aumento en los items
    if (!isMobile && loaded && totalItemsInCart > previousTotalItemsRef.current && totalItemsInCart > 0) {
      //setShowCartDropdown(true);
      
      // Limpiar timeout anterior si existe
      if (autoOpenTimeoutRef.current) {
        clearTimeout(autoOpenTimeoutRef.current);
      }
      
      // Cerrar automáticamente después de 4 segundos si el usuario no está haciendo hover
      autoOpenTimeoutRef.current = window.setTimeout(() => {
        setShowCartDropdown(false);
      }, 4000);
    }
    
    // Actualizar la referencia del total anterior
    previousTotalItemsRef.current = totalItemsInCart;
    
    // Limpiar timeout al desmontar
    return () => {
      if (autoOpenTimeoutRef.current) {
        clearTimeout(autoOpenTimeoutRef.current);
      }
    };
  }, [totalItemsInCart, loaded, cart.length, isMobile])

  const handleMouseEnter = () => {
    // Solo en desktop
    if (!isMobile) {
      // Cancelar el cierre automático si el usuario hace hover
      if (autoOpenTimeoutRef.current) {
        clearTimeout(autoOpenTimeoutRef.current);
        autoOpenTimeoutRef.current = null;
      }
      setShowCartDropdown(true);
    }
  }

  const handleMouseLeave = () => {
    // Solo en desktop
    if (!isMobile) {
      // Cerrar el dropdown cuando el mouse sale del área
      setShowCartDropdown(false);
    }
  }

  const handleCartClick = (e: React.MouseEvent) => {
    // En mobile, navegar directamente al carrito
    if (isMobile) {
      e.preventDefault();
      router.push('/cart');
    }
    // En desktop, el Link manejará la navegación normalmente
  }

  const handleSearchClick = () => {
    if (isHomePage) {
      // Si estamos en la home, abrir/cerrar los filtros
      setShowSearch(!showSearch);
    } else {
      // Si estamos en otra página, redirigir al home
      router.push('/');
      // Abrir los filtros después de la navegación
      setTimeout(() => {
        setShowSearch(true);
      }, 100);
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm flex flex-col w-full">
        {/* Primera fila: Logo y acciones */}
        <div className="flex px-5 justify-between items-center w-full py-2">
          { /* Logo */ }
          <div>
              <Link href="/" className="flex items-center gap-2"> 
                {company?.logo && !imageError ? (
                  <> 
                    <Image
                      src={company.logo.startsWith('http') || company.logo.startsWith('https') 
                        ? company.logo 
                        : `/logos/${company.logo}`}
                      alt={company.name}
                      width={120}
                      height={40}
                      className="h-16 w-auto object-contain"
                      onError={() => setImageError(true)}
                    />
                    <span className={titleFont.className + ' antialiased font-bold'}>
                      {company?.name || 'Tienda'}
                    </span>
                  </>
                ) : (
                  <span className={titleFont.className + ' antialiased font-bold'}>
                    {company?.name || 'Tienda'}
                  </span>
                )}
              </Link>
          </div>

          { /* Search, Cart, menu */ }
          <div className="flex items-center">
            <button onClick={handleSearchClick} className="m-2">
              <IoSearchOutline className="w-5 h-5" />
            </button>

            <div 
              className="relative m-2"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {isMobile ? (
                // En mobile, usar botón que navega directamente
                <button onClick={handleCartClick} className="relative">
                  {
                    (loaded && totalItemsInCart > 0) &&
                    <span className="absolute text-xs px-1 font-bold -top-2 -right-2 bg-blue-600 rounded-full text-white fade-in">
                      { totalItemsInCart }
                    </span>
                  }
                  <IoCartOutline className="w-5 h-5" />
                </button>
              ) : (
                // En desktop, usar Link con hover
                <Link href="/cart">
                  <div className="relative">
                    {
                      (loaded && totalItemsInCart > 0) &&
                      <span className="absolute text-xs px-1 font-bold -top-2 -right-2 bg-blue-600 rounded-full text-white fade-in">
                        { totalItemsInCart }
                      </span>
                    }
                  </div>
                  <IoCartOutline className="w-5 h-5" />
                </Link>
              )}
              {/* Puente invisible para mantener el hover activo - Solo en desktop */}
              {!isMobile && showCartDropdown && (
                <div className="absolute right-0 top-full w-96 h-1" />
              )}
              {/* Dropdown solo visible en desktop */}
              {!isMobile && <CartDropdown isVisible={showCartDropdown} />}
            </div>

            <button onClick={openSideMenu} className="m-2 p-2 rounded-md transition-all hover:bg-gray-100">
              Menú
            </button>
          </div>
        </div>

        {/* Segunda fila: Barra de búsqueda y filtros (cuando showSearch es true) */}
        {showSearch && (
          <div className="border-t border-gray-200 px-5 py-3 bg-gray-50">
            <Search onClose={() => setShowSearch(false)} />
          </div>
        )}
      </nav>
    </>
  )
}