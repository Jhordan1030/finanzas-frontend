import api from './api';

export const ingresosService = {
  // 6. CREAR INGRESO
  createIngreso: (data) => api.post('/api/ingresos', data),

  // 7. OBTENER TODOS LOS INGRESOS
  getIngresos: (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.fechaDesde) queryParams.append('fechaDesde', params.fechaDesde);
    if (params.fechaHasta) queryParams.append('fechaHasta', params.fechaHasta);
    if (params.limit) queryParams.append('limite', params.limit);

    const queryString = queryParams.toString();
    const url = `/api/ingresos${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
  },

  // 8. OBTENER INGRESO ESPECÍFICO
  getIngresoById: (id) => api.get(`/api/ingresos/${id}`),

  // 9. ACTUALIZAR INGRESO
  updateIngreso: (id, data) => api.put(`/api/ingresos/${id}`, data),

  // 10. ELIMINAR INGRESO
  deleteIngreso: (id) => api.delete(`/api/ingresos/${id}`),

  // 11. RESUMEN MENSUAL
  getResumenMensual: () => api.get('/api/ingresos/resumen-mensual'),

  // 12. TOTAL DE INGRESOS
  getTotalIngresos: () => api.get('/api/ingresos/total'),

  // 13. ÚLTIMOS INGRESOS
  getUltimosIngresos: (limit = 5) => api.get(`/api/ingresos/ultimos?limite=${limit}`),

  // 30. ESTADÍSTICAS ADMIN DE INGRESOS
  getEstadisticasAdmin: () => api.get('/api/ingresos/estadisticas-admin'),

  // Funciones adicionales útiles
  getIngresosByMonth: (year, month) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    return api.get(`/api/ingresos?fechaDesde=${startDate}&fechaHasta=${endDate}`);
  },

  getIngresosByDateRange: (startDate, endDate) => {
    return api.get(`/api/ingresos?fechaDesde=${startDate}&fechaHasta=${endDate}`);
  },

  // Obtener ingresos del mes actual
  getCurrentMonthIngresos: () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    return api.get(`/api/ingresos?fechaDesde=${startDate}&fechaHasta=${endDate}`);
  }
};