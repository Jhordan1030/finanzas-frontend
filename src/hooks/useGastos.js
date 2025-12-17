import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

// CONFIGURACIÓN CORRECTA PARA PROXY DE VITE
// En desarrollo: '/api' será redirigido por Vite a 'https://trabajotracker-backend.vercel.app'
// En producción: usaríamos la URL completa si configuramos la variable
const API_BASE_URL = import.meta.env.MODE === 'development' ? '/api' : 'https://trabajotracker-backend.vercel.app/api'

export const useGastos = () => {
    const [gastos, setGastos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [balance, setBalance] = useState({ total: 0, ingresos: 0, gastos: 0 })
    const [dashboard, setDashboard] = useState({ ultimosGastos: [] })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch todos los gastos
    const fetchGastos = useCallback(async () => {
        try {
            setLoading(true)

            // IMPORTANTE: En desarrollo, esto se convierte en:
            // '/api/gastos' → Vite Proxy → 'https://trabajotracker-backend.vercel.app/api/gastos'
            const response = await axios.get(`${API_BASE_URL}/gastos`)

            console.log('Respuesta de la API:', response.data) // Para debugging

            // Tu API devuelve {success, count, data} o similar
            let gastosData = []
            if (response.data && response.data.success) {
                gastosData = response.data.data || []
            } else if (Array.isArray(response.data)) {
                gastosData = response.data
            }

            console.log('Datos procesados:', gastosData) // Para debugging

            // Mapear los datos de acuerdo a la estructura de tu API
            const mappedGastos = gastosData.map(item => ({
                id_gasto: item.id_gasto || item.id,
                fecha: item.fecha,
                descripcion_gasto: item.descripcion_gasto || item.descripcion || '',
                monto_gasto: parseFloat(item.monto_gasto || item.monto || 0),
                categoria: item.categoria || null,
                created_at: item.fecha_registro || item.created_at
            }))

            // Ordenar por fecha descendente
            mappedGastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

            setGastos(mappedGastos)

            // Extraer categorías únicas
            const uniqueCategorias = [...new Set(mappedGastos
                .filter(gasto => gasto.categoria)
                .map(gasto => gasto.categoria)
            )]
            setCategorias(uniqueCategorias.map(cat => ({ value: cat, label: cat })))

            // Calcular total de gastos
            const totalGastos = mappedGastos.reduce((sum, gasto) =>
                sum + parseFloat(gasto.monto_gasto || 0), 0
            )

            // Por ahora, solo calculamos gastos
            setBalance({
                total: -totalGastos, // Negativo porque son gastos
                ingresos: 0,
                gastos: totalGastos
            })

            // Configurar datos para dashboard
            setDashboard({
                ultimosGastos: mappedGastos.slice(0, 5)
            })

            setError(null)
        } catch (err) {
            console.error('Error fetching gastos:', err)
            console.error('Error details:', err.response?.data || err.message)
            setError('Error al cargar los gastos')
            toast.error('Error al cargar los gastos')
        } finally {
            setLoading(false)
        }
    }, [])

    // Crear nuevo gasto
    const createGasto = async (data) => {
        try {
            setLoading(true)

            // Preparar datos para enviar
            const gastoData = {
                fecha: data.fecha,
                descripcion_gasto: data.descripcion_gasto,
                monto_gasto: parseFloat(data.monto_gasto),
                categoria: data.categoria || null
            }

            console.log('Enviando datos:', gastoData) // Para debugging

            // IMPORTANTE: En desarrollo usa proxy, en producción URL directa
            const response = await axios.post(`${API_BASE_URL}/gastos`, gastoData)

            console.log('Respuesta creación:', response.data) // Para debugging

            // Tu API devuelve {success, data} o similar
            const responseData = response.data.success ? response.data.data : response.data

            // Agregar el nuevo gasto al estado
            const newGasto = {
                id_gasto: responseData.id_gasto || responseData.id,
                fecha: responseData.fecha,
                descripcion_gasto: responseData.descripcion_gasto,
                monto_gasto: parseFloat(responseData.monto_gasto),
                categoria: responseData.categoria,
                created_at: responseData.fecha_registro || responseData.created_at
            }

            setGastos(prev => [newGasto, ...prev])

            // Actualizar categorías si es nueva
            if (newGasto.categoria && !categorias.some(cat => cat.value === newGasto.categoria)) {
                setCategorias(prev => [...prev, {
                    value: newGasto.categoria,
                    label: newGasto.categoria
                }])
            }

            toast.success('Gasto registrado exitosamente')

            return newGasto
        } catch (err) {
            console.error('Error creating gasto:', err)
            console.error('Error details:', err.response?.data || err.message)
            toast.error('Error al registrar el gasto')
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Eliminar gasto
    const deleteGasto = async (id) => {
        try {
            setLoading(true)
            console.log(`Eliminando gasto ${id}`) // Para debugging

            // IMPORTANTE: En desarrollo usa proxy, en producción URL directa
            await axios.delete(`${API_BASE_URL}/gastos/${id}`)

            setGastos(prev => prev.filter(gasto => gasto.id_gasto !== id))
            toast.success('Gasto eliminado exitosamente')
        } catch (err) {
            console.error('Error deleting gasto:', err)
            console.error('Error details:', err.response?.data || err.message)
            toast.error('Error al eliminar el gasto')
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Cargar gastos al montar el componente
    useEffect(() => {
        fetchGastos()
    }, [fetchGastos])

    return {
        gastos,
        categorias,
        balance,
        dashboard,
        loading,
        error,
        fetchGastos,
        createGasto,
        deleteGasto
    }
}