import React, { useState, useMemo, useEffect, useCallback } from 'react'
import StatsCards from '../components/dashboard/StatsCards'
import Modal from '../components/common/UI/Modal'
import Button from '../components/common/UI/Button'
import Input from '../components/common/UI/Input'
import Select from '../components/common/UI/Select'
import { useGastos } from '../hooks/useGastos'
import { useIngresos } from '../hooks/useIngresos'
import { ChevronLeft, ChevronRight, Plus, Calendar, Tag, DollarSign, TrendingUp, TrendingDown, FileText, Download, RefreshCw, Edit, Trash2, MoreVertical, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, subMonths, addMonths, parseISO, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Función para obtener fecha actual
const obtenerFechaActual = () => {
    const hoy = new Date();
    // Ajustar a la zona horaria local
    const fechaAjustada = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000));
    return fechaAjustada.toISOString().split('T')[0];
};

const Dashboard = () => {
    const {
        balance,
        dashboard,
        loading: gastosLoading,
        createGasto,
        fetchGastos,
        deleteGasto,
        categorias: categoriasGastos,
        gastos: allGastos
    } = useGastos()

    const {
        ingresos: allIngresos,
        loading: ingresosLoading,
        createIngreso,
        fetchIngresos,
        deleteIngreso
    } = useIngresos()

    const [currentDate, setCurrentDate] = useState(new Date())
    const [showModalDia, setShowModalDia] = useState(false)
    const [showModalGasto, setShowModalGasto] = useState(false)
    const [registroLoading, setRegistroLoading] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [mobileView, setMobileView] = useState(false)
    const [showMonthFilter, setShowMonthFilter] = useState(false)
    const [availableMonths, setAvailableMonths] = useState([])

    // Estado para modal de confirmación
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // 'ingreso' | 'gasto'
        id: null,
        title: '',
        message: ''
    })

    // Detectar tamaño de pantalla
    useEffect(() => {
        const checkMobile = () => {
            setMobileView(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Obtener meses disponibles basados en los datos
    useEffect(() => {
        if (allIngresos.length > 0 || allGastos.length > 0) {
            const allDates = []

            // Obtener fechas de ingresos
            allIngresos.forEach(ingreso => {
                if (ingreso?.fecha) {
                    const fecha = parsearFechaUTC(ingreso.fecha)
                    if (fecha && !isNaN(fecha.getTime())) {
                        allDates.push(fecha)
                    }
                }
            })

            // Obtener fechas de gastos
            allGastos.forEach(gasto => {
                if (gasto?.fecha) {
                    const fecha = parsearFechaUTC(gasto.fecha)
                    if (fecha && !isNaN(fecha.getTime())) {
                        allDates.push(fecha)
                    }
                }
            })

            if (allDates.length > 0) {
                const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
                const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

                const months = eachMonthOfInterval({
                    start: startOfMonth(minDate),
                    end: endOfMonth(maxDate)
                }).reverse()

                setAvailableMonths(months)
            } else {
                // Si no hay datos, mostrar solo el mes actual y los últimos 6 meses
                const currentMonth = startOfMonth(new Date())
                const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5))

                const months = eachMonthOfInterval({
                    start: sixMonthsAgo,
                    end: currentMonth
                }).reverse()

                setAvailableMonths(months)
            }
        } else {
            // Si no hay datos, mostrar solo el mes actual
            setAvailableMonths([startOfMonth(new Date())])
        }
    }, [allIngresos, allGastos])

    // Obtener configuración regional del dispositivo
    const userLocale = navigator.language || 'es-ES'
    const userLanguage = userLocale.split('-')[0]

    // Seleccionar locale basado en el idioma del usuario
    const getLocale = () => {
        switch (userLanguage) {
            case 'es': return es
            case 'en': return {} // inglés por defecto
            default: return es
        }
    }

    const currentLocale = getLocale()

    // Formularios con react-hook-form
    const {
        register: registerDia,
        handleSubmit: handleSubmitDia,
        formState: { errors: errorsDia },
        reset: resetDia
    } = useForm({
        defaultValues: {
            fecha: obtenerFechaActual(),
            valor_ganado: '',
            descripcion_trabajo: ''
        }
    })

    const {
        register: registerGasto,
        handleSubmit: handleSubmitGasto,
        formState: { errors: errorsGasto },
        reset: resetGasto
    } = useForm({
        defaultValues: {
            fecha: obtenerFechaActual(),
            monto_gasto: '',
            descripcion_gasto: '',
            categoria: ''
        }
    })

    // Función CORREGIDA para parsear fechas UTC correctamente
    const parsearFechaUTC = useCallback((fechaString) => {
        if (!fechaString) return null

        try {
            if (typeof fechaString === 'string') {
                // Si tiene formato ISO con Z (UTC)
                if (fechaString.includes('T') && fechaString.includes('Z')) {
                    const fechaUTC = parseISO(fechaString)

                    // Crear nueva fecha en hora local (evitar restar horas)
                    return new Date(
                        fechaUTC.getUTCFullYear(),
                        fechaUTC.getUTCMonth(),
                        fechaUTC.getUTCDate(),
                        12, 0, 0 // Poner a medio día para evitar problemas de zona horaria
                    )
                } else {
                    // Si es solo fecha, agregar hora local
                    return new Date(fechaString + 'T12:00:00')
                }
            }
            return new Date(fechaString)
        } catch (error) {
            console.error('Error parseando fecha:', fechaString, error)
            return null
        }
    }, [])

    // Función para formatear fecha CORREGIDA
    const formatFecha = useCallback((fechaString) => {
        if (!fechaString) return 'Fecha no disponible'

        try {
            const fechaObj = parsearFechaUTC(fechaString)
            if (!fechaObj || isNaN(fechaObj.getTime())) {
                return 'Fecha inválida'
            }

            // Formato corto para móvil, completo para desktop
            if (mobileView) {
                return format(fechaObj, "d/M/yy", { locale: es })
            }

            return format(fechaObj, "EEE, d 'de' MMM yyyy", { locale: es })
        } catch (error) {
            console.error('Error formateando fecha:', fechaString, error)
            return 'Fecha inválida'
        }
    }, [parsearFechaUTC, mobileView])

    // Función para formatear fecha completa
    const formatFechaCompleta = useCallback((fechaString) => {
        if (!fechaString) return 'Fecha no disponible'

        try {
            const fechaObj = parsearFechaUTC(fechaString)
            if (!fechaObj || isNaN(fechaObj.getTime())) {
                return 'Fecha inválida'
            }

            if (mobileView) {
                return format(fechaObj, "EEE, d MMM", { locale: es })
            }

            // Formato: "martes, 8 de diciembre de 2025"
            return format(fechaObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
        } catch (error) {
            console.error('Error formateando fecha completa:', fechaString, error)
            return 'Fecha inválida'
        }
    }, [parsearFechaUTC, mobileView])

    // Filtrar ingresos del mes actual
    const ingresosMesActual = useMemo(() => {
        return allIngresos.filter(ingreso => {
            if (!ingreso?.fecha) return false
            try {
                const fechaObj = parsearFechaUTC(ingreso.fecha)
                if (!fechaObj || isNaN(fechaObj.getTime())) return false
                return isSameMonth(fechaObj, currentDate)
            } catch (error) {
                console.error('Error filtrando ingreso:', error)
                return false
            }
        })
    }, [allIngresos, currentDate, parsearFechaUTC])

    // Filtrar gastos del mes actual
    const gastosMesActual = useMemo(() => {
        return allGastos.filter(gasto => {
            if (!gasto?.fecha) return false
            try {
                const fechaObj = parsearFechaUTC(gasto.fecha)
                if (!fechaObj || isNaN(fechaObj.getTime())) return false
                return isSameMonth(fechaObj, currentDate)
            } catch (error) {
                console.error('Error filtrando gasto:', error)
                return false
            }
        })
    }, [allGastos, currentDate, parsearFechaUTC])

    // Crear mapa de días trabajados del mes actual
    const diasTrabajadosMap = useMemo(() => {
        const map = {}
        if (ingresosMesActual && Array.isArray(ingresosMesActual)) {
            ingresosMesActual.forEach(ingreso => {
                if (ingreso && ingreso.fecha) {
                    try {
                        const fechaObj = parsearFechaUTC(ingreso.fecha)
                        if (fechaObj && !isNaN(fechaObj.getTime())) {
                            const fecha = format(fechaObj, 'yyyy-MM-dd')
                            map[fecha] = {
                                trabajado: true,
                                valor: parseFloat(ingreso.valor_ganado || 0),
                                descripcion: ingreso.descripcion_trabajo || 'Sin descripción'
                            }
                        }
                    } catch (error) {
                        console.error('Error procesando fecha del ingreso:', ingreso.fecha, error)
                    }
                }
            })
        }
        return map
    }, [ingresosMesActual, parsearFechaUTC])

    // Funciones para el calendario
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const prevMonth = () => {
        setCurrentDate(prev => subMonths(prev, 1))
    }

    const nextMonth = () => {
        setCurrentDate(prev => addMonths(prev, 1))
    }

    const getDayStatus = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd')
        const isTrabajado = diasTrabajadosMap[dateKey]?.trabajado || false

        if (isToday(date)) {
            return isTrabajado ? 'today-worked' : 'today-not-worked'
        }

        return isTrabajado ? 'worked' : 'not-worked'
    }

    const dayClasses = {
        'worked': 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
        'not-worked': 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100',
        'today-worked': 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-sm',
        'today-not-worked': 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
    }

    const getDayTooltip = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd')
        const trabajo = diasTrabajadosMap[dateKey]

        if (trabajo?.trabajado) {
            return `Trabajado: $${trabajo.valor.toFixed(2)}\n${trabajo.descripcion}`
        }

        return 'No trabajado'
    }

    // Calcular estadísticas del mes
    const diasTrabajadosMes = useMemo(() => {
        return Object.keys(diasTrabajadosMap).length
    }, [diasTrabajadosMap])

    const totalDiasMes = days.length
    const porcentajeTrabajo = totalDiasMes > 0 ? ((diasTrabajadosMes / totalDiasMes) * 100).toFixed(1) : 0

    // Calcular total de ingresos del mes actual
    const totalIngresosMes = useMemo(() => {
        return ingresosMesActual.reduce((sum, dia) => sum + parseFloat(dia.valor_ganado || 0), 0)
    }, [ingresosMesActual])

    // Calcular total de gastos del mes actual
    const totalGastosMes = useMemo(() => {
        return gastosMesActual.reduce((sum, gasto) => sum + parseFloat(gasto.monto_gasto || 0), 0)
    }, [gastosMesActual])

    // Calcular balance real del mes
    const balanceMes = useMemo(() => {
        return totalIngresosMes - totalGastosMes
    }, [totalIngresosMes, totalGastosMes])

    // Formatear número usando formato local del dispositivo
    const formatNumeroLocal = (valor) => {
        if (valor === null || valor === undefined || isNaN(valor)) return '$0.00'

        const numero = parseFloat(valor)

        // Usar formato de moneda local
        return numero.toLocaleString(userLocale, {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    }

    // Manejar registro de día trabajado
    const handleRegistroDiaTrabajado = async (data) => {
        setRegistroLoading(true)
        try {
            const formattedData = {
                ...data,
                valor_ganado: parseFloat(data.valor_ganado),
                descripcion_trabajo: data.descripcion_trabajo || null
            }
            await createIngreso(formattedData)
            await fetchIngresos()
            resetDia()
            setShowModalDia(false)
            toast.success('¡Día trabajado registrado!')
        } catch (error) {
            console.error('Error al registrar día trabajado:', error)
            toast.error('Error al registrar día trabajado')
        } finally {
            setRegistroLoading(false)
        }
    }

    // Manejar registro de gasto
    const handleRegistroGasto = async (data) => {
        setRegistroLoading(true)
        try {
            const formattedData = {
                ...data,
                monto_gasto: parseFloat(data.monto_gasto),
                categoria: data.categoria || null
            }
            await createGasto(formattedData)
            await fetchGastos()
            resetGasto()
            setShowModalGasto(false)
            toast.success('¡Gasto registrado!')
        } catch (error) {
            console.error('Error al registrar gasto:', error)
            toast.error('Error al registrar gasto')
        } finally {
            setRegistroLoading(false)
        }
    }

    // Eliminar día trabajado (iniciador)
    const handleEliminarIngreso = (id) => {
        setConfirmModal({
            isOpen: true,
            type: 'ingreso',
            id,
            title: 'Eliminar Día Trabajado',
            message: '¿Estás seguro de que quieres eliminar este día trabajado? Esta acción no se puede deshacer.'
        })
    }

    // Eliminar gasto (iniciador)
    const handleEliminarGasto = (id) => {
        setConfirmModal({
            isOpen: true,
            type: 'gasto',
            id,
            title: 'Eliminar Gasto',
            message: '¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.'
        })
    }

    // Confirmar eliminación
    const confirmarEliminacion = async () => {
        if (!confirmModal.id || !confirmModal.type) return

        try {
            if (confirmModal.type === 'ingreso') {
                await deleteIngreso(confirmModal.id)
                toast.success('Día trabajado eliminado')
            } else if (confirmModal.type === 'gasto') {
                await deleteGasto(confirmModal.id)
                toast.success('Gasto eliminado')
            }
            // Actualizar datos
            handleRefresh()
        } catch (error) {
            console.error('Error al eliminar:', error)
            toast.error('Error al eliminar el registro')
        } finally {
            cerrarConfirmModal()
        }
    }

    const cerrarConfirmModal = () => {
        setConfirmModal({
            isOpen: false,
            type: null,
            id: null,
            title: '',
            message: ''
        })
    }

    // Abrir modales
    const abrirModalDia = () => {
        resetDia({
            fecha: obtenerFechaActual(),
            valor_ganado: '',
            descripcion_trabajo: ''
        })
        setShowModalDia(true)
    }

    const abrirModalGasto = () => {
        resetGasto({
            fecha: obtenerFechaActual(),
            monto_gasto: '',
            descripcion_gasto: '',
            categoria: ''
        })
        setShowModalGasto(true)
    }

    // Refrescar datos
    const handleRefresh = async () => {
        try {
            await Promise.all([fetchIngresos(), fetchGastos()])
            toast.success('Datos actualizados')
        } catch (error) {
            toast.error('Error al actualizar datos')
        }
    }

    // Función para generar PDF de resumen
    const generarPDFResumen = () => {
        setPdfLoading(true)

        try {
            const doc = new jsPDF()

            // Configurar fuente
            doc.setFont("helvetica")

            // Título
            doc.setFontSize(20)
            doc.text('Resumen de Trabajo', 14, 22)

            // Fecha de generación usando formato local
            doc.setFontSize(11)
            doc.setTextColor(100)
            const fechaActual = new Date()
            doc.text(`Generado: ${fechaActual.toLocaleDateString(userLocale)}`, 14, 32)

            // Período usando date-fns con locale actual
            doc.text(`Período: ${format(currentDate, 'MMMM yyyy', { locale: currentLocale })}`, 14, 38)

            // Calcular totales
            const totalIngresosPDF = totalIngresosMes
            const totalGastosPDF = totalGastosMes
            const balanceMesPDF = balanceMes

            // Cuadro de estadísticas
            doc.setFillColor(240, 248, 255)
            doc.rect(14, 45, 185, 40, 'F')

            doc.setFontSize(12)
            doc.setTextColor(0)
            doc.text(`Días trabajados: ${diasTrabajadosMes} de ${totalDiasMes} (${porcentajeTrabajo}%)`, 20, 55)
            doc.text(`Ingresos totales: ${formatNumeroLocal(totalIngresosPDF)}`, 20, 62)
            doc.text(`Gastos totales: ${formatNumeroLocal(totalGastosPDF)}`, 20, 69)
            doc.text(`Balance del mes: ${formatNumeroLocal(balanceMesPDF)}`, 20, 76)

            // Tabla de días trabajados
            const tableColumnDias = ["Fecha", "Descripción", "Valor"]
            const tableRowsDias = []

            if (ingresosMesActual.length > 0) {
                ingresosMesActual.slice(0, 10).forEach(dia => {
                    try {
                        const fechaObj = parsearFechaUTC(dia.fecha)
                        const fechaMostrar = fechaObj ? format(fechaObj, 'dd/MM/yyyy') : 'Fecha no disponible'

                        tableRowsDias.push([
                            fechaMostrar,
                            dia.descripcion_trabajo || 'Sin descripción',
                            formatNumeroLocal(dia.valor_ganado || 0)
                        ])
                    } catch (error) {
                        console.error('Error procesando día para PDF:', dia)
                    }
                })
            } else {
                tableRowsDias.push(['No hay días trabajados este mes', '', ''])
            }

            // Agregar tabla de días trabajados
            autoTable(doc, {
                head: [tableColumnDias],
                body: tableRowsDias,
                startY: 90,
                theme: 'striped',
                headStyles: {
                    fillColor: [46, 204, 113],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 90 },
                    2: { cellWidth: 45, halign: 'right' }
                },
                margin: { left: 14 },
                styles: { fontSize: 10 }
            })

            // Obtener la posición Y final de la primera tabla
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 100

            // Tabla de gastos
            doc.setFontSize(14)
            doc.setTextColor(0)
            doc.text('GASTOS DEL MES', 14, finalY)

            const tableColumnGastos = ["Fecha", "Descripción", "Categoría", "Monto"]
            const tableRowsGastos = []

            if (gastosMesActual.length > 0) {
                gastosMesActual.slice(0, 10).forEach(gasto => {
                    try {
                        const fechaObj = parsearFechaUTC(gasto.fecha)
                        const fechaMostrar = fechaObj ? format(fechaObj, 'dd/MM/yyyy') : 'Fecha no disponible'

                        tableRowsGastos.push([
                            fechaMostrar,
                            gasto.descripcion_gasto || 'Sin descripción',
                            gasto.categoria || 'Sin categoría',
                            formatNumeroLocal(gasto.monto_gasto || 0)
                        ])
                    } catch (error) {
                        console.error('Error procesando gasto para PDF:', gasto)
                    }
                })
            } else {
                tableRowsGastos.push(['No hay gastos este mes', '', '', ''])
            }

            // Agregar tabla de gastos
            autoTable(doc, {
                head: [tableColumnGastos],
                body: tableRowsGastos,
                startY: finalY + 5,
                theme: 'striped',
                headStyles: {
                    fillColor: [231, 76, 60],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 40 },
                    1: { cellWidth: 70 },
                    2: { cellWidth: 40 },
                    3: { cellWidth: 40, halign: 'right' }
                },
                margin: { left: 14 },
                styles: { fontSize: 10 }
            })

            // Pie de página
            const pageCount = doc.internal.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(10)
                doc.setTextColor(150)
                doc.text(
                    `Página ${i} de ${pageCount}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                )
            }

            // Guardar PDF
            const fileName = `resumen_trabajo_${format(currentDate, 'yyyy-MM')}.pdf`
            doc.save(fileName)

            toast.success('¡PDF generado exitosamente!')
        } catch (error) {
            console.error('Error al generar PDF:', error)
            toast.error('Error al generar el PDF')
        } finally {
            setPdfLoading(false)
        }
    }

    // Si los datos están cargando
    if (ingresosLoading || gastosLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando datos...</p>
                </div>
            </div>
        )
    }

    // Formatear fecha actual para mostrar
    const fechaActualFormateada = new Date().toLocaleDateString(userLocale, {
        weekday: mobileView ? 'short' : 'long',
        day: 'numeric',
        month: mobileView ? 'short' : 'long',
        year: 'numeric'
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard de Trabajo</h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Seguimiento de días trabajados y finanzas
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                        {fechaActualFormateada}
                    </div>
                    <Button
                        onClick={handleRefresh}
                        variant="ghost"
                        size="small"
                        className="flex items-center"
                        title="Actualizar datos"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-2">Actualizar</span>
                    </Button>
                    <Button
                        onClick={generarPDFResumen}
                        loading={pdfLoading}
                        variant="secondary"
                        size="small"
                        className="flex items-center"
                    >
                        <FileText className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-2">PDF</span>
                        <Download className="hidden sm:block h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>

            {/* Filtro de mes */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
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
                            {format(currentDate, 'MMMM yyyy', { locale: es }).charAt(0).toUpperCase() +
                                format(currentDate, 'MMMM yyyy', { locale: es }).slice(1)}
                            {showMonthFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>

                        {/* Dropdown de meses */}
                        {showMonthFilter && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <div className="p-2 max-h-60 overflow-y-auto">
                                    {availableMonths.map((month, index) => (
                                        <button
                                            key={`month-${index}`}
                                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${isSameMonth(month, currentDate) ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                                                }`}
                                            onClick={() => {
                                                setCurrentDate(month)
                                                setShowMonthFilter(false)
                                            }}
                                        >
                                            {format(month, 'MMMM yyyy', { locale: es }).charAt(0).toUpperCase() +
                                                format(month, 'MMMM yyyy', { locale: es }).slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Botones de Acción Rápida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Card Registrar Día Trabajado */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <Calendar className="h-5 w-5 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Registrar Día Trabajado</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">
                                Añade un nuevo día de trabajo con su valor
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={abrirModalDia}
                                    className="flex-1 justify-center"
                                    size="medium"
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Nuevo Día
                                </Button>
                                <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 bg-emerald-50 rounded-lg">
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-medium text-emerald-700">
                                        {formatNumeroLocal(totalIngresosMes)}
                                    </span>
                                    <span className="text-xs text-emerald-600 hidden sm:inline">
                                        este mes
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                                <TrendingUp className="h-8 w-8 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Registrar Gasto */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-rose-100 rounded-lg">
                                    <Tag className="h-5 w-5 text-rose-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Registrar Gasto</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">
                                Añade un nuevo gasto con categoría
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={abrirModalGasto}
                                    variant="secondary"
                                    className="flex-1 justify-center"
                                    size="medium"
                                >
                                    <Tag className="h-4 w-4 mr-2" />
                                    Nuevo Gasto
                                </Button>
                                <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 bg-rose-50 rounded-lg">
                                    <DollarSign className="h-4 w-4 text-rose-600" />
                                    <span className="text-sm font-medium text-rose-700">
                                        {formatNumeroLocal(totalGastosMes)}
                                    </span>
                                    <span className="text-xs text-rose-600 hidden sm:inline">
                                        este mes
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <div className="p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl">
                                <TrendingDown className="h-8 w-8 text-rose-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <StatsCards
                balance={{
                    total: balanceMes,
                    ingresos: totalIngresosMes,
                    gastos: totalGastosMes
                }}
                loading={gastosLoading || ingresosLoading}
            />

            {/* Calendario de Trabajo */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Calendario de Días Trabajados</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {diasTrabajadosMes} de {totalDiasMes} días trabajados ({porcentajeTrabajo}%)
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs text-gray-600">Trabajado</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                                    <span className="text-xs text-gray-600">No trabajado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Controles del calendario */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={prevMonth}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Mes anterior"
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 text-center px-4">
                            {format(currentDate, 'MMMM yyyy', { locale: currentLocale }).charAt(0).toUpperCase() +
                                format(currentDate, 'MMMM yyyy', { locale: currentLocale }).slice(1)}
                        </h3>

                        <button
                            onClick={nextMonth}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Mes siguiente"
                        >
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Días de la semana - RESPONSIVE CORREGIDO */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {mobileView
                            ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
                                <div key={`${day}-${index}`} className="text-center text-xs font-medium text-gray-500 py-2">
                                    {day}
                                </div>
                            ))
                            : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
                                <div key={`${day}-${index}`} className="text-center text-sm font-medium text-gray-500 py-2">
                                    {day}
                                </div>
                            ))
                        }
                    </div>

                    {/* Días del mes - RESPONSIVE */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Espacios vacíos al inicio */}
                        {Array.from({
                            length: monthStart.getDay() === 0 ? 6 : (monthStart.getDay() - 1)
                        }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-10 sm:h-12"></div>
                        ))}

                        {/* Días del mes */}
                        {days.map((day) => {
                            const status = getDayStatus(day)
                            const isCurrentMonth = isSameMonth(day, currentDate)

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`h-10 sm:h-12 flex items-center justify-center rounded-lg border ${dayClasses[status]} ${isCurrentMonth ? 'opacity-100' : 'opacity-50'
                                        } transition-all duration-200 hover:scale-105 cursor-pointer relative group`}
                                    title={getDayTooltip(day)}
                                >
                                    <span className={`text-sm font-medium ${status.includes('today') ? 'font-bold' : ''}`}>
                                        {format(day, 'd')}
                                    </span>
                                    {diasTrabajadosMap[format(day, 'yyyy-MM-dd')]?.trabajado && (
                                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-current"></div>
                                        </div>
                                    )}

                                    {/* Tooltip solo en desktop */}
                                    {!mobileView && (
                                        <div className="absolute z-10 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-pre-line max-w-xs">
                                            {getDayTooltip(day)}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Estadísticas del calendario - Responsive */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-emerald-50 rounded-lg">
                                <div className="text-xl sm:text-2xl font-bold text-emerald-700">{diasTrabajadosMes}</div>
                                <div className="text-xs sm:text-sm text-emerald-600">Días trabajados</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-xl sm:text-2xl font-bold text-gray-700">{totalDiasMes - diasTrabajadosMes}</div>
                                <div className="text-xs sm:text-sm text-gray-600">Días libres</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-xl sm:text-2xl font-bold text-blue-700">{porcentajeTrabajo}%</div>
                                <div className="text-xs sm:text-sm text-blue-600">Tasa de trabajo</div>
                            </div>
                            <div className="text-center p-3 bg-violet-50 rounded-lg">
                                <div className="text-xl sm:text-2xl font-bold text-violet-700">
                                    {mobileView
                                        ? `$${totalIngresosMes.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`
                                        : formatNumeroLocal(totalIngresosMes)
                                    }
                                </div>
                                <div className="text-xs sm:text-sm text-violet-600">Ingresos mes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Últimos días trabajados y gastos - Layout responsivo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Últimos días trabajados */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Últimos Días Trabajados</h2>
                            <Button
                                size="small"
                                variant="ghost"
                                onClick={abrirModalDia}
                                aria-label="Agregar día trabajado"
                                className="hidden sm:flex"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="ml-2">Agregar</span>
                            </Button>
                            <Button
                                size="small"
                                variant="ghost"
                                onClick={abrirModalDia}
                                aria-label="Agregar día trabajado"
                                className="sm:hidden"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {ingresosLoading ? (
                            <div className="space-y-4 p-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                                ))}
                            </div>
                        ) : ingresosMesActual.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                                    <Calendar className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 mb-4">No hay días trabajados este mes</p>
                                <Button onClick={abrirModalDia} size="medium">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Registrar Primer Día
                                </Button>
                            </div>
                        ) : (
                            ingresosMesActual.slice(0, 8).map((ingreso, index) => (
                                ingreso ? (
                                    <div
                                        key={ingreso.id_ingreso || `ingreso-${index}`}
                                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-3">
                                                <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full flex-shrink-0">
                                                    <Calendar className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {ingreso.descripcion_trabajo || (
                                                            <span className="text-gray-400 italic">Sin descripción</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                                        {mobileView
                                                            ? formatFecha(ingreso.fecha)
                                                            : formatFechaCompleta(ingreso.fecha)
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <p className="font-bold text-emerald-600 whitespace-nowrap text-sm sm:text-base">
                                                {mobileView
                                                    ? `$${parseFloat(ingreso.valor_ganado || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`
                                                    : formatNumeroLocal(ingreso.valor_ganado)
                                                }
                                            </p>
                                            <button
                                                onClick={() => handleEliminarIngreso(ingreso.id_ingreso)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : null
                            ))
                        )}
                    </div>
                    {ingresosMesActual.length > 8 && (
                        <div className="p-4 border-t border-gray-200 text-center">
                            <Button variant="ghost" size="small" className="text-sm">
                                Ver todos los días trabajados ({ingresosMesActual.length})
                            </Button>
                        </div>
                    )}
                </div>

                {/* Últimos gastos */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Últimos Gastos</h2>
                            <Button
                                size="small"
                                variant="ghost"
                                onClick={abrirModalGasto}
                                aria-label="Agregar gasto"
                                className="hidden sm:flex"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="ml-2">Agregar</span>
                            </Button>
                            <Button
                                size="small"
                                variant="ghost"
                                onClick={abrirModalGasto}
                                aria-label="Agregar gasto"
                                className="sm:hidden"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {gastosLoading ? (
                            <div className="space-y-4 p-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                                ))}
                            </div>
                        ) : gastosMesActual.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                                    <Tag className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 mb-4">No hay gastos este mes</p>
                                <Button onClick={abrirModalGasto} size="medium" variant="secondary">
                                    <Tag className="h-4 w-4 mr-2" />
                                    Registrar Primer Gasto
                                </Button>
                            </div>
                        ) : (
                            gastosMesActual.slice(0, 8).map((gasto, index) => (
                                gasto ? (
                                    <div
                                        key={gasto.id_gasto || `gasto-${index}`}
                                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-3">
                                                <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-rose-100 rounded-full flex-shrink-0">
                                                    <Tag className="h-4 w-4 text-rose-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                        <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                                                            {gasto.descripcion_gasto || 'Sin descripción'}
                                                        </p>
                                                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 whitespace-nowrap self-start sm:self-center">
                                                            {gasto.categoria || 'Sin categoría'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {mobileView
                                                            ? formatFecha(gasto.fecha)
                                                            : formatFecha(gasto.fecha)
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <div className="text-right">
                                                <p className="font-bold text-rose-600 whitespace-nowrap text-sm sm:text-base">
                                                    {mobileView
                                                        ? `-$${parseFloat(gasto.monto_gasto || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`
                                                        : `-${formatNumeroLocal(gasto.monto_gasto)}`
                                                    }
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleEliminarGasto(gasto.id_gasto)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : null
                            ))
                        )}
                    </div>
                    {gastosMesActual.length > 8 && (
                        <div className="p-4 border-t border-gray-200 text-center">
                            <Button variant="ghost" size="small" className="text-sm">
                                Ver todos los gastos ({gastosMesActual.length})
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para Día Trabajado */}
            <Modal
                isOpen={showModalDia}
                onClose={() => {
                    setShowModalDia(false)
                    resetDia()
                }}
                title="Registrar Día Trabajado"
                size="md"
            >
                <form onSubmit={handleSubmitDia(handleRegistroDiaTrabajado)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Fecha*"
                            type="date"
                            {...registerDia('fecha', {
                                required: 'La fecha es requerida',
                                max: obtenerFechaActual()
                            })}
                            error={errorsDia.fecha?.message}
                            max={obtenerFechaActual()}
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

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
                            onClick={() => {
                                setShowModalDia(false)
                                resetDia()
                            }}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal para Gasto */}
            <Modal
                isOpen={showModalGasto}
                onClose={() => {
                    setShowModalGasto(false)
                    resetGasto()
                }}
                title="Registrar Gasto"
                size="md"
            >
                <form onSubmit={handleSubmitGasto(handleRegistroGasto)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Fecha*"
                            type="date"
                            {...registerGasto('fecha', {
                                required: 'La fecha es requerida',
                                max: obtenerFechaActual()
                            })}
                            error={errorsGasto.fecha?.message}
                            max={obtenerFechaActual()}
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
                            options={categoriasGastos || []}
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

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
                            onClick={() => {
                                setShowModalGasto(false)
                                resetGasto()
                            }}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Modal>


            {/* Modal de Confirmación de Eliminación */}
            < Modal
                isOpen={confirmModal.isOpen}
                onClose={cerrarConfirmModal}
                title={confirmModal.title}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        {confirmModal.message}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            onClick={confirmarEliminacion}
                            className="flex-1 justify-center bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                        </Button>
                        <Button
                            onClick={cerrarConfirmModal}
                            variant="secondary"
                            className="flex-1 justify-center"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal >
        </div >
    )
}

export default Dashboard