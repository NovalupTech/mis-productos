import { titleFont } from '@/config/fonts'
import React from 'react'

export const Footer = () => {
  return (
    <div className='flex w-full justify-center text-xs mb-10'>
        <span className={`${titleFont.className} antialiased font-bold`}>Tienda </span>
        <span>| shop</span>
        <span>© {new Date().getFullYear()} </span>
        <span>&nbsp; Privacidad legal</span>
    </div>
  )
}
