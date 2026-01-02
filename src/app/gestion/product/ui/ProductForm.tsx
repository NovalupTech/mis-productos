"use client";

import { useForm } from "react-hook-form";
import { Category, Product, ProductImage as ProductWithImage } from "@/interfaces";
import Image from "next/image";
import clsx from "clsx";
import { useRouter } from 'next/navigation';
import { ProductImage } from '@/components';
import { createUpdateProduct } from "@/actions/product/create-update-product";
import { deleteProductImage } from "@/actions/product/delete-product-image";
import { deleteProduct } from "@/actions/product/delete-product";
import { TagsModal } from './TagsModal';
import { CategoriesModal } from './CategoriesModal';
import { AttributesManager } from './AttributesManager';
import { useState } from 'react';
import { ProductAttributeWithDetails } from '@/interfaces';
import { IoTrashOutline } from 'react-icons/io5';
import { showErrorToast } from '@/utils/toast';
import { confirmDelete } from '@/utils/confirm';

interface Props {
  product: Partial<Product> & { productImage?: ProductWithImage[] };
  categories: Category[];
}

interface FormInputs {
  title: string;
  slug: string;
  description: string;
  price: number;
  inStock: number;
  tagIds: string[];
  categoryId: string;
  featured: boolean;
  code?: string | null;

  images?: FileList;
}

