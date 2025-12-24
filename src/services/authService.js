import api from './api';

export const authService = {
    // 1. REGISTRO DE USUARIO
    signup: (userData) => api.post('/api/auth/signup', userData),

    // 2. INICIO DE SESIÓN
    signin: (credentials) => api.post('/api/auth/signin', credentials),

    // 3. VER PERFIL
    getProfile: () => api.get('/api/auth/profile'),

    // 4. ACTUALIZAR PERFIL
    updateProfile: (profileData) => api.put('/api/auth/profile', profileData),

    // 5. CAMBIAR CONTRASEÑA
    changePassword: (passwords) => api.put('/api/auth/change-password', passwords),

    // Funciones auxiliares mejoradas
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('login_time');
        // Limpiar cualquier otra data de usuario
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('user_') || key.startsWith('auth_')) {
                localStorage.removeItem(key);
            }
        });
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user_data');
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    },

    isAuthenticated: () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp * 1000 <= Date.now();

            if (isExpired) {
                authService.logout(); // Limpiar si expiró
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking token:', error);
            return false;
        }
    },

    isAdmin: () => {
        const user = authService.getCurrentUser();
        return user?.rol === 'admin';
    },

    // Nuevas funciones útiles
    getToken: () => localStorage.getItem('auth_token'),

    setUserData: (userData) => {
        localStorage.setItem('user_data', JSON.stringify(userData));
    },

    clearAll: () => {
        authService.logout();
    },

    // Verificar si el usuario tiene un rol específico
    hasRole: (role) => {
        const user = authService.getCurrentUser();
        return user?.rol === role;
    },

    // Actualizar solo ciertos campos del usuario
    updateUserField: (field, value) => {
        const user = authService.getCurrentUser();
        if (user) {
            user[field] = value;
            localStorage.setItem('user_data', JSON.stringify(user));
        }
    },

    // Verificar si el token está próximo a expirar (menos de 5 minutos)
    isTokenAboutToExpire: () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const timeToExpire = payload.exp * 1000 - Date.now();
            return timeToExpire < 5 * 60 * 1000; // 5 minutos
        } catch {
            return true;
        }
    }
};