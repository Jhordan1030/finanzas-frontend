import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Calendar,
  TrendingDown,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen = true, onClose }) => {
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/ingresos', label: 'Días Trabajados', icon: <Calendar size={20} /> },
    { path: '/gastos', label: 'Gastos', icon: <TrendingDown size={20} /> },
  ];

  return (
    <>
      {/* Overlay para móvil - Solo visible cuando el sidebar está abierto en pantallas pequeñas */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar principal */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen bg-white border-r border-gray-200 shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out ${
          isOpen 
            ? 'translate-x-0 w-64' 
            // En móvil se oculta completamente, en desktop se 'oculta' pero mantiene el ancho para Layout
            : '-translate-x-full lg:translate-x-0 lg:w-64' 
        }`}
        aria-label="Menú principal de navegación"
      >
        {/* Botón de cerrar para móvil */}
        <div className="lg:hidden flex justify-end p-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition duration-150"
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 h-full overflow-y-auto">
          {/* Logo del sidebar (visible solo en desktop, oculto si la sidebar está cerrada) */}
          <div className={`hidden ${isOpen ? 'lg:block' : 'lg:hidden'} px-4 py-3 mb-6 bg-primary-50 rounded-xl border border-primary-100`}>
            <div className="flex items-center justify-start gap-3">
              <div className="h-9 w-9 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-extrabold text-base">FT</span>
              </div>
              <div>
                <p className="font-bold text-lg text-gray-900">Finanzas</p>
                <p className="text-xs text-gray-600 -mt-1">Tracker</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => {
                    // Cierra el sidebar al hacer clic en un enlace si es pantalla pequeña
                    if (window.innerWidth < 1024) { // 1024px es el punto de quiebre 'lg' de Tailwind
                      onClose?.();
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ease-in-out ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 font-semibold border-l-4 border-primary-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                    }`
                  }
                  // `end` asegura que el NavLink solo se active en la ruta exacta (útil para '/')
                  end={item.path === '/'} 
                >
                  <span className="mr-3">
                    {item.icon}
                  </span>
                  <span className="block text-base">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;