import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

// Configuración de API - SOLO URL base, sin /api al final
const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'https://trabajotracker-backend.vercel.app'

export const useIngresos = () => {
  const [ingresos, setIngresos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch todos los ingresos
  const fetchIngresos = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching ingresos from:', `${API_BASE_URL}/api/ingresos`)
      
      const response = await axios.get(`${API_BASE_URL}/api/ingresos`)
      console.log('API Response:', response.data)
      
      // Tu API devuelve {success, count, data}
      let ingresosData = []
      if (response.data && response.data.success) {
        ingresosData = response.data.data || []
      } else if (Array.isArray(response.data)) {
        ingresosData = response.data
      }
      
      // Mapear los datos de acuerdo a la estructura de tu API
      const mappedIngresos = ingresosData.map(item => ({
        id_ingreso: item.id_ingreso || item.id,
        fecha: item.fecha, // Ya viene como string ISO
        descripcion_trabajo: item.descripcion_trabajo || null,
        valor_ganado: parseFloat(item.valor_ganado) || 0,
        created_at: item.fecha_registro || item.created_at
      }))
      
      // Ordenar por fecha descendente (más reciente primero)
      mappedIngresos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      
      console.log('Mapped ingresos:', mappedIngresos)
      setIngresos(mappedIngresos)
      setError(null)
    } catch (err) {
      console.error('Error fetching ingresos:', err)
      setError('Error al cargar los ingresos')
      toast.error('Error al cargar los días trabajados')
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear nuevo ingreso
  const createIngreso = async (data) => {
    try {
      setLoading(true)
      
      // Preparar datos para enviar
      const ingresoData = {
        fecha: data.fecha,
        descripcion_trabajo: data.descripcion_trabajo || null,
        valor_ganado: parseFloat(data.valor_ganado)
      }
      
      console.log('Creating ingreso:', ingresoData)
      
      const response = await axios.post(`${API_BASE_URL}/api/ingresos`, ingresoData)
      
      // Tu API devuelve {success, data}
      const responseData = response.data.success ? response.data.data : response.data
      
      // Agregar el nuevo ingreso al estado
      const newIngreso = {
        id_ingreso: responseData.id_ingreso || responseData.id,
        fecha: responseData.fecha,
        descripcion_trabajo: responseData.descripcion_trabajo,
        valor_ganado: parseFloat(responseData.valor_ganado),
        created_at: responseData.fecha_registro || responseData.created_at
      }
      
      setIngresos(prev => [newIngreso, ...prev])
      toast.success('Día trabajado registrado exitosamente')
      
      return newIngreso
    } catch (err) {
      console.error('Error creating ingreso:', err)
      toast.error('Error al registrar el día trabajado')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Eliminar ingreso
  const deleteIngreso = async (id) => {
    try {
      setLoading(true)
      await axios.delete(`${API_BASE_URL}/api/ingresos/${id}`)
      setIngresos(prev => prev.filter(ingreso => ingreso.id_ingreso !== id))
      toast.success('Día trabajado eliminado exitosamente')
    } catch (err) {
      console.error('Error deleting ingreso:', err)
      toast.error('Error al eliminar el día trabajado')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Cargar ingresos al montar el componente
  useEffect(() => {
    fetchIngresos()
  }, [fetchIngresos])

  return {
    ingresos,
    loading,
    error,
    fetchIngresos,
    createIngreso,
    deleteIngreso
  }
}