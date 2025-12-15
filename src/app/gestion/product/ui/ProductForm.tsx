"use client";

import { useForm } from "react-hook-form";
import { Category, Product, ProductImage as ProductWithImage } from "@/interfaces";
import Image from "next/image";
import clsx from "clsx";
import { useRouter } from 'next/navigation';
import { ProductImage } from '@/components';
import { createUpdateProduct } from "@/actions/product/create-update-product";
import { deleteProductImage } from "@/actions/product/delete-product-image";
import { TagsModal } from './TagsModal';
import { AttributesManager } from './AttributesManager';
import { useState } from 'react';
import { ProductAttributeWithDetails } from '@/interfaces';

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

  images?: FileList;
}

export const ProductForm = ({ product, categories }: Props) => {

  const router = useRouter();
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
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
      alert('Producto no se pudo actualizar');
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid px-5 mb-16 grid-cols-1 sm:px-0 sm:grid-cols-2 gap-3"
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
          <select
            className="p-2 border rounded-md bg-gray-200"
            {...register("categoryId", { required: true })}
          >
            <option value="">[Seleccione]</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-primary w-full">Guardar</button>
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

        {/* As checkboxes */}
        <div className="flex flex-col">
          <div className="flex flex-col mb-2">
            <span>Fotos</span>
            <input
              type="file"
              { ...register('images') }
              multiple
              className="p-2 border rounded-md bg-gray-200"
              accept="image/png, image/jpeg, image/avif"
            />
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
    </form>
  );
};