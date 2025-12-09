import api from './api'

export const gastosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/gastos', { params })
    return response.data.data || response.data
  },

  getById: async (id) => {
    const response = await api.get(`/gastos/${id}`)
    return response.data.data
  },

  create: async (data) => {
    const response = await api.post('/gastos', data)
    return response.data.data
  },

  update: async (id, data) => {
    const response = await api.put(`/gastos/${id}`, data)
    return response.data.data
  },

  delete: async (id) => {
    const response = await api.delete(`/gastos/${id}`)
    return response.data.data
  },

  getCategorias: async () => {
    const response = await api.get('/gastos/categorias')
    return response.data.data
  },

  getResumenCategoria: async () => {
    const response = await api.get('/gastos/resumen-categoria')
    return response.data.data
  },

  getTotal: async () => {
    const response = await api.get('/gastos/total')
    return response.data.total || response.data
  },

  getBalance: async () => {
    const response = await api.get('/gastos/balance')
    return response.data
  },

  getDashboard: async () => {
    const response = await api.get('/gastos/dashboard')
    return response.data.data
  },

  getUltimos: async (limite = 10) => {
    const response = await api.get(`/gastos/ultimos?limite=${limite}`)
    return response.data.data
  },
}