import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useGastos } from '../hooks/useGastos'
import GastoForm from '../components/gastos/GastoForm'
import Modal from '../components/common/UI/Modal'
import Button from '../components/common/UI/Button'
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Download,
  FileText,
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  DollarSign,
  PieChart,
  AlertCircle,
  CreditCard,
  ShoppingBag,
  Home,
  Car,
  Utensils,
  Heart,
  BookOpen,
  Sparkles,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth, startOfYear, endOfYear } from 'date-fns'
import { es } from 'date-fns/locale'

const GastosPage = () => {
  const {
    gastos,
    loading,
    error,
    categorias,
    createGasto,
    updateGasto, // Asegúrate de tener esta función en tu hook
    deleteGasto,
    fetchGastos
  } = useGastos()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [showMonthFilter, setShowMonthFilter] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [mobileView, setMobileView] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cargar gastos al montar
  useEffect(() => {
    fetchGastos();
  }, [])

  // Iconos por categoría
  const categoryIcons = {
    alimentacion: Utensils,
    transporte: Car,
    vivienda: Home,
    servicios: CreditCard,
    entretenimiento: Sparkles,
    salud: Heart,
    educacion: BookOpen,
    otros: ShoppingBag
  }

  // Colores por categoría
  const categoryColors = {
    alimentacion: 'from-orange-100 to-orange-50 border-orange-200',
    transporte: 'from-blue-100 to-blue-50 border-blue-200',
    vivienda: 'from-purple-100 to-purple-50 border-purple-200',
    servicios: 'from-cyan-100 to-cyan-50 border-cyan-200',
    entretenimiento: 'from-pink-100 to-pink-50 border-pink-200',
    salud: 'from-red-100 to-red-50 border-red-200',
    educacion: 'from-indigo-100 to-indigo-50 border-indigo-200',
    otros: 'from-gray-100 to-gray-50 border-gray-200'
  }

  // Función para parsear fechas UTC correctamente
  const parsearFechaUTC = useCallback((fechaString) => {
    if (!fechaString) return null

    try {
      if (typeof fechaString === 'string') {
        const datePart = fechaString.includes('T') ? fechaString.split('T')[0] : fechaString
        return new Date(datePart + 'T12:00:00')
      }
      return new Date(fechaString)
    } catch (error) {
      console.error('Error parseando fecha:', fechaString, error)
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
      console.error('Error formateando fecha:', fechaString, error)
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

  // Filtrar gastos
  const filteredGastos = useMemo(() => {
    return gastos.filter(gasto => {
      if (!gasto.fecha) return false

      try {
        const fechaGasto = parsearFechaUTC(gasto.fecha)
        if (!fechaGasto || isNaN(fechaGasto.getTime())) return false

        const isSameMonthGasto = isSameMonth(fechaGasto, selectedMonth)

        const matchesSearch = searchQuery === '' ||
          (gasto.descripcion_gasto && gasto.descripcion_gasto.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (gasto.categoria && gasto.categoria.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesCategory = selectedCategory === 'all' || gasto.categoria === selectedCategory

        return isSameMonthGasto && matchesSearch && matchesCategory
      } catch (error) {
        console.error('Error filtrando gasto:', gasto, error)
        return false
      }
    })
  }, [gastos, selectedMonth, searchQuery, selectedCategory, parsearFechaUTC])

  // Paginación
  const totalPages = Math.ceil(filteredGastos.length / itemsPerPage)
  const paginatedGastos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredGastos.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredGastos, currentPage, itemsPerPage])

  // Totales
  const totalGastosMes = useMemo(() => {
    return filteredGastos.reduce((sum, gasto) => {
      const monto = parseFloat(gasto.monto_gasto || 0)
      return sum + (isNaN(monto) ? 0 : monto)
    }, 0)
  }, [filteredGastos])

  const promedioGastosMes = filteredGastos.length > 0
    ? totalGastosMes / filteredGastos.length
    : 0

  // Estadísticas por categoría
  const statsByCategory = useMemo(() => {
    const stats = {}

    filteredGastos.forEach(gasto => {
      const categoria = gasto.categoria || 'otros'
      const monto = parseFloat(gasto.monto_gasto || 0)

      if (!stats[categoria]) {
        stats[categoria] = {
          total: 0,
          count: 0,
          icon: categoryIcons[categoria] || ShoppingBag,
          color: categoryColors[categoria] || 'from-gray-100 to-gray-50 border-gray-200'
        }
      }

      stats[categoria].total += monto
      stats[categoria].count += 1
    })

    return Object.entries(stats)
      .map(([categoria, data]) => ({
        categoria,
        total: data.total,
        count: data.count,
        percentage: totalGastosMes > 0 ? (data.total / totalGastosMes * 100).toFixed(1) : 0,
        icon: data.icon,
        color: data.color
      }))
      .sort((a, b) => b.total - a.total)
  }, [filteredGastos, totalGastosMes])

  // Comparación con mes anterior
  const estadisticasMesAnterior = useMemo(() => {
    const mesAnterior = subMonths(selectedMonth, 1)
    const gastosMesAnterior = gastos.filter(gasto => {
      const fechaGasto = parsearFechaUTC(gasto.fecha)
      return fechaGasto && isSameMonth(fechaGasto, mesAnterior)
    })

    const totalMesAnterior = gastosMesAnterior.reduce((sum, gasto) =>
      sum + parseFloat(gasto.monto_gasto || 0), 0
    )

    const diferencia = totalGastosMes - totalMesAnterior
    const porcentajeCambio = totalMesAnterior > 0
      ? ((diferencia / totalMesAnterior) * 100).toFixed(1)
      : 100

    return {
      totalMesAnterior,
      diferencia,
      porcentajeCambio,
      esPositivo: diferencia <= 0, // Menor gasto es positivo
      esAhorro: diferencia < 0
    }
  }, [gastos, selectedMonth, totalGastosMes, parsearFechaUTC])

  // Gastos más altos
  const gastosMasAltos = useMemo(() => {
    return [...filteredGastos]
      .sort((a, b) => parseFloat(b.monto_gasto) - parseFloat(a.monto_gasto))
      .slice(0, 3)
  }, [filteredGastos])

  // Manejadores de eventos
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchGastos()
      toast.success('✅ Datos actualizados')
    } catch (error) {
      toast.error('Error al actualizar datos')
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchGastos])

  const handleCreate = useCallback(async (data) => {
    try {
      await createGasto(data)
      setModalOpen(false)
      toast.success('✅ Gasto registrado exitosamente')
      setTimeout(async () => { await fetchGastos() }, 500)
    } catch (error) {
      toast.error('Error al registrar')
      setModalOpen(false)
    }
  }, [createGasto, fetchGastos])

  // ✅ CORREGIDO: handleUpdate corregido
  const handleUpdate = useCallback(async (data) => {
    try {
      if (editingGasto && editingGasto.id_gasto) {
        await updateGasto(editingGasto.id_gasto, data)
        setEditingGasto(null)
        setModalOpen(false)
        toast.success('✅ Gasto actualizado exitosamente')
        setTimeout(async () => { await fetchGastos() }, 500) // ← AQUÍ ESTABA fetchGasto
      }
    } catch (error) {
      console.error('Error al actualizar gasto:', error)
      toast.error('Error al actualizar el gasto')
      setEditingGasto(null)
      setModalOpen(false)
    }
  }, [editingGasto, updateGasto, fetchGastos])

  const handleDelete = async (id) => {
    try {
      await deleteGasto(id)
      setDeletingId(null)
      toast.success('✅ Gasto eliminado')
      setTimeout(async () => { await fetchGastos() }, 300)
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleEdit = useCallback((gasto) => {
    setEditingGasto(gasto)
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

  // Función para generar reporte PDF
  const generarReportePDF = () => {
    toast.success('📊 Generando reporte de gastos...')
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedMonth(new Date())
    setCurrentPage(1)
    toast.success('Filtros limpiados')
  }

  // Obtener meses disponibles
  const availableMonths = useMemo(() => {
    if (gastos.length === 0) return [new Date()]

    const fechas = gastos
      .map(gasto => parsearFechaUTC(gasto.fecha))
      .filter(fecha => fecha && !isNaN(fecha.getTime()))

    if (fechas.length === 0) return [new Date()]

    const minDate = new Date(Math.min(...fechas.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...fechas.map(d => d.getTime())))

    return eachMonthOfInterval({
      start: startOfYear(minDate),
      end: endOfYear(maxDate)
    }).reverse()
  }, [gastos, parsearFechaUTC])

  // Formatear nombre del mes
  const formatMonth = (date) => {
    return format(date, "MMMM yyyy", { locale: es })
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar gastos</h3>
          <p className="text-gray-600 mb-6">Hubo un problema al obtener tus datos de gastos.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Gasto
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Premium */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 sm:p-8 shadow-lg text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Gestión de Gastos</h1>
                  <p className="text-red-100 mt-1 font-medium">
                    Controla y optimiza tus gastos mensuales
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={isRefreshing || loading}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 hidden sm:flex"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                <Button
                  onClick={() => setModalOpen(true)}
                  className="bg-white text-red-600 hover:bg-red-50 border-transparent shadow-md"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline font-bold">Nuevo Gasto</span>
                  <span className="sm:hidden font-bold">Nuevo</span>
                </Button>
              </div>
            </div>
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total del Mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(totalGastosMes)}
                </p>
                <div className="flex items-center mt-2">
                  <div className={`flex items-center ${estadisticasMesAnterior.esPositivo ? 'text-emerald-600' : 'text-red-600'}`}>
                    {estadisticasMesAnterior.esAhorro ? (
                      <>
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-sm font-medium ml-1">
                          {Math.abs(estadisticasMesAnterior.porcentajeCambio)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium ml-1">
                          +{estadisticasMesAnterior.porcentajeCambio}%
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 ml-2">vs mes anterior</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl border border-orange-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Promedio por Gasto</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(promedioGastosMes)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {filteredGastos.length} gastos registrados
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Categorías Activas</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {statsByCategory.length}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Último mes: {format(selectedMonth, 'MMM yyyy', { locale: es })}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <Filter className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Mayor Gasto</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {gastosMasAltos[0] ? formatCurrency(gastosMasAltos[0].monto_gasto) : '$0.00'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {gastosMasAltos[0]?.categoria || 'No hay gastos'}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <AlertCircle className="h-6 w-6 text-purple-600" />
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
                  placeholder="Buscar por descripción o categoría..."
                  className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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
                {/* Filtro por categoría */}
                <div className="w-full lg:w-48">
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white appearance-none"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">Todas las categorías</option>
                      {categorias && categorias.map((cat, index) => (
                        <option key={index} value={cat.value || cat}>
                          {cat.label || cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Filtro por mes */}
                <div className="relative w-full lg:w-auto">
                  <Button
                    variant="secondary"
                    onClick={() => setShowMonthFilter(!showMonthFilter)}
                    className="w-full justify-between"
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatMonth(selectedMonth)}
                    </div>
                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showMonthFilter ? 'rotate-180' : ''}`} />
                  </Button>

                  {showMonthFilter && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                      {availableMonths.map((month, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedMonth(month)
                            setShowMonthFilter(false)
                            setCurrentPage(1)
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${isSameMonth(month, selectedMonth)
                            ? 'bg-red-50 text-red-600 font-medium'
                            : 'text-gray-700'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="capitalize">{formatMonth(month)}</span>
                            {isSameMonth(month, selectedMonth) && (
                              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botón limpiar filtros */}
                {(searchQuery || selectedCategory !== 'all') && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="sm:w-auto"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="hidden sm:flex"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros Avanzados
                </Button>
              </div>
            </div>

            {/* Filtros avanzados */}
            {showAdvancedFilters && (
              <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Filtros Avanzados</h4>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setShowAdvancedFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rango de Fechas</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monto Mínimo</label>
                    <input
                      type="number"
                      placeholder="$0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Fecha (más reciente)</option>
                      <option>Monto (mayor a menor)</option>
                      <option>Monto (menor a mayor)</option>
                      <option>Categoría (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido Principal en Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Distribución por Categoría */}
          <div className="lg:col-span-2">
            {/* Tarjeta Principal - Historial de Gastos */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Historial de Gastos</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {filteredGastos.length} registros • {formatCurrency(totalGastosMes)} • {formatMonth(selectedMonth)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={generarReportePDF}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={handleRefresh}
                      disabled={isRefreshing || loading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Actualizar
                    </Button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600 mb-6"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando gastos</h3>
                  <p className="text-gray-500">Obteniendo tu información...</p>
                </div>
              ) : filteredGastos.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-6">
                    <TrendingDown className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery
                      ? 'No hay gastos que coincidan con tu búsqueda'
                      : 'No hay gastos registrados este mes'}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    {searchQuery
                      ? 'Intenta con otros términos de búsqueda o limpia los filtros.'
                      : `Comienza registrando tu primer gasto en ${formatMonth(selectedMonth)}.`}
                  </p>
                  <Button
                    onClick={() => setModalOpen(true)}
                    size="large"
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Registrar Primer Gasto
                  </Button>
                </div>
              ) : (
                <>
                  {/* Vista de escritorio */}
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
                            Categoría
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Monto
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedGastos.map((gasto) => {
                          const IconComponent = categoryIcons[gasto.categoria] || ShoppingBag
                          const colorClass = categoryColors[gasto.categoria] || 'from-gray-100 to-gray-50 border-gray-200'

                          return (
                            <tr
                              key={gasto.id_gasto}
                              className="hover:bg-gradient-to-r hover:from-red-50/30 hover:to-white transition-all duration-200"
                            >
                              <td className="px-6 py-5">
                                <div className="flex items-center">
                                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                                    <Calendar className="h-4 w-4 text-red-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {formatFecha(gasto.fecha)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {format(parsearFechaUTC(gasto.fecha), "EEEE", { locale: es })}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${colorClass} border`}>
                                  <IconComponent className="h-3.5 w-3.5 mr-2" />
                                  <span className="text-xs font-medium capitalize">
                                    {gasto.categoria || 'otros'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="max-w-md">
                                  <div className="text-sm text-gray-900 font-medium line-clamp-2">
                                    {gasto.descripcion_gasto || (
                                      <span className="text-gray-400 italic">Sin descripción</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-red-100 to-red-50 border border-red-200">
                                  <DollarSign className="h-3.5 w-3.5 text-red-600 mr-1.5" />
                                  <span className="text-sm font-bold text-red-700">
                                    {formatCurrency(gasto.monto_gasto)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleEdit(gasto)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingId(gasto.id_gasto)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista móvil */}
                  <div className="md:hidden">
                    <div className="divide-y divide-gray-200">
                      {paginatedGastos.map((gasto) => {
                        const IconComponent = categoryIcons[gasto.categoria] || ShoppingBag

                        return (
                          <div key={gasto.id_gasto} className="p-5 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center">
                                <div className="p-2 bg-red-100 rounded-lg mr-3">
                                  <Calendar className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatFechaCorta(gasto.fecha)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {format(parsearFechaUTC(gasto.fecha), "EEE", { locale: es })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEdit(gasto)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingId(gasto.id_gasto)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="flex items-center mb-2">
                                <IconComponent className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-xs font-medium text-gray-700 capitalize">
                                  {gasto.categoria || 'otros'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900">
                                {gasto.descripcion_gasto || (
                                  <span className="text-gray-400 italic">Sin descripción</span>
                                )}
                              </p>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                {formatFecha(gasto.fecha)}
                              </div>
                              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-red-100 to-red-50 border border-red-200">
                                <DollarSign className="h-3.5 w-3.5 text-red-600 mr-1.5" />
                                <span className="text-sm font-bold text-red-700">
                                  {formatCurrency(gasto.monto_gasto)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Paginación */}
                  {filteredGastos.length > itemsPerPage && (
                    <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-600">
                          Mostrando <span className="font-semibold">{paginatedGastos.length}</span> de{' '}
                          <span className="font-semibold">{filteredGastos.length}</span> gastos
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
                                  className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === pageNum
                                    ? 'bg-red-600 text-white'
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
          </div>

          {/* Columna Derecha - Sidebar de Análisis */}
          <div className="space-y-6">
            {/* Distribución por Categoría */}
            {statsByCategory.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Distribución por Categoría</h3>
                  <PieChart className="h-5 w-5 text-red-600" />
                </div>
                <div className="space-y-4">
                  {statsByCategory.map((stat, index) => {
                    const IconComponent = stat.icon

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 bg-gradient-to-br from-red-50 to-red-100 rounded-lg mr-3">
                              <IconComponent className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {stat.categoria}
                              </span>
                              <div className="text-xs text-gray-500">
                                {stat.count} gasto{stat.count !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">
                              {formatCurrency(stat.total)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {stat.percentage}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(stat.percentage, 100)}%`,
                              background: 'linear-gradient(90deg, #ef4444, #f97316)'
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Gastos Más Altos */}
            {gastosMasAltos.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Gastos Más Altos</h3>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="space-y-3">
                  {gastosMasAltos.map((gasto, index) => {
                    const IconComponent = categoryIcons[gasto.categoria] || ShoppingBag

                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-white rounded-lg mr-3">
                            <IconComponent className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {gasto.descripcion_gasto || 'Sin descripción'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {gasto.categoria || 'otros'} • {formatFechaCorta(gasto.fecha)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">
                            {formatCurrency(gasto.monto_gasto)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Resumen del Mes */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Resumen de {formatMonth(selectedMonth)}</h3>
                <BarChart3 className="h-5 w-5 text-red-600" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total gastado</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(totalGastosMes)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Promedio por gasto</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(promedioGastosMes)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de gastos</span>
                  <span className="text-lg font-bold text-gray-900">{filteredGastos.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Categorías usadas</span>
                  <span className="text-lg font-bold text-gray-900">{statsByCategory.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nuevo/Editar Gasto */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingGasto(null)
        }}
        title={editingGasto ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
        size="lg"
      >
        <GastoForm
          onSubmit={editingGasto ? handleUpdate : handleCreate}
          initialData={editingGasto}
          loading={loading}
          categorias={categorias}
          onClose={() => {
            setModalOpen(false)
            setEditingGasto(null)
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar gasto?</h3>
              <p className="text-gray-600">
                Esta acción no se puede deshacer. El gasto será eliminado permanentemente de tus registros.
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

export default GastosPage