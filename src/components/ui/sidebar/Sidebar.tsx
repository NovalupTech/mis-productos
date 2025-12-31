'use client'

import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { useState } from 'react';
import { useUIStore } from "@/store/ui/ui-store"
import { useCompanyStore } from "@/store/company/company-store"
import { IoCloseOutline, IoLogInOutline, IoLogOutOutline, IoPeopleOutline, IoPersonOutline, IoSearchOutline, IoShirtOutline, IoTicketOutline, IoBusinessOutline, IoBagOutline, IoHeartOutline } from "react-icons/io5"
import { FaInstagram, FaFacebook, FaTiktok, FaTwitter, FaLinkedin, FaYoutube, FaWhatsapp, FaGlobe } from 'react-icons/fa'
import { SocialType } from '@prisma/client'
import clsx from "clsx"
import { logout } from "@/actions/auth/logout";

export const Sidebar = () => {

  const { isSideMenuOpen, closeSideMenu } = useUIStore(state => state)
  const company = useCompanyStore((state) => state.company)

  const { data: session } = useSession()
  const isAuthenticated = !!session?.user;
  const isCompanyAdmin = session?.user?.role === 'companyAdmin';

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

  const log_out = async () => {
    await logout();
    closeSideMenu();
    window.location.replace('/')
  }

  return (
    <>
      { /* Overlay de fondo - solo visible cuando el menú está abierto */}
      {isSideMenuOpen && (
        <div 
          onClick={closeSideMenu} 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      { /* SideMenu - se desliza desde la derecha */}
      <nav
        className={
          clsx(
            "fixed right-0 top-0 h-screen z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto",
            "w-[85%] max-w-sm", // En mobile: 85% del ancho, máximo 384px (sm)
            {
              "translate-x-0": isSideMenuOpen, // Visible cuando está abierto
              "translate-x-full": !isSideMenuOpen, // Oculto fuera de la pantalla cuando está cerrado
            }
          )
        }
        style={{ backgroundColor: 'var(--theme-primary-color)' }}
      >
        <div className="p-5">
          {/* Botón de cerrar */}
          <div className="flex justify-end mb-4">
            <button
              onClick={closeSideMenu}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cerrar menú"
            >
              <IoCloseOutline size={28} />
            </button>
          </div>

          {/* {
            isAuthenticated && (
              <>
                <Link onClick={closeSideMenu} href="/profile" className="flex items-center mt-6 p-2 hover:bg-gray-100 rounded transition-all">
                  <IoPersonOutline size={30} />
                  <span className="ml-3 text-xl">Perfil</span>
                </Link>

                <Link onClick={closeSideMenu} href="/orders" className="flex items-center mt-6 p-2 hover:bg-gray-100 rounded transition-all">
                  <IoTicketOutline size={30} />
                  <span className="ml-3 text-xl">Ordenes</span>
                </Link>
              </>
            )
          } */}

          {/* Información del usuario cuando está autenticado */}
          {isAuthenticated && session?.user && (
            <>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center bg-gray-100 flex-shrink-0">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user?.name || 'Usuario'}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-semibold text-xl">
                      {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {session.user?.name || 'Usuario'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>

              {/* Opciones del menú del usuario */}
              <Link
                onClick={closeSideMenu}
                href="/catalog/profile"
                className="flex items-center mt-4 p-2 hover:bg-gray-100 rounded transition-all"
              >
                <IoPersonOutline size={30} />
                <span className="ml-3 text-xl">Mi perfil</span>
              </Link>

              <Link
                onClick={closeSideMenu}
                href="/catalog/favorites"
                className="flex items-center mt-4 p-2 hover:bg-gray-100 rounded transition-all"
              >
                <IoHeartOutline size={30} />
                <span className="ml-3 text-xl">Mis favoritos</span>
              </Link>

              <Link
                onClick={closeSideMenu}
                href="/catalog/orders"
                className="flex items-center mt-4 p-2 hover:bg-gray-100 rounded transition-all"
              >
                <IoBagOutline size={30} />
                <span className="ml-3 text-xl">Mis compras</span>
              </Link>

              <button
                onClick={log_out}
                className="w-full flex items-center mt-4 p-2 hover:bg-gray-100 rounded transition-all text-left"
              >
                <IoLogOutOutline size={30} />
                <span className="ml-3 text-xl">Salir</span>
              </button>
            </>
          )}

          {/* Botón de autenticación cuando no está autenticado */}
          {!isAuthenticated && (
            <Link 
              onClick={closeSideMenu} 
              href="/login" 
              className="flex items-center mt-6 p-2 hover:bg-gray-100 rounded transition-all"
            >
              <IoLogInOutline size={30} />
              <span className="ml-3 text-xl">Ingresar</span>
            </Link>
          )}

          {/* Botón Gestionar - Solo para companyAdmin, visible en mobile */}
          {isCompanyAdmin && (
            <>
              <div className="w-full h-px bg-gray-200 my-6" />
              <Link
                onClick={closeSideMenu}
                href="/gestion"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center mt-6 p-2 hover:bg-gray-100 rounded transition-all"
              >
                <IoBusinessOutline size={30} />
                <span className="ml-3 text-xl">Gestionar</span>
              </Link>
            </>
          )}

          {/* Redes sociales - Al final del menú */}
          {sortedSocials.length > 0 && (
            <>
              <div className="w-full h-px bg-gray-200 my-6" />
              <div className="mt-6 pb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Redes Sociales</h3>
                <div className="flex flex-wrap gap-3">
                  {sortedSocials.map((social) => {
                    const Icon = SOCIAL_TYPE_ICONS[social.type];
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeSideMenu}
                        className={clsx(
                          'flex items-center justify-center w-12 h-12 rounded-full transition-colors',
                          SOCIAL_TYPE_BG[social.type],
                          SOCIAL_TYPE_COLORS[social.type]
                        )}
                        title={social.label || `Ir a ${social.type}`}
                        aria-label={social.label || `Ir a ${social.type}`}
                      >
                        <Icon size={24} />
                      </a>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  )
}

export default Sidebar