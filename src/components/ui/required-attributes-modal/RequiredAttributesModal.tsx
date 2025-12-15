'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Product, ProductInCart } from '@/interfaces';
import { AttributeSelector, QuantitySelector } from '@/components';
import { IoCloseOutline } from 'react-icons/io5';
import { useCartStore } from '@/store/cart/cart-store';

interface RequiredAttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onAddToCart: () => void;
}

export const RequiredAttributesModal = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
}: RequiredAttributesModalProps) => {
  const addProductToCart = useCartStore(state => state.addProductToCart);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string | number | string[]>>({});
  const [selectedCount, setSelectedCount] = useState<number>(1);
  const [error, setError] = useState(false);

  // Obtener solo los atributos obligatorios
  const requiredAttributes = useMemo(() => {
    if (!product.attributes) return [];
    return product.attributes.filter(attr => attr.attribute.required);
  }, [product.attributes]);

  // Agrupar atributos por attributeId
  const attributesByType = useMemo(() => {
    if (!requiredAttributes.length) return {};
    
    const grouped: Record<string, typeof requiredAttributes> = {};
    requiredAttributes.forEach(attr => {
      const attrId = attr.attribute.id;
      if (!grouped[attrId]) {
        grouped[attrId] = [];
      }
      grouped[attrId].push(attr);
    });
    return grouped;
  }, [requiredAttributes]);

  // Resetear cuando se abre/cierra el modal y prevenir scroll del body
  useEffect(() => {
    if (isOpen) {
      setSelectedAttributes({});
      setSelectedCount(1);
      setError(false);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar scroll del body cuando el modal se cierra
      document.body.style.overflow = 'unset';
    }

    // Cleanup: restaurar scroll al desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAttributeChange = (attributeId: string, value: string | number | string[]) => {
    setSelectedAttributes(prev => {
      const newState = { ...prev };
      
      // Encontrar el atributo para verificar su tipo
      const attribute = requiredAttributes.find(attr => attr.attribute.id === attributeId)?.attribute;
      
      if (attribute?.type === 'select') {
        if (Array.isArray(value)) {
          newState[attributeId] = value.length > 0 ? String(value[0]) : '';
        } else {
          newState[attributeId] = value;
        }
      } else {
        newState[attributeId] = value;
      }
      
      return newState;
    });
    setError(false);
  };

  const handleAddToCart = () => {
    // Validar que todos los atributos obligatorios estén seleccionados
    const missingAttributes = requiredAttributes.filter(attr => {
      const attrId = attr.attribute.id;
      const value = selectedAttributes[attrId];
      
      if (attr.attribute.type === 'select' || attr.attribute.type === 'multiselect') {
        return !value || (Array.isArray(value) && value.length === 0);
      }
      
      // Para text y number, verificar que tenga un valor válido
      if (attr.attribute.type === 'text') {
        return !value || String(value).trim() === '';
      }
      if (attr.attribute.type === 'number') {
        return value === undefined || value === null || Number(value) === 0;
      }
      
      return !value;
    });

    if (missingAttributes.length > 0) {
      setError(true);
      return;
    }

    // Crear el producto para el carrito
    const productCart: ProductInCart = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      quantity: selectedCount,
      image: product.images[0],
      selectedAttributes: selectedAttributes as Record<string, string | number>,
    };

    addProductToCart(productCart);
    onAddToCart();
    onClose();
  };

  if (!isOpen || typeof window === 'undefined') return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4" 
      style={{ zIndex: 9999, position: 'fixed' }}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ zIndex: 10000, position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Seleccionar opciones</h2>
            <p className="text-sm text-gray-600 mt-1">{product.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 font-semibold">
                Por favor completa todos los campos obligatorios
              </p>
            </div>
          )}

          {/* Selectores de atributos obligatorios */}
          {Object.entries(attributesByType).map(([attrId, attrs]) => {
            const attribute = attrs[0].attribute;
            const selectedValue = selectedAttributes[attrId];
            
            return (
              <AttributeSelector
                key={attrId}
                attribute={attribute}
                attributeValues={attrs}
                selectedValue={selectedValue}
                onValueChanged={(value) => handleAttributeChange(attrId, value)}
              />
            );
          })}

          {/* Selector de cantidad */}
          <QuantitySelector quantity={selectedCount} onQuantityChanged={setSelectedCount} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddToCart}
            className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors font-semibold"
            style={{
              backgroundColor: 'var(--theme-secondary-color)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--theme-secondary-color)';
            }}
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizar el modal usando un portal directamente en el body
  return createPortal(modalContent, document.body);
};
