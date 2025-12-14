import Link from 'next/link';
import {
  IoBusinessOutline,
  IoCubeOutline,
  IoPeopleOutline,
  IoSettingsOutline,
  IoPricetagOutline,
} from 'react-icons/io5';

interface Task {
  id: string;
  number?: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  link?: string;
  completed?: boolean;
}

const recommendedTasks: Task[] = [
  {
    id: '1',
    number: 1,
    title: 'Configurar los datos de tu empresa',
    description: 'Completá los datos de contacto y subí el logo. Te recomendamos subir el logo normal y la versión para celular.',
    icon: IoBusinessOutline,
    // link: '/gestion/settings', // TODO: Crear página de configuración
  },
  {
    id: '2',
    number: 2,
    title: 'Agregar tus productos',
    description: 'Puedes subir tus productos de a uno completando un formulario y puedes importarlos con un excel. Descarga el modelo del excel y llenalo con tus productos. Los datos requeridos son código, título y al menos una característica.',
    icon: IoCubeOutline,
    link: '/gestion/products',
  },
  {
    id: '3',
    number: 3,
    title: 'Configura tipos de precio, descuentos y reglas de precios',
    description: 'Configura los tipos de precio, descuentos y reglas de precios que usas en tu empresa',
    icon: IoPricetagOutline,
    link: '/gestion/pricing',
  },
];

const otherTasks: Task[] = [
  {
    id: '4',
    title: 'Configuraciones avanzadas',
    description: 'Podés modificar cómo funciona misproductos. Permitir que tus clientes se registren, descontar stock, etc',
    icon: IoSettingsOutline,
    // link: '/gestion/settings', // TODO: Crear página de configuración
  },
  {
    id: '5',
    title: 'Reglas de precios',
    description: 'Creá todas las reglas de precios y descuentos que usas en tu empresa',
    icon: IoPricetagOutline,
    // link: '/gestion/pricing', // TODO: Crear página de reglas de precios
  },
];

export const DashboardTasks = () => {
  return (
    <div className="space-y-8">
      {/* Título principal */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Te damos la bienvenida a misproductos!
        </h1>
        <p className="text-gray-600">
          Sentite libre para explorar, nosotros te recomendamos comenzar por estas 3 tareas
        </p>
      </div>

      {/* Tareas recomendadas */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tareas recomendadas</h2>
        <div className="space-y-4">
          {recommendedTasks.map((task) => {
            const Icon = task.icon;
            return (
              <div
                key={task.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon size={24} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {task.number && (
                        <span className="text-2xl font-bold text-blue-600">{task.number}.</span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    {task.link && (
                      <Link
                        href={task.link}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Configurar →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Otras tareas */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Otras tareas para armar tu tienda
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherTasks.map((task) => {
            const Icon = task.icon;
            return (
              <div
                key={task.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon size={24} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    {task.link && (
                      <Link
                        href={task.link}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Configurar →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
