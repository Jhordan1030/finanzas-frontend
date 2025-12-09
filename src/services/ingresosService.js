import api from './api'

export const ingresosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/ingresos', { params })
    return response.data.data || response.data
  },

  getById: async (id) => {
    const response = await api.get(`/ingresos/${id}`)
    return response.data.data
  },

  create: async (data) => {
    const response = await api.post('/ingresos', data)
    return response.data.data
  },

  update: async (id, data) => {
    const response = await api.put(`/ingresos/${id}`, data)
    return response.data.data
  },

  delete: async (id) => {
    const response = await api.delete(`/ingresos/${id}`)
    return response.data.data
  },

  getResumenMensual: async () => {
    const response = await api.get('/ingresos/resumen-mensual')
    return response.data.data
  },

  getTotal: async () => {
    const response = await api.get('/ingresos/total')
    return response.data.total || response.data
  },

  getUltimos: async (limite = 10) => {
    const response = await api.get(`/ingresos/ultimos?limite=${limite}`)
    return response.data.data
  },
}