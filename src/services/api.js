// src/services/api.js - VERSIÓN CORREGIDA
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'https://trabajotracker-backend.vercel.app';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para extraer SOLO el campo 'data' de la respuesta
api.interceptors.response.use(
    (response) => {


        // TU BACKEND DEVUELVE: { success: true, data: [...] }
        // EXTRAEMOS SOLO EL 'data'
        const responseData = response.data;

        // Si la respuesta tiene 'data', devolver eso
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
            return responseData.data;
        }

        // Si no, devolver la respuesta completa
        return responseData;
    },
    (error) => {
        console.error('❌ API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
        });

        return Promise.reject(error.response?.data || error);
    }
);

// Servicio de API
export const apiService = {
    // Test endpoints
    healthCheck: () => api.get('/health'),

    // Ingresos
    getIngresos: () => api.get('/api/ingresos'),
    createIngreso: (data) => api.post('/api/ingresos', data),
    getTotalIngresos: () => api.get('/api/ingresos/total'),
    getUltimosIngresos: (limit = 5) => api.get(`/api/ingresos/ultimos?limit=${limit}`),
    getResumenMensual: () => api.get('/api/ingresos/resumen-mensual'),

    // Gastos
    getGastos: () => api.get('/api/gastos'),
    createGasto: (data) => api.post('/api/gastos', data),
    getCategorias: () => api.get('/api/gastos/categorias'),
    getBalance: () => api.get('/api/gastos/balance'),
    getDashboard: () => api.get('/api/gastos/dashboard'),
    getUltimosGastos: (limit = 5) => api.get(`/api/gastos/ultimos?limit=${limit}`),
    getTotalGastos: () => api.get('/api/gastos/total'),
    getResumenCategoria: () => api.get('/api/gastos/resumen-categoria'),
};

export default api;