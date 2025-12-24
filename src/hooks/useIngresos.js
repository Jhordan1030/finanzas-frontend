import { useState, useCallback } from 'react';
import { ingresosService } from '../services/ingresosService';
import toast from 'react-hot-toast';

export const useIngresos = () => {
    const [ingresos, setIngresos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Obtener todos los ingresos
    const fetchIngresos = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await ingresosService.getIngresos(params);
            setIngresos(data);
            return data;
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al cargar ingresos';
            setError(errorMsg);
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear ingreso
    const createIngreso = useCallback(async (ingresoData) => {
        setLoading(true);
        try {
            const nuevoIngreso = await ingresosService.createIngreso(ingresoData);
            setIngresos(prev => [nuevoIngreso, ...prev]);
            toast.success('Ingreso creado exitosamente');
            return nuevoIngreso;
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al crear ingreso';
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Actualizar ingreso
    const updateIngreso = useCallback(async (id, ingresoData) => {
        setLoading(true);
        try {
            const ingresoActualizado = await ingresosService.updateIngreso(id, ingresoData);
            setIngresos(prev =>
                prev.map(ingreso =>
                    ingreso.id_ingreso === id ? ingresoActualizado : ingreso
                )
            );
            toast.success('Ingreso actualizado exitosamente');
            return ingresoActualizado;
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al actualizar ingreso';
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Eliminar ingreso
    const deleteIngreso = useCallback(async (id) => {
        setLoading(true);
        try {
            await ingresosService.deleteIngreso(id);
            setIngresos(prev => prev.filter(ingreso => ingreso.id_ingreso !== id));
            toast.success('Ingreso eliminado exitosamente');
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al eliminar ingreso';
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener resumen mensual
    const fetchResumenMensual = useCallback(async () => {
        setLoading(true);
        try {
            return await ingresosService.getResumenMensual();
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al cargar resumen mensual';
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener total de ingresos
    const fetchTotalIngresos = useCallback(async () => {
        try {
            return await ingresosService.getTotalIngresos();
        } catch (err) {
            console.error('Error al cargar total de ingresos:', err);
            throw err;
        }
    }, []);

    // Obtener últimos ingresos
    const fetchUltimosIngresos = useCallback(async (limit = 5) => {
        try {
            return await ingresosService.getUltimosIngresos(limit);
        } catch (err) {
            console.error('Error al cargar últimos ingresos:', err);
            throw err;
        }
    }, []);

    // Obtener estadísticas admin (solo admin)
    const fetchEstadisticasAdmin = useCallback(async () => {
        setLoading(true);
        try {
            return await ingresosService.getEstadisticasAdmin();
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al cargar estadísticas';
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        ingresos,
        loading,
        error,
        fetchIngresos,
        createIngreso,
        updateIngreso,
        deleteIngreso,
        fetchResumenMensual,
        fetchTotalIngresos,
        fetchUltimosIngresos,
        fetchEstadisticasAdmin
    };
};