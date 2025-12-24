import { useState, useCallback } from 'react';
import { gastosService } from '../services/gastosService';
import toast from 'react-hot-toast';

export const useGastos = () => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    // Obtener categorías
    const fetchCategorias = useCallback(async () => {
        try {
            return await gastosService.getCategorias();
        } catch (err) {
            console.error('Error al cargar categorías:', err);
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
        fetchGastos,
        createGasto,
        fetchCategorias,
        fetchBalance,
        fetchDashboard
    };
};