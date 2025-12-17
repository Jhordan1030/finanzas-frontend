import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CreditCard, TrendingDown, LogOut, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: Home, description: 'Vista general' },
    { path: '/ingresos', label: 'Ingresos', icon: CreditCard, description: 'Gestión de ingresos' },
    { path: '/gastos', label: 'Gastos', icon: TrendingDown, description: 'Control de gastos' }
  ];

  return (
      <>
        {/* Overlay mobile */}
        {isMobile && isOpen && (
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />
        )}

        <aside
            className={`
          fixed top-16 left-0 z-50
          h-[calc(100vh-4rem)]
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${isOpen
                ? 'w-64 translate-x-0'
                : '-translate-x-full lg:translate-x-0 lg:w-20'}
        `}
        >
          {/* Header mobile */}
          {isMobile && (
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-semibold">Menú</span>
                <button onClick={onClose}>
                  <X size={20} />
                </button>
              </div>
          )}

          <div className="flex flex-col h-full py-6">
            {/* Navigation */}
            <nav className="flex-1 px-2 overflow-y-auto">
              <ul className="space-y-1">
                {menuItems.map(({ path, label, icon: Icon, description }) => (
                    <li key={path}>
                      <NavLink
                          to={path}
                          end={path === '/'}
                          onClick={isMobile ? onClose : undefined}
                          className={({ isActive }) => `
                      flex items-center px-3 py-3 rounded-lg transition
                      ${isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'}
                      ${!isOpen && 'lg:justify-center'}
                    `}
                      >
                        <Icon size={20} />
                        {isOpen && (
                            <div className="ml-3">
                              <span className="text-sm font-medium">{label}</span>
                              <p className="text-xs text-gray-500">{description}</p>
                            </div>
                        )}
                      </NavLink>
                    </li>
                ))}
              </ul>
            </nav>

            {/* Logout */}
            <div className="px-3 pt-6 border-t">
              <button
                  className={`flex items-center w-full px-3 py-3 rounded-lg
                text-gray-700 hover:bg-red-50 hover:text-red-600
                ${!isOpen && 'lg:justify-center'}
              `}
              >
                <LogOut size={20} />
                {isOpen && <span className="ml-3 text-sm">Cerrar Sesión</span>}
              </button>
            </div>
          </div>
        </aside>
      </>
  );
};

export default Sidebar;
