'use client'

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
  const availableValues = attributeValues
    .filter(av => av.attributeValue)
    .map(av => av.attributeValue!.value);

  const handleChange = (value: string) => {
    if (attribute.type === 'multiselect') {
      const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      onValueChanged(newValues);
    } else {
      onValueChanged(value);
    }
  };

  if (attribute.type === 'select' || attribute.type === 'multiselect') {
    if (availableValues.length === 0) return null;

    return (
      <div className="my-5">
        <h3 className="font-bold mb-4">{attribute.name}</h3>
        <div className="flex flex-wrap gap-2">
          {availableValues.map((value) => {
            const isSelected = attribute.type === 'multiselect'
              ? Array.isArray(selectedValue) && selectedValue.includes(value)
              : selectedValue === value;

            return (
              <button
                key={value}
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

