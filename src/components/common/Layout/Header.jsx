import React from 'react';
import { Menu, Bell, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const Header = ({ onMenuToggle, isSidebarOpen }) => {
    const { user, logout } = useAuth();

    // Obtener iniciales del usuario
    const getInitials = () => {
        if (!user?.nombre) return 'U';
        return user.nombre.charAt(0).toUpperCase();
    };

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 h-16">
                <div className="flex items-center justify-between h-full">
                    {/* Left Section - Menu Toggle & Logo */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={onMenuToggle}
                            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Desktop Menu Toggle */}
                        <button
                            onClick={onMenuToggle}
                            className="hidden lg:block p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            aria-label="Alternar sidebar"
                        >
                            <Menu size={22} />
                        </button>

                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">FT</span>
                            </div>
                            <h1 className="text-lg font-semibold text-gray-900">
                                Finanzas Tracker
                            </h1>
                        </div>
                    </div>

                    {/* Right Section - User Actions */}
                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <button className="relative p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
                        </button>

                        {/* User Profile */}
                        {user && (
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {getInitials()}
                                </div>
                                <div className="hidden lg:block text-left">
                                    <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="ml-2 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                >
                                    Salir
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;