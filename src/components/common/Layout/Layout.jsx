import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  // Leer el estado inicial del localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    // Guardar en localStorage cuando cambie
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuToggle={toggleSidebar} 
        isSidebarOpen={isSidebarOpen} 
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={closeSidebar} 
        />
        
        <main 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'lg:ml-64' : 'ml-0'
          }`}
        >
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;