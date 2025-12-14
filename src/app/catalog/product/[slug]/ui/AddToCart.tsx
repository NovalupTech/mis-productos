'use client'

import { useState, useMemo, useEffect } from 'react'
import { QuantitySelector, AttributeSelector } from '@/components'
import { Product, ProductInCart } from '@/interfaces'
import { useCartStore } from '@/store/cart/cart-store'

interface Props {
    product: Product
}

export const AddToCart = ({product}: Props) => {

  const addProductToCart = useCartStore(state => state.addProductToCart)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string | number | string[]>>({})
  const [selectedCount, setSelectedCount] = useState<number>(1)
  const [post, setPost] = useState(false)

  // Agrupar atributos por attributeId para el selector
  const attributesByType = useMemo(() => {
    if (!product.attributes) return {};
    
    const grouped: Record<string, typeof product.attributes> = {};
    product.attributes.forEach(attr => {
      const attrId = attr.attribute.id;
      if (!grouped[attrId]) {
        grouped[attrId] = [];
      }
      grouped[attrId].push(attr);
    });
    return grouped;
  }, [product.attributes]);

  // Obtener atributos requeridos (select/multiselect que necesitan selección)
  const requiredAttributes = useMemo(() => {
    return product.attributes?.filter(attr => 
      attr.attribute.type === 'select' || attr.attribute.type === 'multiselect'
    ) || [];
  }, [product.attributes]);

  const addToCart = () => {
    setPost(true)
    
    // Validar que todos los atributos requeridos estén seleccionados
    const missingAttributes = requiredAttributes.filter(attr => {
      const attrId = attr.attribute.id;
      const value = selectedAttributes[attrId];
      return !value || (Array.isArray(value) && value.length === 0);
    });

    if (missingAttributes.length > 0) {
      return;
    }

    const productCart: ProductInCart = {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        quantity: selectedCount,
        image: product.images[0],
        selectedAttributes: selectedAttributes as Record<string, string | number>
    }

    addProductToCart(productCart)
    setPost(false)
    setSelectedAttributes({})
    setSelectedCount(1)
  }

  const handleAttributeChange = (attributeId: string, value: string | number | string[]) => {
    // Encontrar el atributo para verificar su tipo
    const attribute = product.attributes?.find(attr => attr.attribute.id === attributeId)?.attribute;
    
    setSelectedAttributes(prev => {
      const newState = { ...prev };
      
      // Si es un atributo de tipo 'select', asegurarse de que el valor NUNCA sea un array
      if (attribute?.type === 'select') {
        // Si por alguna razón recibimos un array, tomar el primer elemento o string vacío
        if (Array.isArray(value)) {
          console.warn(`[AttributeSelector] Se recibió un array para atributo 'select' ${attributeId}. Normalizando a string.`);
          newState[attributeId] = value.length > 0 ? String(value[0]) : '';
        } else {
          // Asegurarse de que sea string o number, nunca array
          newState[attributeId] = value;
        }
      } else {
        // Para multiselect u otros tipos, guardar el valor tal cual
        newState[attributeId] = value;
      }
      
      return newState;
    });
  }

  // Efecto para limpiar arrays incorrectos en atributos select al montar
  useEffect(() => {
    if (!product.attributes) return;
    
    setSelectedAttributes(prev => {
      const newState = { ...prev };
      let hasChanges = false;
      
      product.attributes?.forEach(attr => {
        if (attr.attribute.type === 'select') {
          const attrId = attr.attribute.id;
          const currentValue = newState[attrId];
          
          // Si el valor es un array, normalizarlo a string
          if (Array.isArray(currentValue)) {
            console.warn(`[AddToCart] Se encontró un array en atributo 'select' ${attrId}. Normalizando.`);
            newState[attrId] = currentValue.length > 0 ? String(currentValue[0]) : '';
            hasChanges = true;
          }
        }
      });
      
      return hasChanges ? newState : prev;
    });
  }, [product.attributes]);

  return (
    <>
        {
            post && requiredAttributes.some(attr => {
              const attrId = attr.attribute.id;
              const value = selectedAttributes[attrId];
              return !value || (Array.isArray(value) && value.length === 0);
            }) && (
              <p className="text-red-500 fade-in font-bold pt-2">
                Por favor completa todos los campos requeridos!
              </p>
            )
        }
        
        {/* Selectores de atributos */}
        {product.attributes && Object.entries(attributesByType).map(([attrId, attrs]) => {
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

        {/* selector de cantidad */}
        <QuantitySelector quantity={selectedCount} onQuantityChanged={setSelectedCount} />

        {/* Boton de añadir al carrito */}
        <button onClick={addToCart} className="btn-primary my-5">Agregar al carrito</button>
    </>
  )
}
