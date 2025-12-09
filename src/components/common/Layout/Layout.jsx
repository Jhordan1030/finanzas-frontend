import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Asume que Header.jsx está en el mismo directorio
import Sidebar from './Sidebar'; // Asume que Sidebar.jsx está en el mismo directorio

const Layout = () => {
  // Leer el estado inicial de la sidebar desde localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Si estamos en un dispositivo móvil (menos de 1024px), inicialmente está cerrada.
    // En desktop, usamos el valor guardado o por defecto a true.
    const isMobileDefault = window.innerWidth < 1024;
    
    if (isMobileDefault) return false;
    
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    // Guardar el estado de la sidebar solo si no es un dispositivo móvil (para preservar la preferencia en desktop)
    if (window.innerWidth >= 1024) {
        localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
    }
    
    // Función para manejar el cambio de tamaño de la ventana (desktop vs mobile)
    const handleResize = () => {
        // Si pasa a desktop (>1024px) y estaba cerrada, la abrimos (o usamos el valor de localStorage si queremos ser más estrictos)
        if (window.innerWidth >= 1024 && !isSidebarOpen) {
            // Usamos el valor guardado, o true si no hay valor (para que en desktop se vea abierta por defecto)
            const saved = localStorage.getItem('sidebarOpen');
            setIsSidebarOpen(saved !== null ? JSON.parse(saved) : true);
        } 
        // Si pasa a móvil (<1024px) y estaba abierta, la cerramos
        else if (window.innerWidth < 1024 && isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    };

    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* El Header es fijo y no se ve afectado por el desplazamiento de la sidebar */}
      <Header 
        onMenuToggle={toggleSidebar} 
        isSidebarOpen={isSidebarOpen} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* La Sidebar es fija en móvil y 'sticky' en desktop */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={closeSidebar} 
        />
        
        {/* Contenido principal */}
        <main 
          className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out w-full
          // En mobile, ml-0. En desktop, el margen izquierdo se ajusta al ancho de la sidebar (64 = 16rem = 256px) 
          // solo si está abierta. Si está cerrada en desktop, la sidebar ya no ocupa espacio, por eso sigue 'ml-0'
          ${
            isSidebarOpen ? 'lg:ml-64' : 'ml-0'
          }`}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;