'use client'

import { useEffect, useCallback, useMemo, useState } from 'react'
import clsx from "clsx";
import { ProductAttributeWithDetails } from '@/interfaces'

interface Props {
  attribute: ProductAttributeWithDetails['attribute'];
  attributeValues?: ProductAttributeWithDetails[];
  selectedValue?: string | number | string[];
  onValueChanged: (value: string | number | string[]) => void;
}

export const AttributeSelector = ({ 
  attribute, 
  attributeValues = [], 
  selectedValue, 
  onValueChanged 
}: Props) => {
  
  // Obtener los valores disponibles para este atributo
  const availableValues = useMemo(() => {
    return attributeValues
      .filter(av => av.attributeValue)
      .map(av => av.attributeValue!.value);
  }, [attributeValues]);

  // Normalizar selectedValue para atributos select (asegurarse de que nunca sea array)
  const normalizedSelectedValue = useMemo(() => {
    if (attribute.type === 'select') {
      // Si es select y selectedValue es un array, tomar el primer elemento o undefined
      if (Array.isArray(selectedValue)) {
        return selectedValue.length > 0 ? selectedValue[0] : undefined;
      }
      return selectedValue;
    }
    return selectedValue;
  }, [attribute.type, selectedValue]);

  // Estado local para controlar la selección visual inmediatamente (solo para select)
  const [localSelectedValue, setLocalSelectedValue] = useState<string | number | undefined>(
    attribute.type === 'select' && !Array.isArray(normalizedSelectedValue) 
      ? normalizedSelectedValue 
      : undefined
  );

  // Sincronizar estado local con el prop cuando cambia
  useEffect(() => {
    if (attribute.type === 'select') {
      const normalized = Array.isArray(normalizedSelectedValue) 
        ? undefined 
        : normalizedSelectedValue;
      setLocalSelectedValue(normalized);
    }
  }, [attribute.type, normalizedSelectedValue]);

  // Auto-seleccionar si solo hay una opción y no hay valor seleccionado
  useEffect(() => {
    if (attribute.type === 'select' || attribute.type === 'multiselect') {
      if (availableValues.length === 1) {
        const singleValue = availableValues[0];
        
        // Si es select y no hay valor seleccionado, seleccionar automáticamente
        if (attribute.type === 'select') {
          const currentValue = Array.isArray(normalizedSelectedValue) 
            ? undefined 
            : normalizedSelectedValue;
          if (currentValue !== singleValue) {
            onValueChanged(singleValue);
          }
        }
        // Si es multiselect y no hay valores seleccionados, seleccionar automáticamente
        if (attribute.type === 'multiselect') {
          const currentValues = Array.isArray(normalizedSelectedValue) ? normalizedSelectedValue : [];
          if (currentValues.length === 0 || !currentValues.includes(singleValue)) {
            onValueChanged([singleValue]);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attribute.type, availableValues.length]);

  const handleChange = useCallback((value: string) => {
    if (attribute.type === 'multiselect') {
      // Para multiselect, toggle el valor (agregar o quitar)
      const currentValues = Array.isArray(normalizedSelectedValue) ? normalizedSelectedValue : [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      onValueChanged(newValues);
    } else if (attribute.type === 'select') {
      // Para select, SIEMPRE reemplazar el valor anterior (solo puede haber uno)
      // Actualizar estado local inmediatamente para feedback visual instantáneo
      setLocalSelectedValue(value);
      
      // CRÍTICO: Si el valor clickeado es el mismo que ya está seleccionado,
      // no hacer nada (evitar re-renders innecesarios)
      // Si es diferente, reemplazar COMPLETAMENTE el valor anterior
      const currentValue = Array.isArray(normalizedSelectedValue) 
        ? undefined 
        : normalizedSelectedValue;
      
      if (currentValue !== value) {
        // Asegurarse de que nunca se pase un array - siempre pasar string
        onValueChanged(value);
      }
    } else {
      onValueChanged(value);
    }
  }, [attribute.type, normalizedSelectedValue, onValueChanged]);

  if (attribute.type === 'select' || attribute.type === 'multiselect') {
    if (availableValues.length === 0) return null;

    return (
      <div className="my-5">
        <h3 className="font-bold mb-4">{attribute.name}</h3>
        <div className="flex flex-wrap gap-2">
          {availableValues.map((value) => {
            // Determinar si el valor está seleccionado
            let isSelected = false;
            if (attribute.type === 'multiselect') {
              // Para multiselect, normalizedSelectedValue debe ser un array
              isSelected = Array.isArray(normalizedSelectedValue) && normalizedSelectedValue.includes(value);
            } else if (attribute.type === 'select') {
              // Para select, usar el estado local para feedback visual inmediato
              // Esto previene que múltiples botones aparezcan seleccionados simultáneamente
              isSelected = localSelectedValue === value;
            }

            return (
              <button
                key={value}
                type="button"
                onClick={() => handleChange(value)}
                className={clsx(
                  'px-4 py-2 rounded-md border transition-colors',
                  {
                    'bg-blue-500 text-white border-blue-500': isSelected,
                    'bg-white text-gray-700 border-gray-300 hover:border-blue-300': !isSelected,
                  }
                )}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (attribute.type === 'text') {
    return (
      <div className="my-5">
        <label className="block font-bold mb-2">{attribute.name}</label>
        <input
          type="text"
          value={selectedValue as string || ''}
          onChange={(e) => onValueChanged(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder={`Ingrese ${attribute.name.toLowerCase()}`}
        />
      </div>
    );
  }

  if (attribute.type === 'number') {
    return (
      <div className="my-5">
        <label className="block font-bold mb-2">{attribute.name}</label>
        <input
          type="number"
          value={selectedValue as number || ''}
          onChange={(e) => onValueChanged(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder={`Ingrese ${attribute.name.toLowerCase()}`}
        />
      </div>
    );
  }

  return null;
}

