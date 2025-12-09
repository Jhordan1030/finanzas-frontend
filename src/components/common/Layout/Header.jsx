import React from 'react';
import { Bell, Menu, X } from 'lucide-react';

const Header = ({ onMenuToggle, isSidebarOpen = true }) => {


    const userInitial = 'J';
    const appName = import.meta.env.VITE_APP_NAME || 'Finanzas Tracker';



    return (
        <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between">

                    {/* Logo y Mobile Menu Toggle */}
                    <div className="flex items-center gap-3">
                        {/* Botón para abrir/cerrar Sidebar (visible solo en móvil/tablet) */}
                        <button
                            onClick={onMenuToggle}
                            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition duration-150"
                            aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
                            aria-expanded={isSidebarOpen}
                        >
                            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        {/* Logo de la aplicación */}
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-sm">FT</span>
                            </div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                                {appName}
                            </h1>
                        </div>
                    </div>

                    {/* User Actions (Notificaciones y Perfil) */}
                    <div className="flex items-center gap-2 sm:gap-4">

                        {/* Notifications */}
                        <button
                            className="relative p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition duration-150"
                            aria-label="Notificaciones"
                        >
                            <Bell size={20} />
                            {/* Indicador de notificación */}
                            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        {/* User Profile - Solo inicial */}
                        <button
                            className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition duration-150"
                            aria-label="Perfil de usuario"
                        >
                            <div className="h-9 w-9 bg-gradient-to-br from-primary-600 to-primary-400 rounded-full flex items-center justify-center text-white font-semibold text-base shadow-md">
                                {userInitial}
                            </div>
                        </button>
                    </div>
                </div>

                {/* NOTA: La barra de búsqueda móvil que se expandía se eliminó */}

            </div>
        </header>
    );
};

export default Header;