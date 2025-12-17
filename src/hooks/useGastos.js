import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

// CONFIGURACIÓN CORRECTA PARA PROXY DE VITE
const API_BASE_URL = import.meta.env.MODE === 'development' ? '/api' : 'https://trabajotracker-backend.vercel.app/api'

// CATEGORÍAS POR DEFECTO
const CATEGORIAS_POR_DEFECTO = [
    { value: 'alimentacion', label: '🍔 Alimentación' },
    { value: 'transporte', label: '🚗 Transporte' },
    { value: 'vivienda', label: '🏠 Vivienda' },
    { value: 'servicios', label: '💡 Servicios' },
    { value: 'ocio', label: '🎮 Ocio' },
    { value: 'salud', label: '🏥 Salud' },
    { value: 'educacion', label: '📚 Educación' },
    { value: 'ropa', label: '👕 Ropa' },
    { value: 'tecnologia', label: '💻 Tecnología' },
    { value: 'supermercado', label: '🛒 Supermercado' },
    { value: 'restaurante', label: '🍽️ Restaurante' },
    { value: 'gimnasio', label: '🏋️ Gimnasio' },
    { value: 'viajes', label: '✈️ Viajes' },
    { value: 'seguro', label: '🛡️ Seguro' },
    { value: 'impuestos', label: '💰 Impuestos' },
    { value: 'otros', label: '📦 Otros' }
]

export const useGastos = () => {
    const [gastos, setGastos] = useState([])
    const [categorias, setCategorias] = useState(CATEGORIAS_POR_DEFECTO)
    const [balance, setBalance] = useState({ total: 0, ingresos: 0, gastos: 0 })
    const [dashboard, setDashboard] = useState({ ultimosGastos: [] })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch todos los gastos
    const fetchGastos = useCallback(async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_BASE_URL}/gastos`)

            let gastosData = []
            if (response.data && response.data.success) {
                gastosData = response.data.data || []
            } else if (Array.isArray(response.data)) {
                gastosData = response.data
            }

            // Mapear los datos
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

            // Actualizar categorías
            const categoriasDeGastos = [...new Set(mappedGastos
                .filter(gasto => gasto.categoria)
                .map(gasto => gasto.categoria)
            )].map(cat => ({ value: cat, label: cat }))

            const todasCategorias = [...CATEGORIAS_POR_DEFECTO]
            categoriasDeGastos.forEach(catGasto => {
                const existe = todasCategorias.some(catDef => catDef.value === catGasto.value)
                if (!existe) {
                    todasCategorias.push(catGasto)
                }
            })

            setCategorias(todasCategorias)
            setError(null)
        } catch (err) {
            console.error('Error fetching gastos:', err)
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
            const gastoData = {
                fecha: data.fecha,
                descripcion_gasto: data.descripcion_gasto,
                monto_gasto: parseFloat(data.monto_gasto),
                categoria: data.categoria || null
            }

            const response = await axios.post(`${API_BASE_URL}/gastos`, gastoData)
            const responseData = response.data.success ? response.data.data : response.data

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
                const nuevaCategoria = { value: newGasto.categoria, label: newGasto.categoria }
                setCategorias(prev => [...prev, nuevaCategoria])
            }

            toast.success('Gasto registrado exitosamente')
            return newGasto
        } catch (err) {
            console.error('Error creating gasto:', err)
            toast.error('Error al registrar el gasto')
            throw err
        } finally {
            setLoading(false)
        }
    }

    // ✅ NUEVA: Actualizar gasto
    const updateGasto = async (id, data) => {
        try {
            setLoading(true)
            const gastoData = {
                fecha: data.fecha,
                descripcion_gasto: data.descripcion_gasto,
                monto_gasto: parseFloat(data.monto_gasto),
                categoria: data.categoria || null
            }

            const response = await axios.put(`${API_BASE_URL}/gastos/${id}`, gastoData)
            const responseData = response.data.success ? response.data.data : response.data

            // Actualizar el gasto en el estado local
            setGastos(prev => prev.map(gasto =>
                gasto.id_gasto === id
                    ? {
                        ...gasto,
                        ...responseData,
                        monto_gasto: parseFloat(responseData.monto_gasto)
                    }
                    : gasto
            ))

            toast.success('Gasto actualizado exitosamente')
            return responseData
        } catch (err) {
            console.error('Error updating gasto:', err)
            toast.error('Error al actualizar el gasto')
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Eliminar gasto
    const deleteGasto = async (id) => {
        try {
            setLoading(true)
            await axios.delete(`${API_BASE_URL}/gastos/${id}`)
            setGastos(prev => prev.filter(gasto => gasto.id_gasto !== id))
            toast.success('Gasto eliminado exitosamente')
        } catch (err) {
            console.error('Error deleting gasto:', err)
            toast.error('Error al eliminar el gasto')
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Cargar gastos al montar
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
        updateGasto, // ✅ Añadir esto
        deleteGasto
    }
}