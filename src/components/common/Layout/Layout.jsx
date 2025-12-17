import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);

            if (mobile) {
                setIsSidebarOpen(false);
            } else {
                const saved = localStorage.getItem('sidebarOpen');
                setIsSidebarOpen(saved ? JSON.parse(saved) : true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
        }
    }, [isSidebarOpen, isMobile]);

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    return (
        <div className="h-screen overflow-hidden bg-gray-50">
            <Header onMenuToggle={toggleSidebar} />

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isMobile={isMobile}
            />

            <main
                className={`
          pt-16 h-full overflow-y-auto transition-all duration-300
          ${isMobile
                    ? 'ml-0'
                    : isSidebarOpen
                        ? 'lg:ml-64'
                        : 'lg:ml-20'}
        `}
            >
                <div className="p-4 sm:p-6 lg:p-8">
                    <div className="bg-white rounded-xl border p-6 shadow-sm min-h-[calc(100vh-6rem)]">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
