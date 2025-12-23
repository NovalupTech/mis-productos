import { redirect } from 'next/navigation'
import { middleware } from '@/auth.config'
import { getUserFavorites } from '@/actions/favorites/get-user-favorites'
import { Title } from '@/components'
import { FavoritesList } from './ui/FavoritesList'

export default async function FavoritesPage() {
  const session = await middleware()

  if (!session?.user) {
    redirect('/login')
  }

  const { ok, favorites } = await getUserFavorites()

  if (!ok) {
    return (
      <div className="flex justify-center items-center mb-72 px-8 sm:px-0">
        <div className="flex flex-col w-[1000px]">
          <Title title="Mis favoritos" />
          <p className="text-gray-600 mt-4">Error al cargar tus favoritos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center mb-72 px-8 sm:px-0">
      <div className="flex flex-col w-[1000px]">
        <Title title="Mis favoritos" />
        
        {favorites.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-lg">No tienes productos favoritos aún</p>
            <p className="text-gray-500 text-sm mt-2">Agrega productos a tus favoritos haciendo clic en el corazón</p>
          </div>
        ) : (
          <FavoritesList favorites={favorites} />
        )}
      </div>
    </div>
  )
}
