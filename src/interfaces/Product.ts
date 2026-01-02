export interface Product {
  id: string;
  description: string;
  images: string[];
  inStock: number;
  price: number;
  slug: string;
  title: string;
  featured: boolean;
  code?: string | null;
  companyId: string;
  categoryId: string;
  category?: Category;
  company?: Company;
  tags?: Tag[];
  attributes?: ProductAttributeWithDetails[];
}

export interface ProductInCart {
  id: string;
  slug: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  categoryId: string; // Necesario para calcular descuentos
  tags?: Tag[]; // Necesario para calcular descuentos
  // Los atributos seleccionados (ej: tamaño, color) se manejan como atributos
  selectedAttributes?: Record<string, string | number>;
  // Información de descuento aplicado
  discount?: {
    id: string;
    name: string;
    discountAmount: number;
    finalPrice: number;
    badgeText: string;
  };
}

export interface ProductInOrder {
  id: string;
  quantity: number;
  image: string;
  title: string;
  slug: string;
  price: number;
  // Los atributos seleccionados en la orden
  selectedAttributes?: Record<string, string | number>;
}

export interface ProductImage {
  id: number;
  url: string;
  productId: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ProductAttributeWithDetails {
  id: string;
  productId: string;
  attributeId: string;
  attributeValueId?: string | null;
  valueText?: string | null;
  valueNumber?: number | null;
  attribute: {
    id: string;
    name: string;
    type: 'text' | 'number' | 'select' | 'multiselect';
    required: boolean;
    companyId: string;
  };
  attributeValue?: {
    id: string;
    value: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  companyId: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface Company {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  logo?: string | null;
}
