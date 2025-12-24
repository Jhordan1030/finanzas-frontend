import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export const useAuth = () => {
    const [user, setUser] = useState(() => authService.getCurrentUser());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Verificar autenticación al cargar
    useEffect(() => {
        const checkAuth = () => {
            const isAuth = authService.isAuthenticated();

            // Redirigir si no está autenticado y no está en login/register
            if (!isAuth &&
                !window.location.pathname.includes('/login') &&
                !window.location.pathname.includes('/register')) {

                navigate('/login');
            }
        };

        checkAuth();

        // Escuchar cambios en localStorage
        const handleStorageChange = () => {
            setUser(authService.getCurrentUser());
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [navigate]);

    // Login
    const login = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const response = await authService.signin({ email, password });
            const { token, usuario } = response;

            if (!token || !usuario) {
                throw new Error('Respuesta inválida del servidor');
            }

            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(usuario));
            localStorage.setItem('login_time', Date.now().toString());

            setUser(usuario);
            toast.success(`¡Bienvenido ${usuario.nombre}!`);
            navigate('/');

            return { success: true, user: usuario };
        } catch (error) {
            const errorMsg = error?.mensaje || 'Error de autenticación. Verifica tus credenciales.';
            setError(errorMsg);
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Registro
    const register = useCallback(async (userData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await authService.signup(userData);
            const { token, usuario } = response;

            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(usuario));

            setUser(usuario);
            toast.success('¡Registro exitoso!');
            navigate('/');

            return { success: true, user: usuario };
        } catch (error) {
            const errorMsg = error?.mensaje || 'Error en el registro';
            setError(errorMsg);
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Logout
    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
        setError(null);
        toast.success('Sesión cerrada correctamente');
        navigate('/login');
    }, [navigate]);

    // Obtener perfil
    const getProfile = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authService.getProfile();
            const updatedUser = response.usuario;

            setUser(updatedUser);
            localStorage.setItem('user_data', JSON.stringify(updatedUser));

            return response;
        } catch (error) {
            const errorMsg = error?.mensaje || 'Error obteniendo perfil';
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Actualizar perfil
    const updateProfile = useCallback(async (profileData) => {
        setLoading(true);
        try {
            const response = await authService.updateProfile(profileData);
            const updatedUser = { ...user, ...response.usuario };

            setUser(updatedUser);
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
            toast.success('Perfil actualizado correctamente');

            return response;
        } catch (error) {
            const errorMsg = error?.mensaje || 'Error actualizando perfil';
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Cambiar contraseña
    const changePassword = useCallback(async (currentPassword, newPassword) => {
        setLoading(true);
        try {
            const response = await authService.changePassword({
                currentPassword,
                newPassword
            });

            toast.success('Contraseña cambiada correctamente');
            return response;
        } catch (error) {
            const errorMsg = error?.mensaje || 'Error cambiando contraseña';
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isAdmin: user?.rol === 'admin',
        login,
        register,
        logout,
        getProfile,
        updateProfile,
        changePassword,
        clearError: () => setError(null)
    };
};