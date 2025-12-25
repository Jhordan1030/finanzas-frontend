import { useState, useCallback, useEffect } from 'react';
import { gastosService } from '../services/gastosService';
import toast from 'react-hot-toast';

const DEFAULT_CATEGORIES = [
    { value: 'alimentacion', label: '🍔 Alimentación' },
    { value: 'transporte', label: '🚗 Transporte' },
    { value: 'vivienda', label: '🏠 Vivienda' },
    { value: 'servicios', label: '💡 Servicios' },
    { value: 'entretenimiento', label: '🎬 Entretenimiento' },
    { value: 'salud', label: '🏥 Salud' },
    { value: 'educacion', label: '📚 Educación' },
    { value: 'otros', label: '📦 Otros' }
];

export const useGastos = () => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categorias, setCategorias] = useState(DEFAULT_CATEGORIES);

    // Initial load of categories
    useEffect(() => {
        fetchCategorias();
    }, []);

    // Obtener todos los gastos
    const fetchGastos = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await gastosService.getGastos(params);
            setGastos(data);
            return data;
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al cargar gastos';
            setError(errorMsg);
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear gasto
    const createGasto = useCallback(async (gastoData) => {
        setLoading(true);
        try {
            const nuevoGasto = await gastosService.createGasto(gastoData);
            setGastos(prev => [nuevoGasto, ...prev]);
            toast.success('Gasto creado exitosamente');
            return nuevoGasto;
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al crear gasto';
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update gasto
    const updateGasto = useCallback(async (id, gastoData) => {
        setLoading(true);
        try {
            const gastoActualizado = await gastosService.updateGasto(id, gastoData);
            setGastos(prev => prev.map(g => g.id_gasto === id ? gastoActualizado : g));
            return gastoActualizado;
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al actualizar gasto';
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete gasto
    const deleteGasto = useCallback(async (id) => {
        setLoading(true);
        try {
            await gastosService.deleteGasto(id);
            setGastos(prev => prev.filter(g => g.id_gasto !== id));
            return true;
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al eliminar gasto';
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener categorías
    const fetchCategorias = useCallback(async () => {
        try {
            const data = await gastosService.getCategorias();
            if (Array.isArray(data) && data.length > 0) {
                setCategorias(data);
            }
            return data;
        } catch (err) {
            console.error('Error al cargar categorías:', err);
            // Don't modify categories on error, keep defaults
            return [];
        }
    }, []);

    // Obtener balance
    const fetchBalance = useCallback(async () => {
        try {
            return await gastosService.getBalance();
        } catch (err) {
            console.error('Error al cargar balance:', err);
            throw err;
        }
    }, []);

    // Obtener dashboard
    const fetchDashboard = useCallback(async () => {
        try {
            return await gastosService.getDashboard();
        } catch (err) {
            console.error('Error al cargar dashboard:', err);
            throw err;
        }
    }, []);

    return {
        gastos,
        loading,
        error,
        categorias,
        fetchGastos,
        createGasto,
        updateGasto,
        deleteGasto,
        fetchCategorias,
        fetchBalance,
        fetchDashboard
    };
};