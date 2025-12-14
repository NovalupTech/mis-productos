'use client'

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { titleFont } from "@/config/fonts"
import { useCartStore } from "@/store/cart/cart-store"
import { useUIStore } from "@/store/ui/ui-store"
import { useCompanyStore } from "@/store/company/company-store"
import { IoCartOutline, IoSearchOutline } from "react-icons/io5"
import { FaInstagram, FaFacebook, FaTiktok, FaTwitter, FaLinkedin, FaYoutube, FaWhatsapp, FaGlobe } from 'react-icons/fa'
import { Search } from "../search/Search"
import { CartDropdown } from "../cart-dropdown/CartDropdown"
import { SocialType } from '@prisma/client'
import clsx from 'clsx'

export const TopMenu = () => {
  const company = useCompanyStore((state) => state.company)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

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

  const isCompanyAdmin = session?.user?.role === 'companyAdmin';

  // Verificar si estamos en la home (donde se muestran los productos)
  const isHomePage = pathname === '/';

  // Obtener páginas habilitadas para la navegación
  const enabledPages = company?.pages?.filter(page => page.enabled) || [];
  
  // Obtener redes sociales habilitadas y ordenadas
  const enabledSocials = company?.socials?.filter(social => social.enabled) || [];
  const sortedSocials = [...enabledSocials].sort((a, b) => a.order - b.order);

  // Mapeo de iconos de redes sociales
  const SOCIAL_TYPE_ICONS: Record<SocialType, React.ComponentType<{ size?: number; className?: string }>> = {
    INSTAGRAM: FaInstagram,
    FACEBOOK: FaFacebook,
    TIKTOK: FaTiktok,
    X: FaTwitter,
    LINKEDIN: FaLinkedin,
    YOUTUBE: FaYoutube,
    WHATSAPP: FaWhatsapp,
    WEBSITE: FaGlobe,
  };

  // Colores para cada red social
  const SOCIAL_TYPE_COLORS: Record<SocialType, string> = {
    INSTAGRAM: 'text-pink-600',
    FACEBOOK: 'text-blue-600',
    TIKTOK: 'text-black',
    X: 'text-gray-900',
    LINKEDIN: 'text-blue-700',
    YOUTUBE: 'text-red-600',
    WHATSAPP: 'text-green-600',
    WEBSITE: 'text-gray-600',
  };

  // Fondos circulares para cada red social
  const SOCIAL_TYPE_BG: Record<SocialType, string> = {
    INSTAGRAM: 'bg-pink-100 hover:bg-pink-200',
    FACEBOOK: 'bg-blue-100 hover:bg-blue-200',
    TIKTOK: 'bg-gray-100 hover:bg-gray-200',
    X: 'bg-gray-100 hover:bg-gray-200',
    LINKEDIN: 'bg-blue-50 hover:bg-blue-100',
    YOUTUBE: 'bg-red-100 hover:bg-red-200',
    WHATSAPP: 'bg-green-100 hover:bg-green-200',
    WEBSITE: 'bg-gray-50 hover:bg-gray-100',
  };

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
  }, [isHomePage]) // Removido showSearch de las dependencias para evitar loops

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
      router.push('/catalog/cart');
    }
    // En desktop, el Link manejará la navegación normalmente
  }

  const handleSearchClick = () => {
    if (isHomePage) {
      // Si estamos en la home, abrir/cerrar los filtros
      setShowSearch(!showSearch);
    } else {
      // Si estamos en otra página, redirigir al home
      router.push('/catalog');
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
          { /* Logo y navegación de páginas */ }
          <div className="flex items-center gap-6">
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

            {/* Navegación de páginas habilitadas */}
            {enabledPages.length > 0 && (
              <nav className="hidden md:flex items-center gap-4">
                {enabledPages.map((page) => {
                  const pagePath = `/${page.slug}`;
                  // Normalizar pathname para comparación (remover query params si existen)
                  const normalizedPathname = pathname.split('?')[0];
                  const isActive = normalizedPathname === pagePath || (normalizedPathname === '/' && page.isLanding);
                  
                  return (
                    <Link
                      key={page.id}
                      href={pagePath}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      {...(isActive && {
                        style: {
                          backgroundColor: 'var(--theme-secondary-color)',
                        }
                      })}
                    >
                      {page.title}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          { /* Search, Socials, Cart, menu */ }
          <div className="flex items-center">
            {/* Redes sociales */}
            {sortedSocials.length > 0 && (
              <div className="hidden md:flex items-center gap-2 mx-2">
                {sortedSocials.map((social) => {
                  const Icon = SOCIAL_TYPE_ICONS[social.type];
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={clsx(
                        'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                        SOCIAL_TYPE_BG[social.type],
                        SOCIAL_TYPE_COLORS[social.type]
                      )}
                      title={social.label || SOCIAL_TYPE_ICONS[social.type].name}
                      aria-label={social.label || `Ir a ${social.type}`}
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Botón de búsqueda */}
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
                    <span 
                      className="absolute text-xs px-1 font-bold -top-2 -right-2 rounded-full text-white fade-in"
                      style={{
                        backgroundColor: 'var(--theme-secondary-color)',
                      }}
                    >
                      { totalItemsInCart }
                    </span>
                  }
                  <IoCartOutline className="w-5 h-5" />
                </button>
              ) : (
                // En desktop, usar Link con hover
                <Link href="/catalog/cart">
                  <div className="relative">
                    {
                      (loaded && totalItemsInCart > 0) &&
                      <span 
                        className="absolute text-xs px-1 font-bold -top-2 -right-2 rounded-full text-white fade-in"
                        style={{
                          backgroundColor: 'var(--theme-secondary-color)',
                        }}
                      >
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

            {isCompanyAdmin && (
              <Link
                href="/gestion"
                target="_blank"
                rel="noopener noreferrer"
                className="m-2 px-4 py-2 text-white rounded-md transition-all font-medium"
                style={{
                  backgroundColor: 'var(--theme-secondary-color)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color)';
                }}
              >
                Gestionar
              </Link>
            )}
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