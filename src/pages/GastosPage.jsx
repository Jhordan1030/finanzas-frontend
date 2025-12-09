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
  DollarSign
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const GastosPage = () => {
  const { 
    gastos, 
    loading, 
    error,
    categorias,
    createGasto, 
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

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      const categoria = gasto.categoria || 'Sin categoría'
      const monto = parseFloat(gasto.monto_gasto || 0)
      
      if (!stats[categoria]) {
        stats[categoria] = {
          total: 0,
          count: 0
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
        percentage: totalGastosMes > 0 ? (data.total / totalGastosMes * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.total - a.total)
  }, [filteredGastos, totalGastosMes])

  // Manejadores de eventos
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchGastos()
      toast.success('Datos actualizados')
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
      toast.success('✅ Gasto registrado')
      setTimeout(async () => { await fetchGastos() }, 500)
    } catch (error) {
      toast.error('Error al registrar')
      setModalOpen(false)
    }
  }, [createGasto, fetchGastos])

  const handleUpdate = useCallback(async (data) => {
    try {
      if (editingGasto && editingGasto.id_gasto) {
        await deleteGasto(editingGasto.id_gasto)
      }
      await createGasto(data)
      setEditingGasto(null)
      setModalOpen(false)
      toast.success('✅ Gasto actualizado')
      setTimeout(async () => { await fetchGastos() }, 500)
    } catch (error) {
      toast.error('Error al actualizar')
      setEditingGasto(null)
      setModalOpen(false)
    }
  }, [editingGasto, deleteGasto, createGasto, fetchGastos])

  const handleDelete = async (id) => {
    try {
      await deleteGasto(id)
      setDeletingId(null)
      toast.success('Gasto eliminado')
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
    toast.success('Descargando reporte de gastos...')
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedMonth(new Date())
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
      start: startOfMonth(minDate),
      end: endOfMonth(maxDate)
    }).reverse()
  }, [gastos, parsearFechaUTC])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error al cargar los gastos</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Gastos</h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Registra y analiza tus gastos mensuales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="small"
            onClick={generarReportePDF}
            className="hidden sm:flex"
          >
            <FileText className="h-4 w-4 mr-2" />
            Reporte
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Gasto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total del Mes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalGastosMes)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {filteredGastos.length} gastos registrados
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Promedio por Gasto</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(promedioGastosMes)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {statsByCategory.length} categorías
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categorías Activas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {statsByCategory.length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <Filter className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Último mes: {format(selectedMonth, 'MMM yyyy', { locale: es })}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por descripción o categoría..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Filtro por categoría */}
          <div className="w-full sm:w-48">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
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
          </div>

          {/* Filtro por mes */}
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setShowMonthFilter(!showMonthFilter)}
              className="w-full sm:w-auto"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {format(selectedMonth, 'MMM yyyy', { locale: es })}
              {showMonthFilter ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>

            {/* Dropdown de meses */}
            {showMonthFilter && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {availableMonths.map((month, index) => (
                    <button
                      key={index}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                        isSameMonth(month, selectedMonth) ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedMonth(month)
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
        </div>
      </div>

      {/* Distribución por categoría */}
      {statsByCategory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Categoría</h2>
          <div className="space-y-3">
            {statsByCategory.slice(0, 5).map((stat, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    {stat.categoria}
                  </span>
                  <span className="text-gray-600">
                    {formatCurrency(stat.total)} ({stat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{stat.count} gasto{stat.count !== 1 ? 's' : ''}</span>
                  <span>{stat.percentage}% del total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLA RESPONSIVE - Igual que IngresosPage */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Gastos</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredGastos.length} registros • {formatCurrency(totalGastosMes)}
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando gastos...</p>
          </div>
        ) : filteredGastos.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <TrendingDown className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? 'No hay gastos que coincidan con tu búsqueda' 
                : 'No hay gastos registrados para este mes'}
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primer Gasto
            </Button>
          </div>
        ) : (
          <>
            {/* Vista de escritorio (oculta en móvil) */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedGastos.map((gasto) => (
                      <tr key={gasto.id_gasto} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {formatFecha(gasto.fecha)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            gasto.categoria 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {gasto.categoria || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {gasto.descripcion_gasto || (
                              <span className="text-gray-400 italic">Sin descripción</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(gasto.monto_gasto)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(gasto)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(gasto.id_gasto)}
                              className="text-red-600 hover:text-red-900 p-1"
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
            </div>

            {/* Vista móvil (mostrada solo en móvil) */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200">
                {paginatedGastos.map((gasto) => (
                  <div key={gasto.id_gasto} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Fecha y monto en la misma línea */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatFechaCorta(gasto.fecha)}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(gasto.monto_gasto)}
                          </span>
                        </div>
                        
                        {/* Categoría y descripción */}
                        <div className="mb-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
                            gasto.categoria 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {gasto.categoria || 'Sin categoría'}
                          </span>
                          <p className="text-sm text-gray-900">
                            {gasto.descripcion_gasto || (
                              <span className="text-gray-400 italic">Sin descripción</span>
                            )}
                          </p>
                        </div>
                        
                        {/* Fecha completa y acciones */}
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            {formatFecha(gasto.fecha)}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(gasto)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(gasto.id_gasto)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Paginación */}
            {filteredGastos.length > itemsPerPage && (
              <div className="px-4 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-gray-500">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium px-3">
                      {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingGasto(null)
        }}
        title={editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
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

      {/* Modal de confirmación */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro de eliminar este gasto?</p>
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