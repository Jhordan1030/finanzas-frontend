import React, { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';

const Header = ({ onMenuToggle, isSidebarOpen = true }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const userInitial = 'J';
  const appName = import.meta.env.VITE_APP_NAME || 'Finanzas Tracker';

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Buscar:', searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo y Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FT</span>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {appName}
              </h1>
            </div>
          </div>

          {/* Search and User Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Bar (desktop) */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" 
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar transacciones..."
                  className="pl-10 pr-4 py-2 w-64 lg:w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  aria-label="Buscar"
                />
              </div>
            </form>

            {/* Mobile Search Button */}
            <button className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <Search size={20} />
              <span className="sr-only">Buscar</span>
            </button>

            {/* Notifications */}
            <button
              className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* User Profile - Solo inicial */}
            <button
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Perfil de usuario"
            >
              <div className="h-8 w-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                {userInitial}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (se expande debajo) */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" 
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Buscar"
              />
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;