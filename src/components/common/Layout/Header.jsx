import React from 'react';
import { Menu, Bell } from 'lucide-react';

const Header = ({ onMenuToggle }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-gray-900 text-white shadow-md">
            <div className="h-full px-6 flex items-center justify-between">
                <button
                    onClick={onMenuToggle}
                    className="p-2 rounded-lg hover:bg-gray-800"
                >
                    <Menu size={22} />
                </button>

                <h1 className="font-semibold text-sm sm:text-base">
                    Finanzas Tracker
                </h1>

                <button className="p-2 rounded-lg hover:bg-gray-800">
                    <Bell size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;
