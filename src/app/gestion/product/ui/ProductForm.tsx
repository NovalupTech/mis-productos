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
import { useState, useEffect, useRef } from 'react';
import { ProductAttributeWithDetails } from '@/interfaces';
import { IoTrashOutline, IoSaveOutline } from 'react-icons/io5';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
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
}

export const ProductForm = ({ product, categories }: Props) => {

  const router = useRouter();
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories);
  
  // Inicialización lazy para evitar problemas de hidratación
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => 
    product.tags?.map(tag => tag.id) || []
  );
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(() =>
    product.tags?.map(tag => tag.name) || []
  );
  const [productAttributes, setProductAttributes] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    register,
    formState: { isValid },
    getValues,
    setValue,
    watch,
    reset,
  } = useForm<FormInputs>({
    defaultValues: {
      title: product.title || '',
      slug: product.slug || '',
      description: product.description || '',
      price: product.price ?? 0,
      inStock: product.inStock ?? 0,
      tagIds: product.tags?.map(tag => tag.id) || [],
      categoryId: product.categoryId || '',
      featured: product.featured ?? false,
      code: product.code || '',
    },
  });

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sincronizar el formulario cuando cambien las props del producto
  useEffect(() => {
    reset({
      title: product.title || '',
      slug: product.slug || '',
      description: product.description || '',
      price: product.price ?? 0,
      inStock: product.inStock ?? 0,
      tagIds: product.tags?.map(tag => tag.id) || [],
      categoryId: product.categoryId || '',
      featured: product.featured ?? false,
      code: product.code || '',
    });
    setSelectedTagIds(product.tags?.map(tag => tag.id) || []);
    setSelectedTagNames(product.tags?.map(tag => tag.name) || []);
    setSelectedFiles([]); // Limpiar archivos seleccionados al cambiar de producto
  }, [product.id, reset]);

  // Función para comprimir imágenes
  const compressImage = async (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img') as HTMLImageElement;
        if (!event.target?.result) {
          reject(new Error('Error al leer el archivo'));
          return;
        }
        img.src = event.target.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si es necesario
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir la imagen'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
    });
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        // Comprimir cada archivo antes de agregarlo
        const compressionPromises = Array.from(files).map(file => compressImage(file));
        const compressedFiles = await Promise.all(compressionPromises);
        
        // Agregar los archivos comprimidos al estado
        setSelectedFiles(prev => [...prev, ...compressedFiles]);
        // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
        e.target.value = '';
      } catch (error) {
        console.error('Error al comprimir imágenes:', error);
        showErrorToast('Error al procesar las imágenes. Intenta nuevamente.');
      }
    }
  };

  const handleDesktopFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        // Comprimir cada archivo antes de agregarlo
        const compressionPromises = Array.from(files).map(file => compressImage(file));
        const compressedFiles = await Promise.all(compressionPromises);
        setSelectedFiles(prev => [...prev, ...compressedFiles]);
      } catch (error) {
        console.error('Error al comprimir imágenes:', error);
        showErrorToast('Error al procesar las imágenes. Intenta nuevamente.');
      }
    }
  };


  const onSubmit = async (data: FormInputs) => {
    try {
      const formData = new FormData();

      const productToSave = data;

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
      
      // Agregar archivos seleccionados (tanto desktop como mobile usan selectedFiles)
      if ( selectedFiles.length > 0 ) {
        selectedFiles.forEach(file => {
          formData.append('images', file);
        });
      }

      const { ok, product:updatedProduct, message } = await createUpdateProduct(formData);

      if ( !ok ) {
        showErrorToast(message || 'Error al guardar el producto. Por favor, intenta nuevamente.');
        return;
      }

      showSuccessToast(product.id ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
      setSelectedFiles([]); // Limpiar archivos seleccionados después de guardar
      router.replace(`/gestion/product/${ updatedProduct?.slug }`);
    } catch (error) {
      console.error('Error inesperado al guardar el producto:', error);
      showErrorToast('Error inesperado al guardar el producto. Por favor, intenta nuevamente.');
    }
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
        showSuccessToast(result.message || 'Producto eliminado exitosamente');
        router.push('/gestion/products');
        router.refresh();
      } else {
        showErrorToast(result.message || 'Error al eliminar el producto');
      }
    } catch (error) {
      showErrorToast('Error inesperado al eliminar el producto');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid px-4 sm:px-5 mb-16 grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
      suppressHydrationWarning
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
            
            {/* Desktop: Input mejorado */}
            <div className="hidden md:block">
              <label className="block">
                <input
                  type="file"
                  multiple
                  onChange={handleDesktopFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer border border-gray-300 rounded-md bg-white p-2"
                  accept="image/png, image/jpeg, image/avif, image/webp"
                />
              </label>
            </div>

            {/* Mobile: Dos botones separados */}
            <div className="md:hidden flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Elegir de la galería
              </button>
              
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-full flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Tomar foto
              </button>
            </div>

            {/* Inputs ocultos para mobile */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/png, image/jpeg, image/avif, image/webp"
              onChange={handleFileInputChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/png, image/jpeg, image/avif, image/webp"
              capture="environment"
              onChange={handleFileInputChange}
            />

            {/* Vista previa de archivos seleccionados (solo mobile) */}
            {selectedFiles.length > 0 && (
              <div className="md:hidden mt-2 space-y-2">
                <p className="text-xs text-gray-600 font-medium">
                  Archivos seleccionados ({selectedFiles.length}):
                </p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <span className="text-xs text-gray-700 truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <IoTrashOutline size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                  onClick={async () => {
                    const result = await deleteProductImage(image.id, image.url);
                    if (result?.ok) {
                      showSuccessToast(result.message || 'Imagen eliminada exitosamente');
                      router.refresh();
                    } else {
                      showErrorToast(result?.message || result?.error || 'Error al eliminar la imagen');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-full rounded-b-xl"
                >
                  Eliminar foto
                </button>
              </div>
            ))}
          </div>
          
          { /* separador */ }
          <div className="h-2 bg-gray-200 rounded-md my-4"></div>

          { /* botones de guardar y eliminar producto */ }

          <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-full flex items-center justify-center gap-2"><IoSaveOutline size={20} /> Guardar producto</button>
        
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