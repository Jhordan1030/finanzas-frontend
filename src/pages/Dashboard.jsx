import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGastos } from '../hooks/useGastos';
import { useIngresos } from '../hooks/useIngresos';
import StatsCards from '../components/dashboard/StatsCards';
import CalendarioTrabajo from '../components/dashboard/CalendarioTrabajo';
import RegistroRapido from '../components/dashboard/RegistroRapido';
import Modal from '../components/common/UI/Modal';
import Input from '../components/common/UI/Input';
import Select from '../components/common/UI/Select';
import Button from '../components/common/UI/Button';
import PDFButton from '../components/common/UI/PDFButton';
import {
    Filter,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Plus,
    Calendar,
    Tag,
    DollarSign,
    TrendingUp,
    TrendingDown,
    BarChart3,
    FileText,
    Download,
    Shield,
    HelpCircle,
    User,
    Mail,
    Phone,
    MapPin,
    Globe,
    Heart
} from 'lucide-react';
import {
    format,
    startOfMonth,
    subMonths,
    addMonths,
    eachMonthOfInterval,
    isSameMonth,
    differenceInDays,
    isWithinInterval,
    startOfDay,
    endOfMonth,
    isValid
} from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { pdfService } from '../services/pdfService';

const Dashboard = () => {
    // Hooks principales
    const {
        gastos: allGastos,
        loading: gastosLoading,
        createGasto,
        fetchGastos,
        deleteGasto,
        categorias: categoriasGastos,
        dashboard: dashboardGastos
    } = useGastos();

    const {
        ingresos: allIngresos,
        loading: ingresosLoading,
        createIngreso,
        fetchIngresos,
        deleteIngreso,
        dashboard: dashboardIngresos
    } = useIngresos();

    // Estados
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModalDia, setShowModalDia] = useState(false);
    const [showModalGasto, setShowModalGasto] = useState(false);
    const [showMonthFilter, setShowMonthFilter] = useState(false);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [registroLoading, setRegistroLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [mobileView, setMobileView] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        id: null,
        title: '',
        message: ''
    });

    // Detectar tamaño de pantalla
    useEffect(() => {
        const checkMobile = () => {
            setMobileView(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // FUNCIÓN PARA MANEJAR FECHAS
    const parsearFecha = (fechaString) => {
        try {
            // Si la fecha es un string YYYY-MM-DD
            if (typeof fechaString === 'string' && fechaString.includes('-')) {
                // Dividir la fecha
                const partes = fechaString.split('-');
                if (partes.length === 3) {
                    // Crear fecha local (NO UTC)
                    const año = parseInt(partes[0]);
                    const mes = parseInt(partes[1]) - 1; // Los meses en JS van de 0-11
                    const dia = parseInt(partes[2]);

                    const fechaLocal = new Date(año, mes, dia);

                    // Validar que la fecha sea válida
                    if (isValid(fechaLocal)) {
                        return startOfDay(fechaLocal);
                    }
                }
            }

            // Si no, intentar parsear normalmente
            const fecha = new Date(fechaString);
            if (isValid(fecha)) {
                return startOfDay(fecha);
            }

            return null;
        } catch (error) {
            console.error('Error parseando fecha:', fechaString, error);
            return null;
        }
    };

    // Obtener meses disponibles
    useEffect(() => {
        const getMonthsFromData = () => {
            try {
                const allDates = [];

                // Fechas de ingresos
                allIngresos.forEach(ingreso => {
                    if (ingreso?.fecha) {
                        const fecha = parsearFecha(ingreso.fecha);
                        if (fecha && !isNaN(fecha.getTime())) {
                            allDates.push(fecha);
                        }
                    }
                });

                // Fechas de gastos
                allGastos.forEach(gasto => {
                    if (gasto?.fecha) {
                        const fecha = parsearFecha(gasto.fecha);
                        if (fecha && !isNaN(fecha.getTime())) {
                            allDates.push(fecha);
                        }
                    }
                });

                if (allDates.length > 0) {
                    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
                    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

                    const meses = eachMonthOfInterval({
                        start: startOfMonth(minDate),
                        end: endOfMonth(maxDate)
                    }).reverse();

                    return meses;
                }
            } catch (error) {
                console.error('Error procesando fechas:', error);
            }

            // Por defecto: últimos 6 meses
            const currentMonth = startOfMonth(new Date());
            const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

            return eachMonthOfInterval({
                start: sixMonthsAgo,
                end: currentMonth
            }).reverse();
        };

        const months = getMonthsFromData();
        setAvailableMonths(months);
    }, [allIngresos, allGastos]);

    // Formularios
    const { register: registerDia, handleSubmit: handleSubmitDia, formState: { errors: errorsDia }, reset: resetDia } = useForm({
        defaultValues: {
            fecha: new Date().toISOString().split('T')[0],
            valor_ganado: '',
            descripcion_trabajo: ''
        }
    });

    const { register: registerGasto, handleSubmit: handleSubmitGasto, formState: { errors: errorsGasto }, reset: resetGasto } = useForm({
        defaultValues: {
            fecha: new Date().toISOString().split('T')[0],
            monto_gasto: '',
            descripcion_gasto: '',
            categoria: ''
        }
    });

    // Filtrar datos del mes
    const datosMesActual = useMemo(() => {
        const ingresosMes = allIngresos.filter(ingreso => {
            try {
                if (!ingreso?.fecha) return false;
                const fecha = parsearFecha(ingreso.fecha);
                if (!fecha) return false;
                return isSameMonth(fecha, currentDate);
            } catch {
                return false;
            }
        });

        const gastosMes = allGastos.filter(gasto => {
            try {
                if (!gasto?.fecha) return false;
                const fecha = parsearFecha(gasto.fecha);
                if (!fecha) return false;
                return isSameMonth(fecha, currentDate);
            } catch {
                return false;
            }
        });

        return { ingresosMes, gastosMes };
    }, [allIngresos, allGastos, currentDate]);

    // Calcular datos del mes anterior
    const mesAnterior = useMemo(() => subMonths(currentDate, 1), [currentDate]);

    const datosMesAnterior = useMemo(() => {
        const ingresosAnterior = allIngresos.filter(ingreso => {
            try {
                if (!ingreso?.fecha) return false;
                const fecha = parsearFecha(ingreso.fecha);
                if (!fecha) return false;
                return isSameMonth(fecha, mesAnterior);
            } catch {
                return false;
            }
        });

        const gastosAnterior = allGastos.filter(gasto => {
            try {
                if (!gasto?.fecha) return false;
                const fecha = parsearFecha(gasto.fecha);
                if (!fecha) return false;
                return isSameMonth(fecha, mesAnterior);
            } catch {
                return false;
            }
        });

        return { ingresosAnterior, gastosAnterior };
    }, [allIngresos, allGastos, mesAnterior]);

    // Calcular estadísticas - VERSIÓN CORREGIDA PARA DÍAS ÚNICOS
    const estadisticas = useMemo(() => {
        const { ingresosMes, gastosMes } = datosMesActual;
        const { ingresosAnterior, gastosAnterior } = datosMesAnterior;

        // Totales del mes actual
        const totalIngresos = ingresosMes.reduce((sum, ingreso) => {
            try {
                return sum + parseFloat(ingreso.valor_ganado || 0);
            } catch {
                return sum;
            }
        }, 0);

        const totalGastos = gastosMes.reduce((sum, gasto) => {
            try {
                return sum + parseFloat(gasto.monto_gasto || 0);
            } catch {
                return sum;
            }
        }, 0);

        const balance = totalIngresos - totalGastos;

        // CORREGIDO: Calcular días únicos trabajados (no total de registros)
        const diasUnicosTrabajados = new Set();
        ingresosMes.forEach(ingreso => {
            try {
                if (ingreso?.fecha) {
                    const fecha = parsearFecha(ingreso.fecha);
                    if (fecha) {
                        const fechaKey = format(fecha, 'yyyy-MM-dd');
                        diasUnicosTrabajados.add(fechaKey);
                    }
                }
            } catch {
                // Ignorar errores
            }
        });
        const diasTrabajados = diasUnicosTrabajados.size;

        const diasMes = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const porcentajeTrabajo = diasMes > 0 ? ((diasTrabajados / diasMes) * 100).toFixed(1) : 0;

        // Calcular días hasta fin de mes
        const hoy = new Date();
        const finDeMes = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const diasRestantes = Math.max(0, differenceInDays(finDeMes, hoy) + 1);

        // Últimos 7 días - VERSIÓN CORREGIDA para días únicos
        const sieteDiasAtras = subMonths(hoy, 7);
        const ingresosUltimaSemanaSet = new Set();
        allIngresos.forEach(ingreso => {
            try {
                if (!ingreso?.fecha) return;
                const fecha = parsearFecha(ingreso.fecha);
                if (!fecha) return;
                if (isWithinInterval(fecha, { start: sieteDiasAtras, end: hoy })) {
                    const fechaKey = format(fecha, 'yyyy-MM-dd');
                    ingresosUltimaSemanaSet.add(fechaKey);
                }
            } catch {
                // Ignorar errores
            }
        });
        const ingresosUltimaSemana = ingresosUltimaSemanaSet.size;

        // Totales del mes anterior
        const totalIngresosAnterior = ingresosAnterior.reduce((sum, ingreso) => {
            try {
                return sum + parseFloat(ingreso.valor_ganado || 0);
            } catch {
                return sum;
            }
        }, 0);

        const totalGastosAnterior = gastosAnterior.reduce((sum, gasto) => {
            try {
                return sum + parseFloat(gasto.monto_gasto || 0);
            } catch {
                return sum;
            }
        }, 0);

        // Calcular porcentajes REALES
        let cambioIngresos = 0;
        if (totalIngresosAnterior > 0) {
            cambioIngresos = ((totalIngresos - totalIngresosAnterior) / totalIngresosAnterior * 100);
        } else if (totalIngresos > 0) {
            cambioIngresos = 100; // Si no había ingresos antes y ahora sí, es un aumento del 100%
        }

        let cambioGastos = 0;
        if (totalGastosAnterior > 0) {
            cambioGastos = ((totalGastos - totalGastosAnterior) / totalGastosAnterior * 100);
        } else if (totalGastos > 0) {
            cambioGastos = 100; // Si no había gastos antes y ahora sí, es un aumento del 100%
        }

        // Gastos por categoría
        const gastosPorCategoria = {};
        gastosMes.forEach(gasto => {
            const categoria = gasto.categoria || 'Sin categoría';
            gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + parseFloat(gasto.monto_gasto || 0);
        });

        // Ordenar ingresos por fecha (más reciente primero)
        const ingresosOrdenados = [...ingresosMes].sort((a, b) => {
            try {
                const fechaA = parsearFecha(a.fecha);
                const fechaB = parsearFecha(b.fecha);
                if (!fechaA || !fechaB) return 0;
                return fechaB.getTime() - fechaA.getTime();
            } catch {
                return 0;
            }
        });

        // Ordenar gastos por fecha (más reciente primero)
        const gastosOrdenados = [...gastosMes].sort((a, b) => {
            try {
                const fechaA = parsearFecha(a.fecha);
                const fechaB = parsearFecha(b.fecha);
                if (!fechaA || !fechaB) return 0;
                return fechaB.getTime() - fechaA.getTime();
            } catch {
                return 0;
            }
        });

        return {
            totalIngresos,
            totalGastos,
            balance,
            diasTrabajados, // Ahora son días únicos, no total de registros
            diasMes,
            porcentajeTrabajo,
            diasRestantes,
            ingresosUltimaSemana, // Ahora son días únicos de la semana
            gastosPorCategoria,
            ingresosMes: ingresosOrdenados,
            gastosMes: gastosOrdenados,
            totalRegistrosIngresos: ingresosMes.length, // Nuevo: total de registros
            totalRegistrosGastos: gastosMes.length,     // Nuevo: total de registros
            // Datos reales para estadísticas:
            totalIngresosAnterior,
            totalGastosAnterior,
            cambioIngresos: parseFloat(cambioIngresos.toFixed(1)),
            cambioGastos: parseFloat(cambioGastos.toFixed(1))
        };
    }, [datosMesActual, datosMesAnterior, allIngresos, currentDate]);

    // Manejar registros
    const handleRegistroDia = async (data) => {
        setRegistroLoading(true);
        try {
            const formattedData = {
                ...data,
                valor_ganado: parseFloat(data.valor_ganado),
                descripcion_trabajo: data.descripcion_trabajo || null
            };
            await createIngreso(formattedData);
            await fetchIngresos();
            resetDia();
            setShowModalDia(false);
            toast.success('¡Día trabajado registrado!');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al registrar día trabajado');
        } finally {
            setRegistroLoading(false);
        }
    };

    const handleRegistroGasto = async (data) => {
        setRegistroLoading(true);
        try {
            const formattedData = {
                ...data,
                monto_gasto: parseFloat(data.monto_gasto),
                categoria: data.categoria || null
            };
            await createGasto(formattedData);
            await fetchGastos();
            resetGasto();
            setShowModalGasto(false);
            toast.success('¡Gasto registrado!');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al registrar gasto');
        } finally {
            setRegistroLoading(false);
        }
    };

    // Refrescar datos
    const handleRefresh = async () => {
        try {
            await Promise.all([fetchIngresos(), fetchGastos()]);
            toast.success('Datos actualizados');
        } catch (error) {
            toast.error('Error al actualizar');
        }
    };

    // Generar PDF del dashboard
    const handleGenerarPDFDashboard = async () => {
        setPdfLoading(true);
        try {
            const fechaInicio = format(startOfMonth(currentDate), 'dd/MM/yyyy');
            const fechaFin = format(endOfMonth(currentDate), 'dd/MM/yyyy');
            const mesActual = format(currentDate, 'MMMM yyyy', { locale: es });

            // Validar que haya datos para generar el PDF
            if (!estadisticas || estadisticas.totalIngresos === 0 && estadisticas.totalGastos === 0) {
                toast.error('No hay datos para generar el PDF');
                setPdfLoading(false);
                return;
            }

            // Generar el PDF
            const doc = pdfService.generarPDFDashboard(
                estadisticas,
                {
                    mes: mesActual,
                    fechaInicio,
                    fechaFin
                }
            );

            if (!doc) {
                toast.error('Error al generar el PDF');
                setPdfLoading(false);
                return;
            }

            // Guardar el PDF
            const filename = `Dashboard_Financiero_${format(currentDate, 'yyyy_MM')}.pdf`;
            doc.save(filename);

            toast.success('PDF generado exitosamente');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast.error('Error al generar PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    // Generar PDF de días trabajados
    const handleGenerarPDFDiasTrabajados = () => {
        if (estadisticas.ingresosMes.length === 0) {
            toast.error('No hay días trabajados para generar PDF');
            return;
        }
        setPdfLoading(true);
        try {
            const fechaInicio = format(startOfMonth(currentDate), 'dd/MM/yyyy');
            const fechaFin = format(endOfMonth(currentDate), 'dd/MM/yyyy');
            const doc = pdfService.generarPDFDiasTrabajados(
                estadisticas.ingresosMes,
                fechaInicio,
                fechaFin
            );
            doc.save(`Dias_Trabajados_${format(currentDate, 'yyyy_MM')}.pdf`);
            toast.success('PDF de días trabajados generado');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast.error('Error al generar PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    // Generar PDF de gastos
    const handleGenerarPDFGastos = () => {
        if (estadisticas.gastosMes.length === 0) {
            toast.error('No hay gastos para generar PDF');
            return;
        }
        setPdfLoading(true);
        try {
            const fechaInicio = format(startOfMonth(currentDate), 'dd/MM/yyyy');
            const fechaFin = format(endOfMonth(currentDate), 'dd/MM/yyyy');
            const doc = pdfService.generarPDFGastos(
                estadisticas.gastosMes,
                fechaInicio,
                fechaFin
            );
            doc.save(`Gastos_${format(currentDate, 'yyyy_MM')}.pdf`);
            toast.success('PDF de gastos generado');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast.error('Error al generar PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    // Formatear fecha
    const formatFecha = (fechaString) => {
        try {
            const fecha = parsearFecha(fechaString);
            if (!fecha) return 'Fecha inválida';

            return fecha.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return 'Fecha inválida';
        }
    };

    // Formatear número
    const formatNumero = (valor) => {
        try {
            const numero = parseFloat(valor || 0);
            return numero.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } catch {
            return '$0.00';
        }
    };

    // Loading
    if (ingresosLoading || gastosLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h1>
                    <p className="text-gray-600">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        {estadisticas.totalRegistrosIngresos || 0} registro(s) en {estadisticas.diasTrabajados || 0} día(s) trabajado(s)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <PDFButton
                        onClick={handleGenerarPDFDashboard}
                        loading={pdfLoading}
                        variant="secondary"
                        size="small"
                        className="flex items-center"
                        data={{
                            estadisticas,
                            ingresos: estadisticas.ingresosMes,
                            gastos: estadisticas.gastosMes,
                            currentDate
                        }}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">PDF</span>
                    </PDFButton>

                    <Button
                        onClick={handleRefresh}
                        variant="ghost"
                        size="small"
                        className="flex items-center"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Actualizar</span>
                    </Button>
                </div>
            </div>

            {/* Filtro de Mes */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Filter className="h-5 w-5 text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-700">Filtrar por Mes</h3>
                    </div>
                    <div className="relative">
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={() => setShowMonthFilter(!showMonthFilter)}
                            className="flex items-center gap-2"
                        >
                            <Calendar className="h-4 w-4" />
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                            {showMonthFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>

                        {showMonthFilter && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <div className="p-2 max-h-60 overflow-y-auto">
                                    {availableMonths.map((month, index) => (
                                        <button
                                            key={index}
                                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                                                isSameMonth(month, currentDate) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                            }`}
                                            onClick={() => {
                                                setCurrentDate(month);
                                                setShowMonthFilter(false);
                                            }}
                                        >
                                            {format(month, 'MMMM yyyy', { locale: es })}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <StatsCards
                balance={{
                    total: estadisticas.balance,
                    ingresos: estadisticas.totalIngresos,
                    gastos: estadisticas.totalGastos
                }}
                cambioIngresos={estadisticas.cambioIngresos}
                cambioGastos={estadisticas.cambioGastos}
                loading={gastosLoading || ingresosLoading}
            />

            {/* Calendario de Trabajo */}
            <CalendarioTrabajo
                diasTrabajados={estadisticas.ingresosMes}
                currentDate={currentDate}
                onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
                onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
            />

            {/* Registro Rápido */}
            <RegistroRapido
                onRegistroDia={handleRegistroDia}
                onRegistroGasto={handleRegistroGasto}
                loading={registroLoading}
                categoriasGastos={Array.isArray(categoriasGastos) ? categoriasGastos.map(cat => cat?.value || cat) : []}
                onOpenModalDia={() => setShowModalDia(true)}
                onOpenModalGasto={() => setShowModalGasto(true)}
            />

            {/* Últimos Registros */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Últimos Ingresos */}
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Últimos Días Trabajados</h2>
                                    <p className="text-sm text-gray-500">
                                        {estadisticas.totalRegistrosIngresos || 0} registro(s) total
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="small"
                                    variant="ghost"
                                    onClick={() => setShowModalDia(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="ml-2 hidden sm:inline">Nuevo</span>
                                </Button>
                                <PDFButton
                                    size="small"
                                    variant="ghost"
                                    loading={pdfLoading}
                                    onClick={handleGenerarPDFDiasTrabajados}
                                    className="p-2"
                                >
                                    <FileText className="h-4 w-4" />
                                </PDFButton>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {estadisticas.ingresosMes.slice(0, 5).map((ingreso, index) => (
                            <div key={ingreso.id_ingreso || index} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {ingreso.descripcion_trabajo || 'Sin descripción'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {formatFecha(ingreso.fecha)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                        <span className="font-bold text-green-600">
                                            {formatNumero(ingreso.valor_ganado)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {estadisticas.ingresosMes.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No hay días trabajados este mes</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Últimos Gastos */}
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Últimos Gastos</h2>
                                    <p className="text-sm text-gray-500">
                                        {estadisticas.totalRegistrosGastos || 0} registro(s) total
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="small"
                                    variant="ghost"
                                    onClick={() => setShowModalGasto(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="ml-2 hidden sm:inline">Nuevo</span>
                                </Button>
                                <PDFButton
                                    size="small"
                                    variant="ghost"
                                    loading={pdfLoading}
                                    onClick={handleGenerarPDFGastos}
                                    className="p-2"
                                >
                                    <FileText className="h-4 w-4" />
                                </PDFButton>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {estadisticas.gastosMes.slice(0, 5).map((gasto, index) => (
                            <div key={gasto.id_gasto || index} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 truncate">
                                                {gasto.descripcion_gasto || 'Sin descripción'}
                                            </p>
                                            {gasto.categoria && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded whitespace-nowrap">
                                                    {gasto.categoria}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {formatFecha(gasto.fecha)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                        <span className="font-bold text-red-600">
                                            {formatNumero(gasto.monto_gasto)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {estadisticas.gastosMes.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No hay gastos este mes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER PROFESIONAL */}
            <footer className="bg-white text-gray-800 border-t border-gray-200 rounded-2xl overflow-hidden mt-8 shadow-lg">
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                                    <span className="text-white font-bold text-lg">FT</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Finanzas Tracker</h3>
                                    <p className="text-sm text-gray-600">Control total de tus finanzas</p>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                                La solución completa para gestionar tus ingresos, gastos y finanzas personales de manera profesional.
                            </p>
                            <div className="flex items-center gap-4">
                                <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                                    <Globe className="h-5 w-5" />
                                </button>
                                <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                                    <User className="h-5 w-5" />
                                </button>
                                <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                                    <Mail className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-cyan-600" />
                                Enlaces Rápidos
                            </h4>
                            <ul className="space-y-3">
                                <li>
                                    <a href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 bg-cyan-600 rounded-full"></span>
                                        Dashboard Principal
                                    </a>
                                </li>
                                <li>
                                    <a href="/ingresos" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 bg-green-600 rounded-full"></span>
                                        Registro de Ingresos
                                    </a>
                                </li>
                                <li>
                                    <a href="/gastos" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 bg-red-600 rounded-full"></span>
                                        Control de Gastos
                                    </a>
                                </li>
                                <li>
                                    <a href="/reportes" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 bg-purple-600 rounded-full"></span>
                                        Reportes Avanzados
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-cyan-600" />
                                Soporte
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="text-gray-900 font-medium">soporte@finanzastracker.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Teléfono</p>
                                        <p className="text-gray-900 font-medium">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Ubicación</p>
                                        <p className="text-gray-900 font-medium">Ciudad, País</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:hidden"></div>
                    </div>
                </div>

                <div className="border-t border-gray-200"></div>

                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-gray-600 text-sm">
                                © {new Date().getFullYear()} Finanzas Tracker. Todos los derechos reservados.
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                                Versión 2.1.0 • Sistema de gestión financiera profesional
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <a href="/privacidad" className="text-gray-600 hover:text-gray-900 text-sm transition-colors flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Privacidad
                            </a>
                            <a href="/terminos" className="text-gray-600 hover:text-gray-900 text-sm transition-colors flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Términos
                            </a>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
                            <Heart className="h-3 w-3 text-red-500" />
                            Desarrollado con pasión para mejorar tu salud financiera
                        </p>
                    </div>
                </div>
            </footer>

            {/* Modales */}
            {/* Modal Día Trabajado */}
            <Modal
                isOpen={showModalDia}
                onClose={() => {
                    setShowModalDia(false);
                    resetDia();
                }}
                title="Registrar Día Trabajado"
                size="md"
            >
                <form onSubmit={handleSubmitDia(handleRegistroDia)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Fecha*"
                            type="date"
                            {...registerDia('fecha', { required: 'La fecha es requerida' })}
                            error={errorsDia.fecha?.message}
                        />
                        <Input
                            label="Valor ganado ($)*"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            min="0.01"
                            {...registerDia('valor_ganado', {
                                required: 'El valor es requerido',
                                min: { value: 0.01, message: 'Debe ser mayor a 0' }
                            })}
                            error={errorsDia.valor_ganado?.message}
                        />
                    </div>

                    <Input
                        label="Descripción (opcional)"
                        placeholder="¿En qué trabajaste hoy?"
                        {...registerDia('descripcion_trabajo', {
                            maxLength: { value: 255, message: 'Máximo 255 caracteres' }
                        })}
                        error={errorsDia.descripcion_trabajo?.message}
                    />

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            loading={registroLoading}
                            className="flex-1"
                        >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Registrar Día
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowModalDia(false)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Gasto */}
            <Modal
                isOpen={showModalGasto}
                onClose={() => {
                    setShowModalGasto(false);
                    resetGasto();
                }}
                title="Registrar Gasto"
                size="md"
            >
                <form onSubmit={handleSubmitGasto(handleRegistroGasto)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Fecha*"
                            type="date"
                            {...registerGasto('fecha', { required: 'La fecha es requerida' })}
                            error={errorsGasto.fecha?.message}
                        />
                        <Input
                            label="Monto ($)*"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            min="0.01"
                            {...registerGasto('monto_gasto', {
                                required: 'El monto es requerido',
                                min: { value: 0.01, message: 'Debe ser mayor a 0' }
                            })}
                            error={errorsGasto.monto_gasto?.message}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Categoría"
                            options={Array.isArray(categoriasGastos) ? categoriasGastos.map(cat => cat?.value || cat) : []}
                            {...registerGasto('categoria')}
                            error={errorsGasto.categoria?.message}
                        />
                        <Input
                            label="Descripción*"
                            placeholder="¿En qué gastaste?"
                            {...registerGasto('descripcion_gasto', {
                                required: 'La descripción es requerida',
                                maxLength: { value: 255, message: 'Máximo 255 caracteres' }
                            })}
                            error={errorsGasto.descripcion_gasto?.message}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            loading={registroLoading}
                            className="flex-1"
                        >
                            <Tag className="h-4 w-4 mr-2" />
                            Registrar Gasto
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowModalGasto(false)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Dashboard;