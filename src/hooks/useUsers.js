import { useState, useCallback } from 'react';
import { usersService } from '../services/usersService';
import toast from 'react-hot-toast';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Obtener todos los usuarios
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await usersService.getAllUsers();
            setUsers(data);
            return data;
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al cargar usuarios';
            setError(errorMsg);
            toast.error(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener estadísticas de usuarios
    const fetchUserStats = useCallback(async () => {
        try {
            return await usersService.getUserStats();
        } catch (err) {
            const errorMsg = err?.mensaje || 'Error al cargar estadísticas';
            toast.error(errorMsg);
            throw err;
        }
    }, []);

    // Health check
    const checkHealth = useCallback(async () => {
        try {
            return await usersService.healthCheck();
        } catch (err) {
            console.error('Health check failed:', err);
            throw err;
        }
    }, []);

    return {
        users,
        loading,
        error,
        fetchUsers,
        fetchUserStats,
        checkHealth
    };
};
