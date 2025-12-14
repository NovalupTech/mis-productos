import { Product } from "@/interfaces"
import { ProductListItem } from "./ProductListItem"

interface Props {
    products: Product[]
    selectedTag?: string
}

export const ProductList = ({products, selectedTag}: Props) => {
  return (
    <div className="space-y-4 mb-10">
        {
            products.map(product =>
                <ProductListItem key={product.slug} product={product} selectedTag={selectedTag}/>
            )
        }
    </div>
  )
}
