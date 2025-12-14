import { Product } from "@/interfaces"
import { ProductGridItem } from "./ProductGridItem"

interface Props {
    products: Product[]
    selectedTag?: string
    columns?: number
    imageSize?: 'small' | 'medium' | 'large'
}

// Mapeo de número de columnas a clases de Tailwind CSS
const getGridColsClass = (columns: number): string => {
  // En mobile siempre 1 columna, en desktop según la configuración
  const colsMap: Record<number, string> = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    5: 'sm:grid-cols-5',
    6: 'sm:grid-cols-6',
  };
  
  return colsMap[columns] || 'sm:grid-cols-4'; // Por defecto 4 columnas
};

export const ProductGrid = ({products, selectedTag, columns = 4, imageSize = 'medium'}: Props) => {
  const gridColsClass = getGridColsClass(columns);
  
  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-4 sm:gap-10 mb-10`}>
        {
            products.map(product =>
                <ProductGridItem key={product.slug} product={product} selectedTag={selectedTag} imageSize={imageSize}/>
            )
        }
    </div>
  )
}