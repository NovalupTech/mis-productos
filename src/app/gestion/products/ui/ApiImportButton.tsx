'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoCodeWorkingOutline, IoCloseOutline, IoCopyOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

export const ApiImportButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const authExample = `POST /api/products/import/auth
Content-Type: application/json

{
  "email": "admin@tudominio.com",
  "password": "tu_contraseña",
  "domain": "tudominio.com"
  // o "companyId": "uuid-de-la-compania"
}`;

  const importExample = `POST /api/products/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "products": [
    {
      "code": "PROD-001",
      "title": "Producto Ejemplo",
      "slug": "producto-ejemplo",
      "description": "Descripción del producto",
      "price": 100.00,
      "inStock": 50,
      "category": "Categoría",
      "featured": false,
      "images": [
        "https://ejemplo.com/imagen1.jpg",
        "https://ejemplo.com/imagen2.jpg"
      ],
      "tags": ["tag1", "tag2"],
      "attributes": [
        {
          "attributeName": "Color",
          "value": "Rojo"
        },
        {
          "attributeName": "Talla",
          "value": "M"
        },
        {
          "attributeName": "Material",
          "value": "Algodón 100%"
        }
      ]
    }
  ]
}`;

  const curlAuthExample = `curl -X POST https://tudominio.com/api/products/import/auth \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@tudominio.com",
    "password": "tu_contraseña",
    "domain": "tudominio.com"
  }'`;

  const curlImportExample = `curl -X POST https://tudominio.com/api/products/import \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "products": [
      {
        "title": "Producto Ejemplo",
        "price": 100.00,
        "inStock": 50,
        "category": "Categoría",
        "images": ["https://ejemplo.com/imagen.jpg"],
        "tags": ["tag1"],
        "attributes": [
          {
            "attributeName": "Color",
            "value": "Rojo"
          }
        ]
      }
    ]
  }'`;

  if (typeof window === 'undefined') return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Importación de Productos por API</h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Introducción */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Descripción</h3>
            <p className="text-gray-700">
              Esta API permite importar productos masivamente desde sistemas externos. 
              El proceso consta de dos pasos: autenticación para obtener un token y luego 
              la importación de productos usando ese token.
            </p>
          </div>

          {/* Paso 1: Autenticación */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Paso 1: Autenticación</h3>
            <p className="text-gray-700 mb-3">
              Obtén un token de autenticación enviando las credenciales de un usuario 
              <strong> companyAdmin</strong> junto con el dominio o companyId.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 relative">
              <button
                onClick={() => handleCopy(authExample, 'auth')}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                title="Copiar"
              >
                {copied === 'auth' ? <IoCheckmarkCircleOutline size={20} className="text-green-500" /> : <IoCopyOutline size={20} />}
              </button>
              <pre className="text-sm overflow-x-auto">
                <code>{authExample}</code>
              </pre>
            </div>

            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Respuesta exitosa:</strong>
              </p>
              <pre className="text-xs mt-1 overflow-x-auto">
                <code>{`{
  "ok": true,
  "token": "eyJhbGc...",
  "expiresIn": 86400,
  "companyId": "uuid"
}`}</code>
              </pre>
            </div>
          </div>

          {/* Paso 2: Importación */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Paso 2: Importar Productos</h3>
            <p className="text-gray-700 mb-3">
              Usa el token obtenido en el paso anterior para importar productos. 
              El token es válido por 24 horas.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 relative">
              <button
                onClick={() => handleCopy(importExample, 'import')}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                title="Copiar"
              >
                {copied === 'import' ? <IoCheckmarkCircleOutline size={20} className="text-green-500" /> : <IoCopyOutline size={20} />}
              </button>
              <pre className="text-sm overflow-x-auto">
                <code>{importExample}</code>
              </pre>
            </div>
          </div>

          {/* Ejemplos cURL */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Ejemplos con cURL</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Autenticación:</p>
                <div className="bg-gray-50 rounded-lg p-4 relative">
                  <button
                    onClick={() => handleCopy(curlAuthExample, 'curl-auth')}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    title="Copiar"
                  >
                    {copied === 'curl-auth' ? <IoCheckmarkCircleOutline size={20} className="text-green-500" /> : <IoCopyOutline size={20} />}
                  </button>
                  <pre className="text-sm overflow-x-auto">
                    <code>{curlAuthExample}</code>
                  </pre>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Importación:</p>
                <div className="bg-gray-50 rounded-lg p-4 relative">
                  <button
                    onClick={() => handleCopy(curlImportExample, 'curl-import')}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    title="Copiar"
                  >
                    {copied === 'curl-import' ? <IoCheckmarkCircleOutline size={20} className="text-green-500" /> : <IoCopyOutline size={20} />}
                  </button>
                  <pre className="text-sm overflow-x-auto">
                    <code>{curlImportExample}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Campos del producto */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Campos del Producto</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2 text-sm">
                <li><strong>code</strong> (opcional): Código único del producto. Si no se proporciona, se genera automáticamente (MP-000001, MP-000002...)</li>
                <li><strong>title</strong> (requerido): Título del producto</li>
                <li><strong>slug</strong> (opcional): URL amigable. Si no se proporciona, se genera automáticamente desde el título</li>
                <li><strong>description</strong> (opcional): Descripción del producto</li>
                <li><strong>price</strong> (requerido): Precio del producto</li>
                <li><strong>inStock</strong> (opcional, default: 0): Cantidad en stock</li>
                <li><strong>category</strong> (opcional): Nombre de la categoría. Si no existe, se crea automáticamente</li>
                <li><strong>featured</strong> (opcional, default: false): Si el producto es destacado</li>
                <li><strong>images</strong> (opcional): Array de URLs de imágenes. Si son URLs externas, se suben automáticamente a Cloudinary</li>
                <li><strong>tags</strong> (opcional): Array de nombres de tags. Se crean automáticamente si no existen</li>
                <li><strong>attributes</strong> (opcional): Array de objetos con <code>attributeName</code> y <code>value</code>. Los atributos se crean automáticamente como tipo "text" si no existen</li>
              </ul>
            </div>
          </div>

          {/* Notas importantes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-yellow-800">Notas Importantes</h3>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• El token expira después de 24 horas</li>
              <li>• Solo usuarios con rol <strong>companyAdmin</strong> pueden autenticarse</li>
              <li>• Los productos se actualizan si ya existe uno con el mismo <code>code</code></li>
              <li>• Las imágenes externas se suben automáticamente a Cloudinary</li>
              <li>• Los atributos se crean automáticamente como tipo "text" si no existen</li>
              <li>• Las categorías y tags se crean automáticamente si no existen</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={() => setIsModalOpen(false)}
            className="btn-primary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-secondary flex items-center gap-2"
      >
        <IoCodeWorkingOutline size={20} />
        Importar por API
      </button>
      {isModalOpen && createPortal(modalContent, document.body)}
    </>
  );
};
