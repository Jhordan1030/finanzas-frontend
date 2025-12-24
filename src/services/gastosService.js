import api from './api';

export const gastosService = {
  // 14. CREAR GASTO
  createGasto: (data) => api.post('/api/gastos', data),

  // 15. OBTENER TODOS LOS GASTOS
  getGastos: (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.categoria) queryParams.append('categoria', params.categoria);
    if (params.fechaDesde) queryParams.append('fechaDesde', params.fechaDesde);
    if (params.fechaHasta) queryParams.append('fechaHasta', params.fechaHasta);
    if (params.limit) queryParams.append('limite', params.limit);

    const queryString = queryParams.toString();
    const url = `/api/gastos${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
  },

  // 16. OBTENER GASTO ESPECÍFICO
  getGastoById: (id) => api.get(`/api/gastos/${id}`),

  // 17. ACTUALIZAR GASTO
  updateGasto: (id, data) => api.put(`/api/gastos/${id}`, data),

  // 18. ELIMINAR GASTO
  deleteGasto: (id) => api.delete(`/api/gastos/${id}`),

  // 19. RESUMEN POR CATEGORÍA
  getResumenCategoria: () => api.get('/api/gastos/resumen-categoria'),

  // 20. TOTAL DE GASTOS
  getTotalGastos: () => api.get('/api/gastos/total'),

  // 21. CATEGORÍAS DISPONIBLES
  getCategorias: () => api.get('/api/gastos/categorias'),

  // 22. BALANCE (INGRESOS - GASTOS)
  getBalance: () => api.get('/api/gastos/balance'),

  // 23. DASHBOARD COMPLETO
  getDashboard: () => api.get('/api/gastos/dashboard'),

  // 24. ÚLTIMOS GASTOS
  getUltimosGastos: (limit = 5) => api.get(`/api/gastos/ultimos?limite=${limit}`),

  // 31. ESTADÍSTICAS ADMIN DE GASTOS
  getEstadisticasAdmin: () => api.get('/api/gastos/estadisticas-admin'),

  // Funciones adicionales útiles
  getGastosByCategory: (category) => {
    return api.get(`/api/gastos?categoria=${encodeURIComponent(category)}`);
  },

  getGastosByMonth: (year, month) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    return api.get(`/api/gastos?fechaDesde=${startDate}&fechaHasta=${endDate}`);
  },

  getGastosByDateRange: (startDate, endDate) => {
    return api.get(`/api/gastos?fechaDesde=${startDate}&fechaHasta=${endDate}`);
  },

  // Obtener gastos del mes actual
  getCurrentMonthGastos: () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    return api.get(`/api/gastos?fechaDesde=${startDate}&fechaHasta=${endDate}`);
  },

  // Obtener categorías únicas con totales
  getCategoriasConTotales: async () => {
    const resumen = await api.get('/api/gastos/resumen-categoria');
    return resumen.map(item => ({
      categoria: item.categoria,
      total: item.total_monto,
      cantidad: item.total_gastos
    }));
  }
};