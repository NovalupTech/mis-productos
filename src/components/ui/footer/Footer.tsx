'use client'

import { titleFont } from '@/config/fonts'
import React from 'react'
import Image from 'next/image'
import { useCompanyStore } from '@/store/company/company-store'

export const Footer = () => {
  const { company } = useCompanyStore()

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
