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
      {/* Overlay para móvil - SOLO cuando está abierto en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar principal */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
          isOpen 
            ? 'translate-x-0 w-64' 
            : '-translate-x-full lg:translate-x-0 lg:w-64'
        }`}
        aria-label="Menú principal"
      >
        {/* Close button para móvil */}
        <div className="lg:hidden flex justify-end p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 h-full overflow-y-auto">
          {/* Logo del sidebar (visible solo en desktop) */}
          <div className="hidden lg:block px-4 py-3 mb-6 bg-gradient-to-r from-primary-50 to-primary-25 rounded-lg border border-primary-100">
            <div className="flex items-center justify-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FT</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Finanzas</p>
                <p className="text-xs text-gray-600">Tracker</p>
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
                    // Cerrar sidebar en móvil al hacer clic en un enlace
                    if (window.innerWidth < 1024) {
                      onClose?.();
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium border-l-4 border-primary-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                    }`
                  }
                  end={item.path === '/'}
                >
                  <span className="mr-3">
                    {item.icon}
                  </span>
                  <span className="block">{item.label}</span>
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