'use client';

import { useState, useEffect, useRef } from 'react';
import { createSection, updateSection, uploadPageImage, getAllCategories, getAllTags, getPaginatedProductsWithImages } from '@/actions';
import { IoCloseOutline, IoCloudUploadOutline, IoImageOutline, IoArrowUpOutline, IoArrowDownOutline, IoSearchOutline } from 'react-icons/io5';
import Image from 'next/image';
import { showErrorToast } from '@/utils/toast';
import clsx from 'clsx';
import { Product } from '@/interfaces';

interface PageSection {
  id: string;
  type: 'HERO' | 'BANNER' | 'TEXT' | 'IMAGE' | 'FEATURES' | 'GALLERY' | 'CTA' | 'MAP' | 'SLIDER' | 'CAROUSEL';
  position: number;
  enabled: boolean;
  content: Record<string, unknown>;
  config?: Record<string, unknown> | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pageId: string;
  editingSection?: PageSection;
}

const SECTION_TYPES: Array<{ value: PageSection['type']; label: string }> = [
  { value: 'HERO', label: 'Hero' },
  { value: 'BANNER', label: 'Banner' },
  { value: 'TEXT', label: 'Texto' },
  { value: 'IMAGE', label: 'Imagen' },
  { value: 'FEATURES', label: 'Características' },
  { value: 'GALLERY', label: 'Galería' },
  { value: 'CTA', label: 'Llamado a la Acción' },
  { value: 'MAP', label: 'Mapa' },
  { value: 'SLIDER', label: 'Slider' },
  { value: 'CAROUSEL', label: 'Carousel' },
];

// Configuración de campos por tipo de sección
const SECTION_FIELDS: Record<PageSection['type'], Array<{ key: string; label: string; type: 'text' | 'textarea' | 'url' | 'number' | 'color' }>> = {
  HERO: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
    { key: 'image', label: 'URL de Imagen', type: 'url' },
    { key: 'buttonText', label: 'Texto del Botón', type: 'text' },
    { key: 'buttonLink', label: 'Enlace del Botón', type: 'url' },
  ],
  BANNER: [
    { key: 'text', label: 'Texto', type: 'text' },
    { key: 'link', label: 'Enlace', type: 'url' },
    { key: 'backgroundColor', label: 'Color de Fondo', type: 'color' },
    { key: 'textColor', label: 'Color del Texto', type: 'color' },
  ],
  TEXT: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'content', label: 'Contenido', type: 'textarea' },
  ],
  IMAGE: [
    { key: 'image', label: 'URL de Imagen', type: 'url' },
    { key: 'alt', label: 'Texto Alternativo', type: 'text' },
    { key: 'caption', label: 'Descripción', type: 'text' },
  ],
  FEATURES: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'features', label: 'Características (JSON array)', type: 'textarea' },
  ],
  GALLERY: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'images', label: 'URLs de Imágenes (JSON array)', type: 'textarea' },
  ],
  CTA: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'buttonText', label: 'Texto del Botón', type: 'text' },
    { key: 'buttonLink', label: 'Enlace del Botón', type: 'url' },
  ],
  MAP: [
    { key: 'title', label: 'Título (opcional)', type: 'text' },
    { key: 'address', label: 'Dirección (opcional, usa la de la empresa si está vacío)', type: 'textarea' },
    { key: 'width', label: 'Ancho (ej: 100%, 800px)', type: 'text' },
    { key: 'height', label: 'Alto (ej: 400px, 600px)', type: 'text' },
  ],
  SLIDER: [
    { key: 'images', label: 'Imágenes del Slider', type: 'textarea' },
  ],
  CAROUSEL: [
    { key: 'title', label: 'Título', type: 'text' },
  ],
};

