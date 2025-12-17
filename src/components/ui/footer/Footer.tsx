'use client'

import { titleFont } from '@/config/fonts'
import React from 'react'
import Image from 'next/image'
import { useCompanyStore } from '@/store/company/company-store'
import { IoCardOutline, IoWalletOutline, IoCashOutline, IoChatbubbleOutline } from 'react-icons/io5'
import { PaymentMethodType } from '@prisma/client'

interface PaymentMethod {
  id: string
  type: PaymentMethodType
  enabled: boolean
}

interface FooterProps {
  paymentMethods?: PaymentMethod[]
}

// Componente para mostrar logos de tarjetas
const CreditCardLogos = () => {
  return (
    <div className='flex items-center justify-center gap-2.5 flex-wrap'>
      {/* Visa */}
      <div className='bg-white rounded px-3 py-2 border border-gray-200 flex items-center justify-center shadow-sm' style={{ minWidth: '60px', height: '38px' }}>
        <span className='text-[#1434CB] font-bold text-lg tracking-tight' style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '0.5px' }}>
          VISA
        </span>
      </div>
      
      {/* Mastercard */}
      <div className='bg-white rounded px-3 py-2 border border-gray-200 flex items-center justify-center shadow-sm' style={{ width: '60px', height: '38px' }}>
        <svg viewBox="0 0 48 30" className='w-full h-full' preserveAspectRatio="xMidYMid meet">
          <circle fill="#EB001B" cx="15" cy="15" r="10"/>
          <circle fill="#F79E1B" cx="33" cy="15" r="10"/>
          <path fill="#FF5F00" d="M24 5c-4.4 0-8.4 1.9-11.2 5c2.8 3.1 7.2 5 11.2 5s8.4-1.9 11.2-5C32.4 6.9 28.4 5 24 5z"/>
        </svg>
      </div>
      
      {/* American Express */}
      <div className='bg-white rounded px-3 py-2 border border-gray-200 flex items-center justify-center shadow-sm' style={{ minWidth: '70px', height: '38px' }}>
        <div className='bg-[#006FCF] rounded px-2 py-1 flex items-center justify-center'>
          <span className='text-white font-bold text-xs tracking-wider' style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '1px' }}>
            AMEX
          </span>
        </div>
      </div>
      
      {/* Diners Club */}
      <div className='bg-white rounded px-3 py-2 border border-gray-200 flex items-center justify-center shadow-sm' style={{ minWidth: '60px', height: '38px' }}>
        <div className='bg-[#0079BE] rounded px-2 py-1 flex items-center justify-center'>
          <span className='text-white font-bold text-xs tracking-widest' style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}>
            DC
          </span>
        </div>
      </div>
    </div>
  )
}

export const Footer = ({ paymentMethods = [] }: FooterProps) => {
  const { company } = useCompanyStore()

  // Función para obtener el icono y texto según el tipo de método de pago
  const getPaymentMethodInfo = (type: PaymentMethodType) => {
    switch (type) {
      case 'PAYPAL':
        return { icon: IoCardOutline, label: 'PayPal', color: 'text-blue-600' }
      case 'MERCADOPAGO':
        return { icon: IoCardOutline, label: 'MercadoPago', color: 'text-blue-500' }
      case 'BANK_TRANSFER':
        return { icon: IoWalletOutline, label: 'Transferencia', color: 'text-green-600' }
      case 'CASH':
        return { icon: IoCashOutline, label: 'Efectivo', color: 'text-green-700' }
      case 'COORDINATE_WITH_SELLER':
        return { icon: IoChatbubbleOutline, label: 'Coordinar con Vendedor', color: 'text-purple-600' }
      default:
        return { icon: IoCardOutline, label: type, color: 'text-gray-600' }
    }
  }

  // Si no hay métodos configurados, mostrar PayPal por defecto
  const hasConfiguredMethods = paymentMethods.length > 0
  const showPayPal = !hasConfiguredMethods || paymentMethods.some(pm => pm.type === 'PAYPAL')
  
  // Construir la lista de métodos a mostrar
  const methodsToShow = hasConfiguredMethods 
    ? paymentMethods 
    : [{ id: 'default-paypal', type: 'PAYPAL' as PaymentMethodType, enabled: true }]

  // Verificar si PayPal o MercadoPago están activos para mostrar logos de tarjetas
  const hasPayPal = methodsToShow.some(pm => pm.type === 'PAYPAL')
  const hasMercadoPago = methodsToShow.some(pm => pm.type === 'MERCADOPAGO')
  const showCardLogos = hasPayPal || hasMercadoPago

  return (
    <div className='flex flex-col items-center justify-center gap-3 w-full text-xs mb-10'>
      {/* Logo y nombre de la compañía */}
      {(company?.logo || company?.name) && (
        <div className='flex items-center gap-3'>
          {company.logo && (
            <div className='relative w-12 h-12 flex-shrink-0'>
              <Image
                src={company.logo.startsWith('http') || company.logo.startsWith('https') 
                  ? company.logo 
                  : `/logos/${company.logo}`}
                alt={company.name || 'Logo'}
                fill
                className='object-contain'
              />
            </div>
          )}
          {company.name && (
            <span className={`${titleFont.className} antialiased font-bold text-sm`}>
              {company.name}
            </span>
          )}
        </div>
      )}
      
      {/* Métodos de pago aceptados */}
      {methodsToShow.length > 0 && (
        <div className='flex flex-col items-center gap-2'>
          <span className='text-gray-500 text-xs'>Métodos de pago aceptados:</span>
          <div className='flex flex-wrap items-center justify-center gap-3'>
            {methodsToShow.map((method) => {
              const { icon: Icon, label, color } = getPaymentMethodInfo(method.type)
              return (
                <div
                  key={method.id}
                  className='flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md border border-gray-200'
                >
                  <Icon size={16} className={color} />
                  <span className='text-gray-700 text-xs'>{label}</span>
                </div>
              )
            })}
          </div>
          
          {/* Logos de tarjetas si PayPal o MercadoPago están activos */}
          {showCardLogos && (
            <div className='flex flex-col items-center gap-1.5 mt-2'>
              <span className='text-gray-400 text-xs'>Tarjetas aceptadas:</span>
              <CreditCardLogos />
            </div>
          )}
        </div>
      )}
      
      {/* Dirección de la empresa */}
      {company?.address && (
        <div className='flex flex-col items-center gap-1'>
          <span className='text-gray-600 text-xs text-center max-w-md'>
            {company.address}
          </span>
        </div>
      )}
      
      {/* Información de copyright */}
      <div className='flex flex-wrap items-center justify-center gap-2 text-gray-600'>
        <span>© {new Date().getFullYear()}</span>
        {company?.name && (
          <>
            <span>•</span>
            <span>{company.name}</span>
          </>
        )}
        <span>•</span>
        <span>Privacidad legal</span>
      </div>
    </div>
  )
}
