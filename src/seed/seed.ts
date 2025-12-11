import bcryptjs from 'bcryptjs';
import { countries, Country } from './seed-countries';

// -------------------------
// Interfaces para el seed
// -------------------------

interface SeedCompany {
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  domains: string[]; // Dominios asociados a la empresa
  categories: string[];
  attributes: SeedAttribute[];
  products: SeedProduct[];
}

interface SeedAttribute {
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  values?: string[]; // Para select y multiselect
}

interface SeedProduct {
  title: string;
  description: string;
  price: number;
  inStock: number;
  slug: string;
  images: string[];
  category: string;
  tags: string[];
  attributes: Record<string, string | number | string[]>; // nombre del atributo -> valor
}

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

interface SeedData {
  companies: SeedCompany[];
  users: SeedUser[];
  countries: Country[];
}

// -------------------------
// Datos de seed
// -------------------------

export const initialData: SeedData = {
  countries: countries,
  users: [
    {
      email: 'admin@misproductos.shop',
      name: 'Admin User',
      password: bcryptjs.hashSync('123456'),
      role: 'admin',
    },
    {
      email: 'test@misproductos.shop',
      name: 'Test User',
      password: bcryptjs.hashSync('123456'),
      role: 'user',
    },
  ],
  companies: [
    {
      name: 'Tienda de Ropa',
      email: 'contacto@tiendaropa.com',
      phone: '+5491112345678',
      domains: ['tiendaropa.misproductos.shop', 'tiendaropa.com'],
      categories: ['Remeras', 'Pantalones', 'Buzos', 'Accesorios'],
      attributes: [
        {
          name: 'Talla',
          type: 'select',
          values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        },
        {
          name: 'Color',
          type: 'multiselect',
          values: ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde'],
        },
        {
          name: 'Material',
          type: 'select',
          values: ['Algodón', 'Poliéster', 'Algodón/Poliéster', 'Lino'],
        },
        {
          name: 'Marca',
          type: 'text',
        },
      ],
      products: [
        {
          title: 'Remera Básica',
          description: 'Remera de algodón 100% premium, cómoda y duradera.',
          price: 25.99,
          inStock: 50,
          slug: 'remera-basica',
          images: ['1740176-00-A_0_2000.jpg', '1740176-00-A_1.jpg'],
          category: 'Remeras',
          tags: ['básico', 'algodón', 'casual'],
          attributes: {
            Talla: 'M',
            Color: ['Negro', 'Blanco'],
            Material: 'Algodón',
            Marca: 'Premium',
          },
        },
        {
          title: 'Pantalón Cargo',
          description: 'Pantalón cargo con múltiples bolsillos, ideal para uso diario.',
          price: 45.99,
          inStock: 30,
          slug: 'pantalon-cargo',
          images: ['1740507-00-A_0_2000.jpg', '1740507-00-A_1.jpg'],
          category: 'Pantalones',
          tags: ['cargo', 'casual', 'práctico'],
          attributes: {
            Talla: 'L',
            Color: ['Negro', 'Gris'],
            Material: 'Algodón/Poliéster',
            Marca: 'Urban',
          },
        },
        {
          title: 'Buzo con Capucha',
          description: 'Buzo abrigado con capucha, perfecto para el invierno.',
          price: 65.99,
          inStock: 20,
          slug: 'buzo-capucha',
          images: ['1740250-00-A_0_2000.jpg', '1740250-00-A_1.jpg'],
          category: 'Buzos',
          tags: ['abrigado', 'invierno', 'capucha'],
          attributes: {
            Talla: 'XL',
            Color: ['Gris', 'Negro'],
            Material: 'Algodón/Poliéster',
            Marca: 'Warm',
          },
        },
      ],
    },
    {
      name: 'Pastelería Artesanal',
      email: 'pedidos@pasteleria.com',
      phone: '+5491198765432',
      domains: ['pasteleria.misproductos.shop'],
      categories: ['Tortas', 'Postres', 'Panadería', 'Especiales'],
      attributes: [
        {
          name: 'Sabor',
          type: 'select',
          values: ['Chocolate', 'Vainilla', 'Frutilla', 'Limon', 'Dulce de Leche'],
        },
        {
          name: 'Tamaño',
          type: 'select',
          values: ['Individual', 'Chico (6 porciones)', 'Mediano (12 porciones)', 'Grande (20 porciones)'],
        },
        {
          name: 'Decoración',
          type: 'multiselect',
          values: ['Frutas', 'Chocolate', 'Crema', 'Merengue', 'Sin decoración'],
        },
        {
          name: 'Peso (kg)',
          type: 'number',
        },
      ],
      products: [
        {
          title: 'Torta de Chocolate',
          description: 'Torta húmeda de chocolate con relleno de crema y cobertura de ganache.',
          price: 35.99,
          inStock: 10,
          slug: 'torta-chocolate',
          images: ['1740280-00-A_0_2000.jpg', '1740280-00-A_1.jpg'],
          category: 'Tortas',
          tags: ['chocolate', 'torta', 'postre'],
          attributes: {
            Sabor: 'Chocolate',
            Tamaño: 'Mediano (12 porciones)',
            Decoración: ['Chocolate', 'Crema'],
            'Peso (kg)': 1.5,
          },
        },
        {
          title: 'Alfajores de Maicena',
          description: 'Alfajores caseros rellenos de dulce de leche, bañados en chocolate.',
          price: 2.5,
          inStock: 100,
          slug: 'alfajores-maicena',
          images: ['1741416-00-A_0_2000.jpg', '1741416-00-A_1.jpg'],
          category: 'Postres',
          tags: ['alfajor', 'dulce de leche', 'tradicional'],
          attributes: {
            Sabor: 'Dulce de Leche',
            Tamaño: 'Individual',
            Decoración: ['Chocolate'],
            'Peso (kg)': 0.05,
          },
        },
      ],
    },
    {
      name: 'Servicios de Coaching',
      email: 'info@coaching.com',
      phone: '+5491123456789',
      domains: ['coaching.misproductos.shop', 'coaching.com'],
      categories: ['Sesiones Individuales', 'Paquetes', 'Talleres', 'Online'],
      attributes: [
        {
          name: 'Duración (minutos)',
          type: 'number',
        },
        {
          name: 'Modalidad',
          type: 'select',
          values: ['Presencial', 'Online', 'Híbrido'],
        },
        {
          name: 'Nivel',
          type: 'select',
          values: ['Principiante', 'Intermedio', 'Avanzado'],
        },
        {
          name: 'Incluye Material',
          type: 'select',
          values: ['Sí', 'No'],
        },
      ],
      products: [
        {
          title: 'Sesión Individual de Coaching',
          description: 'Sesión personalizada de 60 minutos para trabajar objetivos específicos.',
          price: 80.0,
          inStock: 999, // Servicios ilimitados
          slug: 'sesion-individual-coaching',
          images: ['7654393-00-A_2_2000.jpg', '7654393-00-A_3.jpg'],
          category: 'Sesiones Individuales',
          tags: ['coaching', 'personalizado', 'sesión'],
          attributes: {
            'Duración (minutos)': 60,
            Modalidad: 'Presencial',
            Nivel: 'Intermedio',
            'Incluye Material': 'Sí',
          },
        },
        {
          title: 'Paquete de 4 Sesiones',
          description: 'Paquete promocional de 4 sesiones con descuento del 15%.',
          price: 272.0,
          inStock: 999,
          slug: 'paquete-4-sesiones',
          images: ['1703767-00-A_0_2000.jpg', '1703767-00-A_1.jpg'],
          category: 'Paquetes',
          tags: ['paquete', 'promoción', 'coaching'],
          attributes: {
            'Duración (minutos)': 240,
            Modalidad: 'Híbrido',
            Nivel: 'Intermedio',
            'Incluye Material': 'Sí',
          },
        },
      ],
    },
  ],
};