export const SectionFormModal = ({ isOpen, onClose, onSuccess, pageId, editingSection }: Props) => {
  const [formData, setFormData] = useState<{
    type: PageSection['type'];
    enabled: boolean;
    content: Record<string, string>;
    config?: Record<string, string>;
  }>({
    type: 'TEXT' as PageSection['type'],
    enabled: true,
    content: {},
    config: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'upload'>('url');
  const [galleryUploadMode, setGalleryUploadMode] = useState<'url' | 'upload'>('url');
  const [sliderUploadMode, setSliderUploadMode] = useState<'url' | 'upload'>('url');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingSlider, setUploadingSlider] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const sliderFileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para CAROUSEL
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  useEffect(() => {
    if (editingSection) {
      const content = { ...editingSection.content };
      // Convertir arrays a JSON strings para los campos que lo requieren
      if (editingSection.type === 'FEATURES' && Array.isArray(content.features)) {
        content.features = JSON.stringify(content.features);
      }
      if (editingSection.type === 'GALLERY' && Array.isArray(content.images)) {
        // Convertir array a string separado por comas para mejor UX
        content.images = (content.images as string[]).join(', ');
      }
      if (editingSection.type === 'SLIDER' && Array.isArray(content.images)) {
        // Para SLIDER, convertir a formato de objetos con url, link, openInNewTab
        const sliderImages = content.images.map((item) => {
          if (typeof item === 'string') {
            return { url: item };
          } else if (typeof item === 'object' && item !== null) {
            const img = item as Record<string, unknown>;
            return {
              url: (img.url as string) || '',
              link: img.link as string | undefined,
              openInNewTab: img.openInNewTab === true || img.openInNewTab === 'true',
            };
          }
          return { url: '' };
        }).filter(img => img.url);
        content.images = JSON.stringify(sliderImages);
      }
      // Asegurar valores por defecto para colores en BANNER
      if (editingSection.type === 'BANNER') {
        if (!content.backgroundColor) content.backgroundColor = '#3B82F6';
        if (!content.textColor) content.textColor = '#FFFFFF';
      }
      
      // Inicializar config si existe, con valores por defecto para SLIDER
      let config: Record<string, string> = {};
      if (editingSection.config) {
        const rawConfig = editingSection.config as Record<string, unknown>;
        // Convertir todos los valores a string para el formulario
        config = Object.entries(rawConfig).reduce((acc, [key, value]) => {
          if (value !== null && value !== undefined) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>);
      } else if (editingSection.type === 'SLIDER') {
        // Si es SLIDER y no hay config, usar valores por defecto
        config = { width: '100%', height: '400px', transitionTime: '5' };
      } else if (editingSection.type === 'CAROUSEL') {
        // Si es CAROUSEL y no hay config, usar valores por defecto
        config = { limit: '20' };
      }
      
      setFormData({
        type: editingSection.type,
        enabled: editingSection.enabled,
        content: content as Record<string, string>,
        config,
      });
      
      // Establecer el modo de imagen según si ya hay una imagen
      if ((editingSection.type === 'HERO' || editingSection.type === 'IMAGE') && content.image) {
        setImageUploadMode('url');
      }
      // Establecer el modo de galería según si ya hay imágenes
      if (editingSection.type === 'GALLERY' && content.images) {
        setGalleryUploadMode('url');
      }
      // Establecer el modo de slider según si ya hay imágenes
      if (editingSection.type === 'SLIDER' && content.images) {
        setSliderUploadMode('url');
      }
      // Inicializar datos del carousel
      if (editingSection.type === 'CAROUSEL') {
        setSelectedCategoryIds(Array.isArray(content.categoryIds) ? content.categoryIds as string[] : []);
        setSelectedTagIds(Array.isArray(content.tagIds) ? content.tagIds as string[] : []);
        const productIds = Array.isArray(content.productIds) ? content.productIds as string[] : [];
        setSelectedProductIds(productIds);
        setProductSearch((content.search as string) || '');
        if (content.featured !== undefined) {
          setFormData(prev => ({
            ...prev,
            content: { ...prev.content, featured: String(content.featured) },
          }));
        }
        // Cargar información de productos seleccionados si hay IDs
        if (productIds.length > 0) {
          const loadSelectedProducts = async () => {
            try {
              const result = await getPaginatedProductsWithImages({
                page: 1,
                take: 100,
              });
              const filtered = result.products.filter(p => productIds.includes(p.id));
              const transformed = filtered.map(product => ({
                ...product,
                tags: product.tags?.map(tag => ({
                  id: tag.id,
                  name: tag.name,
                  createdAt: (tag as any).createdAt || new Date(),
                })) || [],
              }));
              setSelectedProducts(transformed);
            } catch (error) {
              console.error('Error al cargar productos seleccionados:', error);
            }
          };
          loadSelectedProducts();
        }
      }
    } else {
      setFormData({
        type: 'TEXT',
        config: {},
        enabled: true,
        content: {},
      });
      setImageUploadMode('url');
      setGalleryUploadMode('url');
      setSliderUploadMode('url');
      // Resetear estados del carousel
      setSelectedCategoryIds([]);
      setSelectedTagIds([]);
      setSelectedProductIds([]);
      setSelectedProducts([]);
      setProductSearch('');
      setSearchedProducts([]);
    }
  }, [editingSection, isOpen]);

  // Cargar categorías y tags cuando se abre el modal y el tipo es CAROUSEL
  useEffect(() => {
    if (isOpen && formData.type === 'CAROUSEL') {
      const loadData = async () => {
        const [categoriesResult, tagsResult] = await Promise.all([
          getAllCategories(),
          getAllTags(),
        ]);
        
        if (categoriesResult.ok) {
          setCategories(categoriesResult.categories);
        }
        if (tagsResult.ok) {
          setTags(tagsResult.tags);
        }
      };
      
      loadData();
    }
  }, [isOpen, formData.type]);

  // Buscar productos cuando cambia el término de búsqueda
  useEffect(() => {
    if (formData.type === 'CAROUSEL' && productSearch && productSearch.length >= 2) {
      const searchProducts = async () => {
        setIsSearchingProducts(true);
        try {
          const result = await getPaginatedProductsWithImages({
            page: 1,
            take: 10,
            search: productSearch,
          });
          // Transformar productos para asegurar que los tags tengan createdAt
          const transformedProducts = result.products.map(product => ({
            ...product,
            tags: product.tags?.map(tag => ({
              id: tag.id,
              name: tag.name,
              createdAt: (tag as any).createdAt || new Date(),
            })) || [],
          }));
          setSearchedProducts(transformedProducts);
        } catch (error) {
          console.error('Error al buscar productos:', error);
        } finally {
          setIsSearchingProducts(false);
        }
      };

      const timeoutId = setTimeout(searchProducts, 500); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      setSearchedProducts([]);
    }
  }, [productSearch, formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar y parsear campos JSON si es necesario
      let processedContent: Record<string, unknown> = { ...formData.content };
      
      if (formData.type === 'FEATURES' && processedContent.features) {
        try {
          processedContent.features = JSON.parse(processedContent.features as string);
        } catch {
          setError('El campo "Características" debe ser un JSON válido');
          setLoading(false);
          return;
        }
      }

      if (formData.type === 'GALLERY' && processedContent.images) {
        try {
          // Intentar parsear como JSON primero
          processedContent.images = JSON.parse(processedContent.images as string);
        } catch {
          // Si no es JSON válido, intentar como URLs separadas por coma
          const urlsString = processedContent.images as string;
          const urlsArray: string[] = urlsString
            .split(',')
            .map(url => url.trim())
            .filter(Boolean);
          
          if (urlsArray.length === 0) {
            setError('Debes ingresar al menos una URL de imagen');
            setLoading(false);
            return;
          }
          
          processedContent.images = urlsArray as unknown;
        }
      }

      if (formData.type === 'SLIDER' && processedContent.images) {
        try {
          // Para SLIDER, parsear y normalizar a formato de objetos
          const parsed = JSON.parse(processedContent.images as string);
          if (!Array.isArray(parsed)) {
            throw new Error('Debe ser un array');
          }
          if (parsed.length === 0) {
            setError('Debes ingresar al menos una imagen');
            setLoading(false);
            return;
          }
          // Normalizar a formato de objetos con url, link, openInNewTab
          processedContent.images = parsed.map((item) => {
            if (typeof item === 'string') {
              return { url: item };
            } else if (typeof item === 'object' && item !== null) {
              const img = item as Record<string, unknown>;
              return {
                url: (img.url as string) || '',
                link: img.link as string | undefined,
                openInNewTab: img.openInNewTab === true || img.openInNewTab === 'true',
              };
            }
            return { url: '' };
          }).filter(img => img.url) as unknown;
        } catch {
          setError('El campo "Imágenes del Slider" debe ser un array JSON válido');
          setLoading(false);
          return;
        }
      }

      // Preparar contenido para CAROUSEL
      if (formData.type === 'CAROUSEL') {
        const carouselContent: Record<string, unknown> = {
          title: formData.content.title || '',
        };
        
        if (selectedProductIds.length > 0) {
          carouselContent.productIds = selectedProductIds;
        }
        if (productSearch) {
          carouselContent.search = productSearch;
        }
        if (selectedCategoryIds.length > 0) {
          carouselContent.categoryIds = selectedCategoryIds;
        }
        if (selectedTagIds.length > 0) {
          carouselContent.tagIds = selectedTagIds;
        }
        if (formData.content.featured === 'true') {
          carouselContent.featured = true;
        }
        
        processedContent = carouselContent;
      }

      // Preparar config para SLIDER (ya no necesita link y openInNewTab globales)
      let processedConfig: Record<string, unknown> | undefined = undefined;
      if (formData.type === 'SLIDER' && formData.config) {
        processedConfig = {
          width: formData.config.width || '100%',
          height: formData.config.height || '400px',
          transitionTime: formData.config.transitionTime || '5',
        };
      }
      
      // Preparar config para CAROUSEL
      if (formData.type === 'CAROUSEL' && formData.config) {
        processedConfig = {
          limit: formData.config.limit ? Number(formData.config.limit) : 20,
        };
      }

      if (editingSection) {
        const result = await updateSection({
          sectionId: editingSection.id,
          type: formData.type,
          content: processedContent,
          config: processedConfig,
          enabled: formData.enabled,
        });
        
        if (result.ok) {
          onSuccess();
        } else {
          setError(result.message || 'Error al actualizar la sección');
        }
      } else {
        const result = await createSection({
          pageId,
          type: formData.type,
          position: 0, // Se calculará automáticamente
          content: processedContent,
          config: processedConfig,
          enabled: formData.enabled,
        });
        
        if (result.ok) {
          onSuccess();
        } else {
          setError(result.message || 'Error al crear la sección');
        }
      }
    } catch (err) {
      setError('Error inesperado');
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        type: 'TEXT' as PageSection['type'],
        enabled: true,
        content: {},
        config: {},
      });
      setError(null);
      setImageUploadMode('url');
      setGalleryUploadMode('url');
      setSliderUploadMode('url');
      onClose();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showErrorToast('El archivo debe ser una imagen');
      return;
    }

    setUploadingImage(true);
    try {
      const result = await uploadPageImage(file);
      if (result.ok && result.url) {
        setFormData({
          ...formData,
          content: { ...formData.content, image: result.url },
        });
        setImageUploadMode('url');
      } else {
        showErrorToast(result.message || 'Error al subir la imagen');
      }
    } catch (err) {
      showErrorToast('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleGalleryImagesUpload = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      showErrorToast('Debes seleccionar al menos una imagen');
      return;
    }

    // Validar tamaño de archivos antes de subir (máximo 5MB por imagen)
    const maxSizePerImage = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = imageFiles.filter(file => file.size > maxSizePerImage);
    if (oversizedFiles.length > 0) {
      showErrorToast(`Algunas imágenes exceden el tamaño máximo de 5MB por imagen`);
      return;
    }

    setUploadingGallery(true);
    try {
      // Subir imágenes de forma secuencial para evitar problemas de tamaño
      const uploadedUrls: string[] = [];
      
      for (const file of imageFiles) {
        const result = await uploadPageImage(file);
        if (result.ok && result.url) {
          uploadedUrls.push(result.url);
        } else {
          showErrorToast(`Error al subir ${file.name}: ${result.message || 'Error desconocido'}`);
        }
      }
      
      if (uploadedUrls.length === 0) {
        showErrorToast('No se pudieron subir las imágenes');
        return;
      }

      // Obtener las URLs existentes
      const currentImages = formData.content.images || '';
      let existingUrls: string[] = [];
      
      if (currentImages) {
        // Intentar parsear como JSON primero
        try {
          existingUrls = JSON.parse(currentImages);
        } catch {
          // Si no es JSON, intentar como URLs separadas por coma
          existingUrls = currentImages.split(',').map(url => url.trim()).filter(Boolean);
        }
      }

      // Combinar URLs existentes con las nuevas
      const allUrls = [...existingUrls, ...uploadedUrls];
      
      setFormData({
        ...formData,
        content: { ...formData.content, images: JSON.stringify(allUrls) },
      });
      
      setGalleryUploadMode('url');
      
      if (uploadedUrls.length < imageFiles.length) {
        showErrorToast(`Se subieron ${uploadedUrls.length} de ${imageFiles.length} imágenes`);
      }
    } catch (err) {
      showErrorToast('Error al subir las imágenes');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleGalleryImagesUpload(files);
    }
  };

  const handleSliderImagesUpload = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      showErrorToast('Debes seleccionar al menos una imagen');
      return;
    }

    // Validar tamaño de archivos antes de subir (máximo 5MB por imagen)
    const maxSizePerImage = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = imageFiles.filter(file => file.size > maxSizePerImage);
    if (oversizedFiles.length > 0) {
      showErrorToast(`Algunas imágenes exceden el tamaño máximo de 5MB por imagen`);
      return;
    }

    setUploadingSlider(true);
    try {
      // Subir imágenes de forma secuencial para evitar problemas de tamaño
      const uploadedUrls: string[] = [];
      
      for (const file of imageFiles) {
        const result = await uploadPageImage(file);
        if (result.ok && result.url) {
          uploadedUrls.push(result.url);
        } else {
          showErrorToast(`Error al subir ${file.name}: ${result.message || 'Error desconocido'}`);
        }
      }
      
      if (uploadedUrls.length === 0) {
        showErrorToast('No se pudieron subir las imágenes');
        return;
      }

      // Obtener las imágenes existentes
      const currentImages = formData.content.images || '';
      const existingImages = parseSliderImages(currentImages);
      
      // Convertir nuevas URLs a formato de objetos
      const newImages = uploadedUrls.map(url => ({ url }));
      
      // Combinar imágenes existentes con las nuevas
      const allImages = [...existingImages, ...newImages];
      
      setFormData({
        ...formData,
        content: { ...formData.content, images: JSON.stringify(allImages) },
      });
      
      setSliderUploadMode('url');
      
      if (uploadedUrls.length < imageFiles.length) {
        showErrorToast(`Se subieron ${uploadedUrls.length} de ${imageFiles.length} imágenes`);
      }
    } catch (err) {
      showErrorToast('Error al subir las imágenes');
    } finally {
      setUploadingSlider(false);
    }
  };

  const handleSliderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleSliderImagesUpload(files);
    }
  };

  // Función auxiliar para parsear imágenes del slider (soporta formato antiguo y nuevo)
  const parseSliderImages = (imagesValue: string): Array<{ url: string; link?: string; openInNewTab?: boolean }> => {
    if (!imagesValue) return [];
    try {
      const parsed = JSON.parse(imagesValue);
      if (!Array.isArray(parsed)) return [];
      
      return parsed.map((item) => {
        if (typeof item === 'string') {
          // Formato antiguo: solo URL
          return { url: item };
        } else if (typeof item === 'object' && item !== null) {
          // Formato nuevo: objeto con url, link, openInNewTab
          const img = item as Record<string, unknown>;
          return {
            url: (img.url as string) || '',
            link: img.link as string | undefined,
            openInNewTab: img.openInNewTab === true || img.openInNewTab === 'true',
          };
        }
        return { url: '' };
      }).filter(img => img.url);
    } catch {
      return [];
    }
  };

  const moveSliderImage = (index: number, direction: 'up' | 'down') => {
    const currentImages = formData.content.images || '';
    const imageData = parseSliderImages(currentImages);

    if (direction === 'up' && index > 0) {
      [imageData[index - 1], imageData[index]] = [imageData[index], imageData[index - 1]];
    } else if (direction === 'down' && index < imageData.length - 1) {
      [imageData[index], imageData[index + 1]] = [imageData[index + 1], imageData[index]];
    }

    setFormData({
      ...formData,
      content: { ...formData.content, images: JSON.stringify(imageData) },
    });
  };

  const updateSliderImageLink = (index: number, link: string) => {
    const currentImages = formData.content.images || '';
    const imageData = parseSliderImages(currentImages);
    
    if (imageData[index]) {
      imageData[index].link = link || undefined;
      setFormData({
        ...formData,
        content: { ...formData.content, images: JSON.stringify(imageData) },
      });
    }
  };

  const updateSliderImageOpenInNewTab = (index: number, openInNewTab: boolean) => {
    const currentImages = formData.content.images || '';
    const imageData = parseSliderImages(currentImages);
    
    if (imageData[index]) {
      imageData[index].openInNewTab = openInNewTab;
      setFormData({
        ...formData,
        content: { ...formData.content, images: JSON.stringify(imageData) },
      });
    }
  };

  const currentFields = SECTION_FIELDS[formData.type] || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingSection ? 'Editar Sección' : 'Nueva Sección'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Sección
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as PageSection['type'];
                  setFormData({
                    ...formData,
                    type: newType,
                    content: {}, // Limpiar contenido al cambiar tipo
                    config: newType === 'SLIDER' ? { width: '100%', height: '400px', transitionTime: '5' } : newType === 'CAROUSEL' ? { limit: '20' } : {}, // Inicializar config
                  });
                  setImageUploadMode('url'); // Resetear modo de imagen al cambiar tipo
                  setGalleryUploadMode('url'); // Resetear modo de galería al cambiar tipo
                  setSliderUploadMode('url'); // Resetear modo de slider al cambiar tipo
                  // Resetear estados del carousel
                  if (newType !== 'CAROUSEL') {
                    setSelectedCategoryIds([]);
                    setSelectedTagIds([]);
                    setSelectedProductIds([]);
                    setProductSearch('');
                    setSearchedProducts([]);
                  }
                }}
                disabled={loading || !!editingSection}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                {SECTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {editingSection && (
                <p className="mt-1 text-xs text-gray-500">
                  No se puede cambiar el tipo de una sección existente
                </p>
              )}
            </div>

            {currentFields.map((field) => {
              const value = formData.content[field.key] || (field.type === 'color' ? '#3B82F6' : '');
              const isImageField = (formData.type === 'HERO' || formData.type === 'IMAGE') && field.key === 'image';
              const isGalleryField = formData.type === 'GALLERY' && field.key === 'images';
              const isSliderField = formData.type === 'SLIDER' && field.key === 'images';

              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  
                  {isImageField ? (
                    <div className="space-y-3">
                      {/* Selector de modo */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setImageUploadMode('url')}
                          disabled={loading || uploadingImage}
                          className={clsx(
                            'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                            imageUploadMode === 'url'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <IoImageOutline className="inline mr-2" size={16} />
                          Usar URL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImageUploadMode('upload');
                            fileInputRef.current?.click();
                          }}
                          disabled={loading || uploadingImage}
                          className={clsx(
                            'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                            imageUploadMode === 'upload'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <IoCloudUploadOutline className="inline mr-2" size={16} />
                          Subir Imagen
                        </button>
                      </div>

                      {/* Input de URL */}
                      {imageUploadMode === 'url' && (
                        <div>
                          <input
                            type="url"
                            value={value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                content: { ...formData.content, [field.key]: e.target.value },
                              })
                            }
                            disabled={loading || uploadingImage}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="https://ejemplo.com/imagen.jpg"
                          />
                        </div>
                      )}

                      {/* Input de archivo */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={loading || uploadingImage}
                        className="hidden"
                      />

                      {/* Preview de imagen */}
                      {value && (
                        <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                          <Image
                            src={value}
                            alt="Preview"
                            fill
                            className="object-contain"
                            onError={() => {
                              // Si la imagen no se puede cargar, no hacer nada
                            }}
                          />
                        </div>
                      )}

                      {uploadingImage && (
                        <p className="text-sm text-blue-600">Subiendo imagen...</p>
                      )}
                    </div>
                  ) : isGalleryField ? (
                    <div className="space-y-3">
                      {/* Selector de modo */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setGalleryUploadMode('url')}
                          disabled={loading || uploadingGallery}
                          className={clsx(
                            'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                            galleryUploadMode === 'url'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <IoImageOutline className="inline mr-2" size={16} />
                          Usar URLs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryUploadMode('upload');
                            galleryFileInputRef.current?.click();
                          }}
                          disabled={loading || uploadingGallery}
                          className={clsx(
                            'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                            galleryUploadMode === 'upload'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <IoCloudUploadOutline className="inline mr-2" size={16} />
                          Subir Imágenes
                        </button>
                      </div>

                      {/* Input de URLs separadas por coma */}
                      {galleryUploadMode === 'url' && (
                        <div>
                          <textarea
                            value={value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                content: { ...formData.content, [field.key]: e.target.value },
                              })
                            }
                            disabled={loading || uploadingGallery}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg, https://ejemplo.com/imagen3.jpg"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Ingresa las URLs separadas por coma
                          </p>
                        </div>
                      )}

                      {/* Input de archivos múltiples */}
                      <input
                        ref={galleryFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryFileChange}
                        disabled={loading || uploadingGallery}
                        className="hidden"
                      />

                      {/* Preview de imágenes */}
                      {value && (() => {
                        let imageUrls: string[] = [];
                        try {
                          imageUrls = JSON.parse(value);
                        } catch {
                          // Si no es JSON, intentar como URLs separadas por coma
                          imageUrls = value.split(',').map(url => url.trim()).filter(Boolean);
                        }
                        
                        return imageUrls.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {imageUrls.map((url, index) => (
                              <div
                                key={index}
                                className="relative w-full aspect-square border border-gray-300 rounded-md overflow-hidden bg-gray-50"
                              >
                                <Image
                                  src={url}
                                  alt={`Preview ${index + 1}`}
                                  fill
                                  className="object-cover"
                                  onError={() => {
                                    // Si la imagen no se puede cargar, no hacer nada
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedUrls = imageUrls.filter((_, i) => i !== index);
                                    setFormData({
                                      ...formData,
                                      content: {
                                        ...formData.content,
                                        [field.key]: updatedUrls.length > 0 ? JSON.stringify(updatedUrls) : '',
                                      },
                                    });
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  title="Eliminar imagen"
                                >
                                  <IoCloseOutline size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })()}

                      {uploadingGallery && (
                        <p className="text-sm text-blue-600">Subiendo imágenes...</p>
                      )}
                    </div>
                  ) : isSliderField ? (
                    <div className="space-y-3">
                      {/* Selector de modo */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSliderUploadMode('url')}
                          disabled={loading || uploadingSlider}
                          className={clsx(
                            'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                            sliderUploadMode === 'url'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <IoImageOutline className="inline mr-2" size={16} />
                          Usar URLs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSliderUploadMode('upload');
                            sliderFileInputRef.current?.click();
                          }}
                          disabled={loading || uploadingSlider}
                          className={clsx(
                            'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                            sliderUploadMode === 'upload'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <IoCloudUploadOutline className="inline mr-2" size={16} />
                          Subir Imágenes
                        </button>
                      </div>

                      {/* Input de URLs separadas por coma */}
                      {sliderUploadMode === 'url' && (
                        <div>
                          <textarea
                            value={value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                content: { ...formData.content, [field.key]: e.target.value },
                              })
                            }
                            disabled={loading || uploadingSlider}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder='["https://ejemplo.com/imagen1.jpg", "https://ejemplo.com/imagen2.jpg"]'
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Ingresa las URLs como un array JSON. Puedes reordenar las imágenes usando los botones de arriba/abajo en el preview.
                          </p>
                        </div>
                      )}

                      {/* Input de archivos múltiples */}
                      <input
                        ref={sliderFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSliderFileChange}
                        disabled={loading || uploadingSlider}
                        className="hidden"
                      />

                      {/* Preview de imágenes con controles de orden y configuración de enlaces */}
                      {(() => {
                        const imageData = parseSliderImages(value);
                        
                        return imageData.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-xs text-gray-600 font-medium mb-1">
                              Arrastra o usa los botones para reordenar las imágenes. Configura un enlace para cada imagen:
                            </p>
                            {imageData.map((img, index) => (
                              <div
                                key={index}
                                className="relative p-3 border border-gray-300 rounded-md bg-gray-50 space-y-2"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex flex-col gap-1 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => moveSliderImage(index, 'up')}
                                      disabled={index === 0 || loading}
                                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Mover arriba"
                                    >
                                      <IoArrowUpOutline size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveSliderImage(index, 'down')}
                                      disabled={index === imageData.length - 1 || loading}
                                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Mover abajo"
                                    >
                                      <IoArrowDownOutline size={16} />
                                    </button>
                                  </div>
                                  <div className="relative flex-1 h-24 border border-gray-300 rounded-md overflow-hidden bg-white">
                                    <Image
                                      src={img.url}
                                      alt={`Slider ${index + 1}`}
                                      fill
                                      className="object-cover"
                                      onError={() => {
                                        // Si la imagen no se puede cargar, no hacer nada
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-start gap-1 pt-1">
                                    <span className="text-xs text-gray-500 font-medium">
                                      #{index + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedImages = imageData.filter((_, i) => i !== index);
                                        setFormData({
                                          ...formData,
                                          content: {
                                            ...formData.content,
                                            [field.key]: updatedImages.length > 0 ? JSON.stringify(updatedImages) : '',
                                          },
                                        });
                                      }}
                                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                      title="Eliminar imagen"
                                    >
                                      <IoCloseOutline size={18} />
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-2 pl-8">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Enlace (opcional)
                                    </label>
                                    <input
                                      type="url"
                                      value={img.link || ''}
                                      onChange={(e) => updateSliderImageLink(index, e.target.value)}
                                      disabled={loading}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                      placeholder="https://ejemplo.com"
                                    />
                                  </div>
                                  {img.link && (
                                    <div className="flex items-center gap-2">
                                      <label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={img.openInNewTab || false}
                                          onChange={(e) => updateSliderImageOpenInNewTab(index, e.target.checked)}
                                          disabled={loading}
                                          className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-gray-700">Abrir en nueva pestaña</span>
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })()}

                      {uploadingSlider && (
                        <p className="text-sm text-blue-600">Subiendo imágenes...</p>
                      )}
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: { ...formData.content, [field.key]: e.target.value },
                        })
                      }
                      disabled={loading}
                      rows={field.key === 'content' || field.key === 'subtitle' || field.key === 'description' ? 4 : 2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder={`Ingrese ${field.label.toLowerCase()}`}
                    />
                  ) : field.type === 'color' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            content: { ...formData.content, [field.key]: e.target.value },
                          })
                        }
                        disabled={loading}
                        className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            content: { ...formData.content, [field.key]: e.target.value },
                          })
                        }
                        disabled={loading}
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="#3B82F6"
                      />
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      value={value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: { ...formData.content, [field.key]: e.target.value },
                        })
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder={`Ingrese ${field.label.toLowerCase()}`}
                    />
                  )}
                  {field.key === 'features' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Formato JSON: ["item1", "item2", ...]
                    </p>
                  )}
                </div>
              );
            }            )}

            {/* Campos especiales para CAROUSEL */}
            {formData.type === 'CAROUSEL' && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Configuración de Productos</h3>
                
                {/* Búsqueda de productos por nombre/código */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar productos por nombre o código
                  </label>
                  <div className="relative">
                    <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Buscar productos..."
                    />
                  </div>
                  {isSearchingProducts && (
                    <p className="mt-1 text-xs text-blue-600">Buscando productos...</p>
                  )}
                  {searchedProducts.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                      {searchedProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                        >
                          <span className="text-sm text-gray-700">{product.title} {product.code && `(${product.code})`}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedProductIds.includes(product.id)) {
                                setSelectedProductIds([...selectedProductIds, product.id]);
                                setSelectedProducts([...selectedProducts, product]);
                              }
                            }}
                            disabled={selectedProductIds.includes(product.id) || loading}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {selectedProductIds.includes(product.id) ? 'Agregado' : 'Agregar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Productos seleccionados */}
                {selectedProductIds.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Productos seleccionados ({selectedProductIds.length})
                    </label>
                    <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                      {selectedProductIds.map((productId) => (
                        <div key={productId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">ID: {productId}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedProductIds(selectedProductIds.filter(id => id !== productId))}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <IoCloseOutline size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selección por categorías */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por categorías
                  </label>
                  <select
                    multiple
                    value={selectedCategoryIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedCategoryIds(selected);
                    }}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    size={Math.min(categories.length, 5)}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples categorías
                  </p>
                </div>

                {/* Selección por tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por tags
                  </label>
                  <select
                    multiple
                    value={selectedTagIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedTagIds(selected);
                    }}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    size={Math.min(tags.length, 5)}
                  >
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples tags
                  </p>
                </div>

                {/* Filtro por featured */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.content.featured === 'true'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: {
                            ...formData.content,
                            featured: String(e.target.checked),
                          },
                        })
                      }
                      disabled={loading}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Solo productos destacados</span>
                  </label>
                </div>

                <p className="text-xs text-gray-500 italic">
                  💡 Puedes usar una combinación de filtros. Si seleccionas productos específicos, esos tendrán prioridad.
                </p>
              </div>
            )}

            {/* Campos de configuración para CAROUSEL */}
            {formData.type === 'CAROUSEL' && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Configuración del Carousel</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Límite de productos
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.config?.limit || '20'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          limit: e.target.value,
                        },
                      })
                    }
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="20"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Número máximo de productos a mostrar en el carousel (1-50)
                  </p>
                </div>
              </div>
            )}

            {/* Campos de configuración para SLIDER */}
            {formData.type === 'SLIDER' && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Configuración del Slider</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ancho de las Imágenes
                  </label>
                  <input
                    type="text"
                    value={formData.config?.width || '100%'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          width: e.target.value,
                        },
                      })
                    }
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="100%"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ejemplos: 100%, 800px, 50vw
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alto de las Imágenes
                  </label>
                  <input
                    type="text"
                    value={formData.config?.height || '400px'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          height: e.target.value,
                        },
                      })
                    }
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="400px"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ejemplos: 400px, 600px, 50vh
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo de Transición (segundos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.config?.transitionTime || '5'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          transitionTime: e.target.value,
                        },
                      })
                    }
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="5"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Tiempo en segundos entre cada transición automática del slider
                  </p>
                </div>
                <p className="text-xs text-gray-500 italic">
                  💡 Puedes configurar un enlace individual para cada imagen en el preview de arriba
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Habilitada</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : editingSection ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
