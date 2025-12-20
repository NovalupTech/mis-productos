'use client'

import { FavoriteItem } from '../ui/FavoriteItem'

interface Favorite {
  id: string
  createdAt: Date
    product: {
      id: string
      title: string
      description: string
      price: number
      slug: string
      inStock: number
      companyId: string
      productImage: Array<{ url: string }>
      category: {
        id: string
        name: string
        companyId: string
      }
    tags: Array<{
      tag: {
        id: string
        name: string
      }
    }>
    ProductAttribute: Array<{
      id: string
      productId: string
      attributeId: string
      attributeValueId: string | null
      valueText: string | null
      valueNumber: number | null
      attribute: {
        id: string
        name: string
        type: string
        required: boolean
        companyId: string
      }
      attributeValue: {
        id: string
        value: string
      } | null
    }>
  }
}

interface Props {
  favorites: Favorite[]
}

export const FavoritesList = ({ favorites }: Props) => {
  return (
    <div className="mt-6 space-y-4">
      {favorites.map((favorite) => (
        <FavoriteItem key={favorite.id} favorite={favorite} />
      ))}
    </div>
  )
}
