import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useIngresos } from '../hooks/useIngresos'
import IngresoForm from '../components/ingresos/IngresoForm'
import Modal from '../components/common/UI/Modal'
import Button from '../components/common/UI/Button'
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  FileText,
  X,
  Download,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Search,
  DollarSign,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Filter,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ArrowUpRight,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, startOfYear, endOfYear, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

const IngresosPage = () => {
  const {
    ingresos,
    loading,
    error,
    createIngreso,
    updateIngreso, // IMPORTANTE: Añadir esta función
    deleteIngreso,
    fetchIngresos
  } = useIngresos()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingIngreso, setEditingIngreso] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [showMonthFilter, setShowMonthFilter] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [mobileView, setMobileView] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Función para parsear fechas
  const parsearFechaUTC = useCallback((fechaString) => {
    if (!fechaString) return null

    try {
      if (typeof fechaString === 'string') {
        const datePart = fechaString.includes('T') ? fechaString.split('T')[0] : fechaString
        return new Date(datePart + 'T12:00:00')
      }
      return new Date(fechaString)
    } catch (error) {
      return null
    }
  }, [])

  // Función para formatear fecha
  const formatFecha = useCallback((fechaString) => {
    if (!fechaString) return 'Fecha no disponible'

    try {
      const fechaObj = parsearFechaUTC(fechaString)
      if (!fechaObj || isNaN(fechaObj.getTime())) {
        return 'Fecha inválida'
      }

      if (mobileView) {
        return format(fechaObj, "d/M/yy", { locale: es })
      }

      return format(fechaObj, "EEE, d 'de' MMM yyyy", { locale: es })
    } catch (error) {
      return 'Fecha inválida'
    }
  }, [parsearFechaUTC, mobileView])

  // Función para formatear fecha corta (solo para móvil)
  const formatFechaCorta = (fechaString) => {
    if (!fechaString) return ''

    try {
      const fechaObj = parsearFechaUTC(fechaString)
      if (!fechaObj || isNaN(fechaObj.getTime())) return ''

      return format(fechaObj, "d/M", { locale: es })
    } catch (error) {
      return ''
    }
  }

  // Obtener meses disponibles
  const mesesDisponibles = useMemo(() => {
    if (ingresos.length === 0) return [new Date()]

    const fechas = ingresos
        .map(ingreso => parsearFechaUTC(ingreso.fecha))
        .filter(fecha => fecha && !isNaN(fecha.getTime()))

    if (fechas.length === 0) return [new Date()]

    const minDate = new Date(Math.min(...fechas.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...fechas.map(d => d.getTime())))

    return eachMonthOfInterval({
      start: startOfYear(minDate),
      end: endOfYear(maxDate)
    }).reverse()
  }, [ingresos, parsearFechaUTC])

  // Filtrar ingresos
  const filteredIngresos = useMemo(() => {
    return ingresos.filter(ingreso => {
      if (!ingreso.fecha) return false

      try {
        const fechaIngreso = parsearFechaUTC(ingreso.fecha)
        if (!fechaIngreso || isNaN(fechaIngreso.getTime())) return false

        const isSameMonthIngreso = isSameMonth(fechaIngreso, selectedMonth)

        const matchesSearch = searchQuery === '' ||
            (ingreso.descripcion_trabajo &&
                ingreso.descripcion_trabajo.toLowerCase().includes(searchQuery.toLowerCase()))

        return isSameMonthIngreso && matchesSearch
      } catch (error) {
        return false
      }
    })
  }, [ingresos, selectedMonth, searchQuery, parsearFechaUTC])

  // Paginación
  const totalPages = Math.ceil(filteredIngresos.length / itemsPerPage)
  const paginatedIngresos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredIngresos.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredIngresos, currentPage, itemsPerPage])

  // CORRECCIÓN PRINCIPAL: Función para agrupar ingresos por fecha
  const ingresosAgrupadosPorFecha = useMemo(() => {
    const grupos = {}

    filteredIngresos.forEach(ingreso => {
      const fechaKey = ingreso.fecha // Usar la fecha como string como clave

      if (!grupos[fechaKey]) {
        grupos[fechaKey] = {
          fecha: ingreso.fecha,
          total: 0,
          registros: [],
          count: 0
        }
      }

      grupos[fechaKey].total += parseFloat(ingreso.valor_ganado || 0)
      grupos[fechaKey].registros.push(ingreso)
      grupos[fechaKey].count += 1
    })

    // Convertir a array y ordenar por fecha descendente
    return Object.values(grupos).sort((a, b) =>
        new Date(b.fecha) - new Date(a.fecha)
    )
  }, [filteredIngresos])

  // CORRECCIÓN: Días trabajados basados en fechas únicas
  const diasTrabajadosMes = useMemo(() => {
    // Usar un Set para obtener fechas únicas
    const fechasUnicas = new Set()

    filteredIngresos.forEach(ingreso => {
      if (ingreso.fecha) {
        fechasUnicas.add(ingreso.fecha)
      }
    })

    return fechasUnicas.size
  }, [filteredIngresos])

  // CORRECCIÓN: Total del mes basado en todos los registros
  const totalIngresosMes = useMemo(() => {
    return filteredIngresos.reduce((sum, ing) =>
        sum + parseFloat(ing.valor_ganado || 0), 0
    )
  }, [filteredIngresos])

  // CORRECCIÓN: Promedio por día basado en días únicos
  const promedioIngresosPorDia = useMemo(() => {
    return diasTrabajadosMes > 0
        ? totalIngresosMes / diasTrabajadosMes
        : 0
  }, [totalIngresosMes, diasTrabajadosMes])

  const totalDiasMes = useMemo(() => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }, [selectedMonth])

  const porcentajeTrabajo = totalDiasMes > 0 ? ((diasTrabajadosMes / totalDiasMes) * 100).toFixed(1) : 0

  // Comparación con mes anterior
  const estadisticasMesAnterior = useMemo(() => {
    const mesAnterior = subMonths(selectedMonth, 1)

    // Filtrar ingresos del mes anterior
    const ingresosMesAnterior = ingresos.filter(ingreso => {
      const fechaIngreso = parsearFechaUTC(ingreso.fecha)
      return fechaIngreso && isSameMonth(fechaIngreso, mesAnterior)
    })

    // Calcular total del mes anterior
    const totalMesAnterior = ingresosMesAnterior.reduce((sum, ing) =>
        sum + parseFloat(ing.valor_ganado || 0), 0
    )

    const diferencia = totalIngresosMes - totalMesAnterior
    const porcentajeCambio = totalMesAnterior > 0
        ? ((diferencia / totalMesAnterior) * 100).toFixed(1)
        : 100

    return {
      totalMesAnterior,
      diferencia,
      porcentajeCambio,
      esPositivo: diferencia >= 0
    }
  }, [ingresos, selectedMonth, totalIngresosMes, parsearFechaUTC])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchIngresos()
      toast.success('Datos actualizados')
    } catch (error) {
      toast.error('Error al actualizar datos')
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchIngresos])

  const handleCreate = useCallback(async (data) => {
    try {
      await createIngreso(data)
      setModalOpen(false)
      toast.success('✅ Día trabajado registrado exitosamente')
      setTimeout(async () => { await fetchIngresos() }, 500)
    } catch (error) {
      toast.error('Error al registrar')
      setModalOpen(false)
    }
  }, [createIngreso, fetchIngresos])

  // CORRECCIÓN: Usar updateIngreso en lugar de delete + create
  const handleUpdate = useCallback(async (data) => {
    try {
      if (editingIngreso && editingIngreso.id_ingreso) {
        await updateIngreso(editingIngreso.id_ingreso, data)
        setEditingIngreso(null)
        setModalOpen(false)
        toast.success('✅ Día trabajado actualizado exitosamente')
        setTimeout(async () => { await fetchIngresos() }, 500)
      }
    } catch (error) {
      console.error('Error al actualizar:', error)
      toast.error('Error al actualizar el día trabajado')
      setEditingIngreso(null)
      setModalOpen(false)
    }
  }, [editingIngreso, updateIngreso, fetchIngresos])

  const handleDelete = async (id) => {
    try {
      await deleteIngreso(id)
      setDeletingId(null)
      toast.success('✅ Día trabajado eliminado')
      setTimeout(async () => { await fetchIngresos() }, 300)
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleEdit = useCallback((ingreso) => {
    setEditingIngreso(ingreso)
    setModalOpen(true)
  }, [])

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00'
    const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numberAmount || 0)
  }

  const formatMonth = (date) => {
    return format(date, "MMMM yyyy", { locale: es })
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CalendarDays className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Días Trabajados</h1>
                    <p className="text-gray-600 mt-1">
                      Gestiona y visualiza tu historial de días trabajados
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                    variant="secondary"
                    onClick={handleRefresh}
                    disabled={isRefreshing || loading}
                    className="hidden sm:flex"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nuevo Día</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Estadísticas - CORREGIDAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total del Mes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(totalIngresosMes)}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className={`flex items-center ${estadisticasMesAnterior.esPositivo ? 'text-emerald-600' : 'text-red-600'}`}>
                      <ArrowUpRight className={`h-4 w-4 ${estadisticasMesAnterior.esPositivo ? '' : 'rotate-180'}`} />
                      <span className="text-sm font-medium ml-1">
                      {estadisticasMesAnterior.esPositivo ? '+' : ''}{estadisticasMesAnterior.porcentajeCambio}%
                    </span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">vs mes anterior</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {filteredIngresos.length} registro{filteredIngresos.length !== 1 ? 's' : ''} en {diasTrabajadosMes} día{diasTrabajadosMes !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Promedio por Día</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(promedioIngresosPorDia)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {diasTrabajadosMes} día{diasTrabajadosMes !== 1 ? 's' : ''} trabajado{diasTrabajadosMes !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Días Trabajados</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {diasTrabajadosMes}
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progreso</span>
                      <span>{porcentajeTrabajo}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(porcentajeTrabajo, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Días Restantes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {totalDiasMes - diasTrabajadosMes}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    de {totalDiasMes} días totales
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="mb-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                      type="text"
                      placeholder="Buscar por descripción del trabajo..."
                      className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                      <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 lg:flex-none">
                    <Button
                        variant="secondary"
                        onClick={() => setShowMonthFilter(!showMonthFilter)}
                        className="w-full justify-between"
                    >
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatMonth(selectedMonth)}
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showMonthFilter ? 'rotate-180' : ''}`} />
                    </Button>

                    {showMonthFilter && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                          {mesesDisponibles.map((mes, index) => (
                              <button
                                  key={index}
                                  onClick={() => {
                                    setSelectedMonth(mes)
                                    setShowMonthFilter(false)
                                    setCurrentPage(1)
                                  }}
                                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                      isSameMonth(mes, selectedMonth)
                                          ? 'bg-blue-50 text-blue-600 font-medium'
                                          : 'text-gray-700'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{formatMonth(mes)}</span>
                                  {isSameMonth(mes, selectedMonth) && (
                                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </div>
                              </button>
                          ))}
                        </div>
                    )}
                  </div>

                  <Button
                      variant="secondary"
                      onClick={() => setShowFilters(!showFilters)}
                      className="hidden sm:flex"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>

                  <Button
                      variant="secondary"
                      onClick={() => {}}
                      className="hidden sm:flex"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta Principal - Historial */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Historial de Días</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {diasTrabajadosMes} día{diasTrabajadosMes !== 1 ? 's' : ''} • {formatCurrency(totalIngresosMes)} • Mes: {formatMonth(selectedMonth)}
                  </p>
                </div>
                <Button
                    variant="ghost"
                    onClick={handleRefresh}
                    disabled={isRefreshing || loading}
                    size="small"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>

            {loading ? (
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando días trabajados</h3>
                  <p className="text-gray-500">Obteniendo tu información...</p>
                </div>
            ) : filteredIngresos.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-6">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery
                        ? 'No hay días que coincidan con tu búsqueda'
                        : 'No hay días registrados este mes'}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    {searchQuery
                        ? 'Intenta con otros términos de búsqueda o limpia los filtros.'
                        : `Comienza registrando tu primer día trabajado en ${formatMonth(selectedMonth)}.`}
                  </p>
                  <Button onClick={() => setModalOpen(true)} size="large">
                    <Plus className="h-5 w-5 mr-2" />
                    Registrar Primer Día
                  </Button>
                </div>
            ) : (
                <>
                  {/* Vista de escritorio - MODIFICADA para mostrar grupos */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Fecha
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Descripción del Trabajo
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Valor Ganado
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Registros
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                      {paginatedIngresos.map((ingreso) => (
                          <tr
                              key={ingreso.id_ingreso}
                              className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-200"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatFecha(ingreso.fecha)}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {format(parsearFechaUTC(ingreso.fecha), "EEEE", { locale: es })}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="max-w-md">
                                <div className="text-sm text-gray-900 font-medium line-clamp-2">
                                  {ingreso.descripcion_trabajo || (
                                      <span className="text-gray-400 italic">Sin descripción</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-200">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                                <span className="text-sm font-bold text-emerald-700">
                                  {formatCurrency(ingreso.valor_ganado)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="text-sm text-gray-600">
                                {/* Mostrar si hay múltiples registros en esta fecha */}
                                {(() => {
                                  const registrosMismaFecha = filteredIngresos.filter(i => i.fecha === ingreso.fecha)
                                  if (registrosMismaFecha.length > 1) {
                                    return (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                                          {registrosMismaFecha.length} registro{registrosMismaFecha.length !== 1 ? 's' : ''}
                                        </span>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleEdit(ingreso)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setDeletingId(ingreso.id_ingreso)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista móvil */}
                  <div className="md:hidden">
                    <div className="divide-y divide-gray-200">
                      {paginatedIngresos.map((ingreso) => {
                        const registrosMismaFecha = filteredIngresos.filter(i => i.fecha === ingreso.fecha)

                        return (
                            <div key={ingreso.id_ingreso} className="p-5 hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center">
                                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {formatFechaCorta(ingreso.fecha)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {format(parsearFechaUTC(ingreso.fecha), "EEE", { locale: es })}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                      onClick={() => handleEdit(ingreso)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                      onClick={() => setDeletingId(ingreso.id_ingreso)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="mb-3">
                                <p className="text-sm text-gray-700 mb-2">
                                  {ingreso.descripcion_trabajo || (
                                      <span className="text-gray-400 italic">Sin descripción</span>
                                  )}
                                </p>
                                {registrosMismaFecha.length > 1 && (
                                    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                                      {registrosMismaFecha.length} registro{registrosMismaFecha.length !== 1 ? 's' : ''} en esta fecha
                                    </div>
                                )}
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">
                                  {formatFecha(ingreso.fecha)}
                                </div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-200">
                                  <DollarSign className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                                  <span className="text-sm font-bold text-emerald-700">
                                  {formatCurrency(ingreso.valor_ganado)}
                                </span>
                                </div>
                              </div>
                            </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Paginación */}
                  {filteredIngresos.length > itemsPerPage && (
                      <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <p className="text-sm text-gray-600">
                            Mostrando <span className="font-semibold">{paginatedIngresos.length}</span> de{' '}
                            <span className="font-semibold">{filteredIngresos.length}</span> registros
                          </p>
                          <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum
                                if (totalPages <= 5) {
                                  pageNum = i + 1
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i
                                } else {
                                  pageNum = currentPage - 2 + i
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                                            currentPage === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                      {pageNum}
                                    </button>
                                )
                              })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                  )}
                </>
            )}
          </div>

          {/* Resumen del Mes - CORREGIDO */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resumen de {formatMonth(selectedMonth)}</h3>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Días trabajados</p>
                <p className="text-xl font-bold text-gray-900">{diasTrabajadosMes}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredIngresos.length} registro{filteredIngresos.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total ganado</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalIngresosMes)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(promedioIngresosPorDia)} por día
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Promedio diario</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(promedioIngresosPorDia)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Basado en {diasTrabajadosMes} día{diasTrabajadosMes !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tasa de trabajo</p>
                <p className="text-xl font-bold text-gray-900">{porcentajeTrabajo}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {diasTrabajadosMes} de {totalDiasMes} días
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Nuevo/Editar Ingreso */}
        <Modal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingIngreso(null)
            }}
            title={editingIngreso ? 'Editar Día Trabajado' : 'Registrar Nuevo Día'}
            size="lg"
        >
          <IngresoForm
              onSubmit={editingIngreso ? handleUpdate : handleCreate}
              initialData={editingIngreso}
              loading={loading}
              onClose={() => {
                setModalOpen(false)
                setEditingIngreso(null)
              }}
          />
        </Modal>

        {/* Modal de Confirmación de Eliminación */}
        {deletingId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full transform transition-all scale-100">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar día trabajado?</h3>
                  <p className="text-gray-600">
                    Esta acción no se puede deshacer. El registro será eliminado permanentemente.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                      variant="secondary"
                      onClick={() => setDeletingId(null)}
                      className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                      variant="danger"
                      onClick={() => handleDelete(deletingId)}
                      loading={loading}
                      className="flex-1"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}

export default IngresosPage