export const ProductForm = ({ product, categories }: Props) => {

  const router = useRouter();
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    product.tags?.map(tag => tag.id) || []
  );
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(
    product.tags?.map(tag => tag.name) || []
  );
  const [productAttributes, setProductAttributes] = useState<any[]>([]);

  const {
    handleSubmit,
    register,
    formState: { isValid },
    getValues,
    setValue,
    watch,
  } = useForm<FormInputs>({
    defaultValues: {
      ...product,
      tagIds: product.tags?.map(tag => tag.id) || [],
      featured: product.featured ?? false,
      code: product.code || '',
      images: undefined,
    },
  });


  const onSubmit = async (data: FormInputs) => {
    const formData = new FormData();

    const { images, ...productToSave } = data;

    if ( product.id ){
      formData.append("id", product.id ?? "");
    }
    
    formData.append("title", productToSave.title);
    formData.append("slug", productToSave.slug);
    formData.append("description", productToSave.description);
    formData.append("price", productToSave.price.toString());
    formData.append("inStock", productToSave.inStock.toString());
    formData.append("featured", productToSave.featured.toString());
    if (productToSave.code) {
      formData.append("code", productToSave.code);
    }
    // Enviar los tagIds como array
    selectedTagIds.forEach(tagId => {
      formData.append("tagIds", tagId);
    });
    formData.append("categoryId", productToSave.categoryId);
    
    // Enviar los atributos como JSON (solo los que tienen valores válidos)
    const validAttributes = productAttributes.filter(attr => {
      if (attr.attributeValueIds && attr.attributeValueIds.length > 0) return true;
      if (attr.valueText !== undefined && attr.valueText !== null && attr.valueText !== '') return true;
      if (attr.valueNumber !== undefined && attr.valueNumber !== null) return true;
      return false;
    });
    formData.append("attributes", JSON.stringify(validAttributes));
    
    if ( images ) {
      for ( let i = 0; i < images.length; i++  ) {
        formData.append('images', images[i]);
      }
    }



    const { ok, product:updatedProduct } = await createUpdateProduct(formData);

    if ( !ok ) {
      showErrorToast('Producto no se pudo actualizar');
      return;
    }

    router.replace(`/gestion/product/${ updatedProduct?.slug }`)


  };

  const handleTagsChange = (tagIds: string[], tagNames: string[]) => {
    setSelectedTagIds(tagIds);
    setSelectedTagNames(tagNames);
    setValue("tagIds", tagIds);
  };

  const handleAttributesChange = (attributes: any[]) => {
    // Guardar los atributos en el formato que espera el servidor
    setProductAttributes(attributes);
  };

  const handleDeleteProduct = async () => {
    if (!product.id) return;

    const confirmed = await confirmDelete(
      '¿Estás seguro de que deseas eliminar este producto?\n\n' +
      'Esta acción eliminará:\n' +
      '- El producto\n' +
      '- Todas las imágenes asociadas\n\n' +
      'Esta acción no se puede deshacer.',
      () => {}
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(product.id);
      
      if (result.ok) {
        router.push('/gestion/products');
        router.refresh();
      } else {
        showErrorToast(result.message || 'Error al eliminar el producto');
      }
    } catch (error) {
      showErrorToast('Error al eliminar el producto');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid px-4 sm:px-5 mb-16 grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
    >
      {/* Textos */}
      <div className="w-full">
        <div className="flex flex-col mb-2">
          <span>Título</span>
          <input
            type="text"
            className="p-2 border rounded-md bg-gray-200"
            {...register("title", { required: true })}
          />
        </div>

        <div className="flex flex-col mb-2">
          <span>Slug</span>
          <input
            type="text"
            className="p-2 border rounded-md bg-gray-200"
            {...register("slug", { required: true })}
          />
        </div>

        <div className="flex flex-col mb-2">
          <span>Código</span>
          <input
            type="text"
            className="p-2 border rounded-md bg-gray-200"
            {...register("code")}
            placeholder="Se genera automáticamente si se deja vacío (MP-00001, MP-00002...)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Si se deja vacío, se generará automáticamente con formato MP-XXXXX
          </p>
        </div>

        <div className="flex flex-col mb-2">
          <span>Descripción</span>
          <textarea
            rows={5}
            className="p-2 border rounded-md bg-gray-200"
            {...register("description", { required: true })}
          ></textarea>
        </div>

        <div className="flex flex-col mb-2">
          <span>Price</span>
          <input
            type="number"
            className="p-2 border rounded-md bg-gray-200"
            {...register("price", { required: true, min: 0 })}
          />
        </div>

        <div className="flex flex-col mb-2">
          <span>Tags</span>
          <div className="flex gap-2">
            <input
              type="text"
              className="p-2 border rounded-md bg-gray-200 flex-1"
              value={selectedTagNames.join(", ")}
              readOnly
              placeholder="Selecciona los tags del producto"
            />
            <button
              type="button"
              onClick={() => setIsTagsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Gestionar Tags
            </button>
          </div>
        </div>

        <div className="flex flex-col mb-4">
          <AttributesManager
            productAttributes={product.attributes}
            companyId={product.companyId || product.company?.id}
            onAttributesChange={handleAttributesChange}
          />
        </div>

        <div className="flex flex-col mb-2">
          <span>Categoria</span>
          <div className="flex gap-2">
            <select
              className="p-2 border rounded-md bg-gray-200 flex-1"
              {...register("categoryId", { required: true })}
            >
              <option value="">[Seleccione]</option>
              {categoriesList.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsCategoriesModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Gestionar Categorías
            </button>
          </div>
        </div>

        <button className="btn-primary w-full">Guardar</button>
        
        {/* Botón de eliminar producto - solo si el producto existe */}
        {product.id && (
          <button
            type="button"
            onClick={handleDeleteProduct}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors w-full mt-3 flex items-center justify-center gap-2"
          >
            <IoTrashOutline size={20} />
            {isDeleting ? 'Eliminando...' : 'Eliminar producto'}
          </button>
        )}
      </div>

      {/* Selector de tallas y fotos */}
      <div className="w-full">
        <div className="flex flex-col mb-2">
          <span>Stock</span>
          <input
            type="number"
            className="p-2 border rounded-md bg-gray-200"
            {...register("inStock", { required: true, min: 0 })}
          />
        </div>

        <div className="flex flex-col mb-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("featured")}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Producto destacado
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-8">
            Marca este producto como destacado para que aparezca en secciones especiales
          </p>
        </div>

        {/* As checkboxes */}
        <div className="flex flex-col">
          <div className="flex flex-col mb-2">
            <span>Fotos</span>
            <input
              type="file"
              { ...register('images') }
              multiple
              className="p-2 border rounded-md bg-gray-200"
              accept="image/png, image/jpeg, image/avif, image/webp"
              capture="environment"
            />
            <p className="text-xs text-gray-500 mt-1">
              En móvil puedes tomar una foto o elegir de la galería
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {product.productImage?.map((image) => (
              <div key={image.id}>
                <ProductImage
                  alt={product.title ?? ""}
                  src={ image.url }
                  width={300}
                  height={300}
                  className="rounded-t shadow-md"
                />

                <button
                  type="button"
                  onClick={() => deleteProductImage(image.id, image.url)}
                  className="btn-danger w-full rounded-b-xl"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Tags */}
      <TagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        selectedTagIds={selectedTagIds}
        onTagsChange={handleTagsChange}
        companyId={product.companyId || product.company?.id}
      />

      {/* Modal de Categorías */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        onCategoriesChange={(updatedCategories: Category[]) => {
          setCategoriesList(updatedCategories);
        }}
        companyId={product.companyId || product.company?.id}
      />
    </form>
  );
};