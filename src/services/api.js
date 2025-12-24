import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://trabajotracker-backend.vercel.app';

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para incluir token automáticamente
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        console.log('🌐 Request URL:', config.baseURL + config.url);

        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
    (response) => {
        const responseData = response.data;

        // Para auth endpoints, devolver la respuesta completa
        if (response.config.url.includes('/auth/')) {
            return responseData;
        }

        // Para otros endpoints, extraer solo el campo 'data' si existe
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
            return responseData.data;
        }

        return responseData;
    },
    (error) => {
        console.error('❌ API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
        });

        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 401:
                case 403:
                    if (!window.location.pathname.includes('/login') &&
                        !window.location.pathname.includes('/register')) {

                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user_data');
                        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 1000);
                    }
                    break;
                case 404:
                    toast.error(data?.mensaje || 'Endpoint no encontrado');
                    break;
                case 500:
                    toast.error('Error interno del servidor');
                    break;
                default:
                    if (data?.mensaje) {
                        toast.error(data.mensaje);
                    }
            }
        }

        return Promise.reject(error.response?.data || error);
    }
);

export default api;