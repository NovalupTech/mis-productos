'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IoCloseOutline, IoCheckmarkCircleOutline, IoDownloadOutline, IoCloudUploadOutline, IoDocumentTextOutline, IoImageOutline, IoEyeOutline, IoRocketOutline } from 'react-icons/io5';
import { downloadExcelTemplate, validateProductsImport, importProducts } from '@/actions/product/import-products';
import { useRouter } from 'next/navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface ImportData {
  productsFile: File | null;
  imagesZip: File | null;
  attributesFile: File | null;
  preview: any | null;
  validation: any | null;
}

export const ImportProductsModal = ({ isOpen, onClose }: Props) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [deleteExisting, setDeleteExisting] = useState(false);
  const [importData, setImportData] = useState<ImportData>({
    productsFile: null,
    imagesZip: null,
    attributesFile: null,
    preview: null,
    validation: null,
  });

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await downloadExcelTemplate();
      if (result.ok && result.blob) {
        const url = window.URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo-productos.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setError(result.message || 'Error al descargar el template');
      }
    } catch (err) {
      setError('Error al descargar el template');
    } finally {
      setLoading(false);
    }
  };

  const handleProductsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportData(prev => ({ ...prev, productsFile: file }));
      setError(null);
    }
  };

  const handleImagesZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportData(prev => ({ ...prev, imagesZip: file }));
      setError(null);
    }
  };

  const handleAttributesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportData(prev => ({ ...prev, attributesFile: file }));
      setError(null);
    }
  };

  const handleNext = async () => {
    if (currentStep === 2 && !importData.productsFile) {
      setError('Debes subir el Excel de productos');
      return;
    }
    if (currentStep === 3 && !importData.imagesZip) {
      setError('Debes subir el ZIP con las imágenes');
      return;
    }
    if (currentStep === 5) {
      // Validar antes de mostrar preview
      await handleValidate();
      return;
    }
    setCurrentStep((prev) => (prev + 1) as Step);
    setError(null);
  };

  const handleValidate = async () => {
    if (!importData.productsFile) {
      setError('Debes subir el Excel de productos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Subir archivos y validar
      const formData = new FormData();
      formData.append('products', importData.productsFile);
      if (importData.imagesZip) {
        formData.append('images', importData.imagesZip);
      }
      if (importData.attributesFile) {
        formData.append('attributes', importData.attributesFile);
      }

      const result = await validateProductsImport(formData);
      
      if (result.ok) {
        setImportData(prev => ({
          ...prev,
          preview: result.preview,
          validation: result.validation,
        }));
        setCurrentStep(6);
      } else {
        setError(result.message || 'Error al validar los productos');
      }
    } catch (err) {
      setError('Error al validar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importData.productsFile) {
      setError('Debes subir el Excel de productos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('products', importData.productsFile);
      if (importData.imagesZip) {
        formData.append('images', importData.imagesZip);
      }
      if (importData.attributesFile) {
        formData.append('attributes', importData.attributesFile);
      }
      formData.append('deleteExisting', deleteExisting.toString());

      const result = await importProducts(formData);
      
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.message || 'Error al importar los productos');
      }
    } catch (err) {
      setError('Error al importar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      setError(null);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setDeleteExisting(false);
    setImportData({
      productsFile: null,
      imagesZip: null,
      attributesFile: null,
      preview: null,
      validation: null,
    });
    setError(null);
  };

  const steps = [
    { number: 1, title: 'Descargar Excel modelo', icon: IoDownloadOutline },
    { number: 2, title: 'Subir Excel de productos', icon: IoDocumentTextOutline },
    { number: 3, title: 'Subir ZIP con imágenes', icon: IoImageOutline },
    { number: 4, title: 'Subir Excel de atributos (opcional)', icon: IoDocumentTextOutline },
    { number: 5, title: 'Preview + Validación', icon: IoEyeOutline },
    { number: 6, title: 'Importar', icon: IoRocketOutline },
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Importar Productos desde Excel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isCompleted ? (
                        <IoCheckmarkCircleOutline size={20} />
                      ) : (
                        <Icon size={20} />
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center ${isActive ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Paso 1: Descargar template */}
          {currentStep === 1 && (
            <div className="text-center py-8">
              <IoDownloadOutline size={64} className="mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">Descargar Excel modelo</h3>
              <p className="text-gray-600 mb-6">
                Descarga el archivo Excel modelo para ver el formato requerido de los productos
              </p>
              <button
                onClick={handleDownloadTemplate}
                disabled={loading}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <IoDownloadOutline size={20} />
                {loading ? 'Descargando...' : 'Descargar modelo'}
              </button>
            </div>
          )}

          {/* Paso 2: Subir Excel productos */}
          {currentStep === 2 && (
            <div className="text-center py-8">
              <IoDocumentTextOutline size={64} className="mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">Subir Excel de productos</h3>
              <p className="text-gray-600 mb-6">
                Selecciona el archivo Excel con los productos a importar
              </p>
              <div className="max-w-md mx-auto">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Archivo Excel (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleProductsFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {importData.productsFile && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {importData.productsFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Subir ZIP imágenes */}
          {currentStep === 3 && (
            <div className="text-center py-8">
              <IoImageOutline size={64} className="mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">Subir ZIP con imágenes</h3>
              <p className="text-gray-600 mb-6">
                Sube un archivo ZIP que contenga todas las imágenes de los productos.
                Las imágenes deben tener el mismo nombre que se especifica en el Excel.
              </p>
              <div className="max-w-md mx-auto">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Archivo ZIP (.zip)
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleImagesZipChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {importData.imagesZip && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {importData.imagesZip.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Paso 4: Subir Excel atributos (opcional) */}
          {currentStep === 4 && (
            <div className="text-center py-8">
              <IoDocumentTextOutline size={64} className="mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">Subir Excel de atributos (opcional)</h3>
              <p className="text-gray-600 mb-6">
                Si tus productos tienen atributos, puedes subir un Excel adicional con esta información.
                Si no tienes atributos, puedes omitir este paso.
              </p>
              <div className="max-w-md mx-auto">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Archivo Excel (.xlsx) - Opcional
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleAttributesFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {importData.attributesFile && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {importData.attributesFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Paso 5: Preview + Validación */}
          {currentStep === 5 && (
            <div className="text-center py-8">
              <IoEyeOutline size={64} className="mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">Preview + Validación</h3>
              <p className="text-gray-600 mb-6">
                Revisa y valida los productos antes de importarlos
              </p>
              <button
                onClick={handleValidate}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Validando...' : 'Validar productos'}
              </button>
            </div>
          )}

          {/* Paso 6: Importar */}
          {currentStep === 6 && (
            <div className="py-8">
              <div className="text-center mb-6">
                <IoRocketOutline size={64} className="mx-auto text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Importar productos</h3>
              </div>

              {/* Preview de validación */}
              {importData.validation && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Resumen de validación:</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Total productos:</span>{' '}
                      {importData.validation.total || 0}
                    </p>
                    <p>
                      <span className="font-medium">Válidos:</span>{' '}
                      <span className="text-green-600">{importData.validation.valid || 0}</span>
                    </p>
                    {importData.validation.errors && importData.validation.errors.length > 0 && (
                      <div>
                        <span className="font-medium">Errores:</span>{' '}
                        <span className="text-red-600">{importData.validation.errors.length}</span>
                        <ul className="list-disc list-inside mt-2 text-red-600">
                          {importData.validation.errors.slice(0, 10).map((error: string, index: number) => (
                            <li key={index} className="text-xs">{error}</li>
                          ))}
                        </ul>
                        {importData.validation.errors.length > 10 && (
                          <p className="text-xs text-gray-500 mt-1">
                            ... y {importData.validation.errors.length - 10} errores más
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview de productos */}
              {importData.preview && importData.preview.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Vista previa de productos:</h4>
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Código</th>
                          <th className="px-4 py-2 text-left">Título</th>
                          <th className="px-4 py-2 text-left">Precio</th>
                          <th className="px-4 py-2 text-left">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.preview.slice(0, 10).map((product: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2">{product.code || '-'}</td>
                            <td className="px-4 py-2">{product.title || '-'}</td>
                            <td className="px-4 py-2">{product.price || '-'}</td>
                            <td className="px-4 py-2">{product.inStock || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importData.preview.length > 10 && (
                      <p className="text-xs text-gray-500 p-2 text-center">
                        Mostrando 10 de {importData.preview.length} productos
                      </p>
                    )}
                  </div>
                </div>
              )}

              {importData.validation?.errors && importData.validation.errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-semibold mb-2">
                    Hay errores en los datos. Por favor, corrígelos antes de importar.
                  </p>
                </div>
              )}

              {/* Checkbox para eliminar productos existentes */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteExisting}
                    onChange={(e) => setDeleteExisting(e.target.checked)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800">
                      Eliminar productos existentes
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Si está activo, se eliminarán todos los productos de la compañía antes de importar los nuevos.
                      Si está desactivado, se agregarán nuevos productos y se actualizarán los existentes basándose en el código.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleImport}
                  disabled={loading || (importData.validation?.errors && importData.validation.errors.length > 0)}
                  className="btn-primary"
                >
                  {loading ? 'Importando...' : 'Importar productos'}
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Reiniciar
          </button>
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Anterior
              </button>
            )}
            {currentStep < 6 && (
              <button
                onClick={handleNext}
                disabled={loading}
                className="btn-primary"
              >
                {currentStep === 5 ? 'Validar' : 'Siguiente'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
