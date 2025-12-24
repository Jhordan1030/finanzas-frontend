import api from './api';

export const usersService = {
    // 25. OBTENER TODOS LOS USUARIOS
    getAllUsers: () => api.get('/api/users'),

    // 26. OBTENER USUARIO ESPECÍFICO
    getUserById: (id) => api.get(`/api/users/${id}`),

    // 27. ACTUALIZAR USUARIO
    updateUser: (id, data) => api.put(`/api/users/${id}`, data),

    // 28. ELIMINAR USUARIO
    deleteUser: (id) => api.delete(`/api/users/${id}`),

    // 29. ESTADÍSTICAS DE USUARIOS
    getUserStats: () => api.get('/api/users/stats'),

    // Endpoints públicos (sin /api/)
    healthCheck: () => api.get('/health'),

    getApiInfo: () => api.get('/'),

    // Funciones adicionales útiles para admin
    searchUsers: (searchTerm) => {
        return api.get(`/api/users?search=${encodeURIComponent(searchTerm)}`);
    },

    // Activar/Desactivar usuario
    toggleUserStatus: (id, active) => {
        return api.put(`/api/users/${id}`, { activo: active });
    },

    // Cambiar rol de usuario
    changeUserRole: (id, role) => {
        return api.put(`/api/users/${id}`, { rol: role });
    },

    // Obtener usuarios con estadísticas
    getUsersWithStats: async () => {
        const users = await api.get('/api/users');

        // Aquí podrías enriquecer los datos si el backend no lo hace
        return users.map(user => ({
            ...user,
            // Agregar estadísticas calculadas si es necesario
        }));
    },

    // Verificar si un email ya existe
    checkEmailExists: async (email) => {
        try {
            const users = await api.get('/api/users');
            return users.some(user => user.email === email);
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    }
};