import React, { useState, useMemo, useEffect } from 'react'
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
  MoreVertical
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
  const parsearFechaUTC = (fechaString) => {
    if (!fechaString) return null
    
    try {
      if (typeof fechaString === 'string') {
        if (fechaString.includes('T') && fechaString.includes('Z')) {
          const fechaUTC = parseISO(fechaString)
          return new Date(
            fechaUTC.getUTCFullYear(),
            fechaUTC.getUTCMonth(),
            fechaUTC.getUTCDate(),
            12, 0, 0
          )
        } else {
          return new Date(fechaString + 'T12:00:00')
        }
      }
      return new Date(fechaString)
    } catch (error) {
      console.error('Error parseando fecha:', fechaString, error)
      return null
    }
  }

  // Función para formatear fecha CORREGIDA
  const formatFecha = (fechaString) => {
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
  }

  // Filtrar gastos por mes
  const filteredGastos = useMemo(() => {
    return gastos.filter(gasto => {
      if (!gasto.fecha) return false
      
      try {
        const fechaGasto = parsearFechaUTC(gasto.fecha)
        if (!fechaGasto || isNaN(fechaGasto.getTime())) return false
        
        // Filtrar por mes seleccionado
        const isSameMonthGasto = isSameMonth(fechaGasto, selectedMonth)
        
        // Filtrar por búsqueda
        const matchesSearch = searchQuery === '' || 
          (gasto.descripcion_gasto && gasto.descripcion_gasto.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (gasto.categoria && gasto.categoria.toLowerCase().includes(searchQuery.toLowerCase()))
        
        // Filtrar por categoría
        const matchesCategory = selectedCategory === 'all' || gasto.categoria === selectedCategory
        
        return isSameMonthGasto && matchesSearch && matchesCategory
      } catch (error) {
        console.error('Error filtrando gasto:', gasto, error)
        return false
      }
    })
  }, [gastos, selectedMonth, searchQuery, selectedCategory])

  // Calcular total de gastos del mes filtrado
  const totalGastosMes = useMemo(() => {
    return filteredGastos.reduce((sum, gasto) => {
      const monto = parseFloat(gasto.monto_gasto || 0)
      return sum + (isNaN(monto) ? 0 : monto)
    }, 0)
  }, [filteredGastos])

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
  }, [gastos])

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

  const handleCreate = async (data) => {
    try {
      await createGasto(data)
      await fetchGastos()
      setModalOpen(false)
      toast.success('Gasto creado exitosamente')
    } catch (error) {
      console.error('Error creating gasto:', error)
      toast.error('Error al crear el gasto')
    }
  }

  const handleUpdate = async (data) => {
    try {
      if (!editingGasto || !editingGasto.id_gasto) {
        throw new Error('No hay gasto seleccionado para editar')
      }
      
      // Eliminar el gasto viejo y crear uno nuevo
      await deleteGasto(editingGasto.id_gasto)
      await createGasto(data)
      setEditingGasto(null)
      setModalOpen(false)
      toast.success('Gasto actualizado exitosamente')
    } catch (error) {
      console.error('Error updating gasto:', error)
      toast.error(error.message || 'Error al actualizar el gasto')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteGasto(id)
      setDeletingId(null)
      toast.success('Gasto eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting gasto:', error)
      toast.error('Error al eliminar el gasto')
    }
  }

  const handleEdit = (gasto) => {
    setEditingGasto(gasto)
    setModalOpen(true)
  }

  const handleOpenCreateModal = () => {
    setEditingGasto(null)
    setModalOpen(true)
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '$0.00'
    
    const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    
    if (isNaN(numberAmount)) return '$0.00'
    
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numberAmount)
  }

  // Función para generar reporte PDF
  const generarReportePDF = () => {
    toast.success('Descargando reporte de gastos...')
    // Aquí puedes implementar la generación de PDF
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedMonth(new Date())
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Gastos</h1>
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
          <Button onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Gasto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total del Mes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalGastosMes)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {filteredGastos.length} gastos registrados
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gasto Promedio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(filteredGastos.length > 0 ? totalGastosMes / filteredGastos.length : 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-blue-600 font-bold">Ø</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Por gasto individual
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categorías</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {statsByCategory.length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <Filter className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Diferentes categorías
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Buscador */}
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
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón limpiar filtros */}
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                variant="ghost"
                size="small"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}

            {/* Filtro por mes */}
            <div className="relative">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowMonthFilter(!showMonthFilter)}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {format(selectedMonth, 'MMMM yyyy', { locale: es }).charAt(0).toUpperCase() + 
                   format(selectedMonth, 'MMMM yyyy', { locale: es }).slice(1)}
                </span>
                {showMonthFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
          </div>
        </div>
      </div>

      {/* Estadísticas por categoría */}
      {statsByCategory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Categoría</h2>
          <div className="space-y-4">
            {statsByCategory.slice(0, 5).map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{stat.categoria}</span>
                  <span className="text-gray-600">{formatCurrency(stat.total)} ({stat.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{stat.count} gasto{stat.count !== 1 ? 's' : ''}</span>
                  <span>{stat.percentage}% del total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de gastos - Responsive */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lista de Gastos</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredGastos.length} de {gastos.length} gastos • {formatCurrency(totalGastosMes)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="small"
                onClick={generarReportePDF}
                className="sm:hidden"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Categoría
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="sr-only sm:not-sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 sm:px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredGastos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 sm:px-6 py-12 text-center">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                        <TrendingDown className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No hay gastos registrados para este período</p>
                      <Button onClick={handleOpenCreateModal} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Primer Gasto
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGastos.map((gasto, index) => (
                  <tr key={gasto.id_gasto || `gasto-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div className="text-sm font-medium text-gray-900">
                          {formatFecha(gasto.fecha)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        gasto.categoria 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {gasto.categoria || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate" title={gasto.descripcion_gasto || 'Sin descripción'}>
                          {gasto.descripcion_gasto || (
                            <span className="text-gray-400 italic">Sin descripción</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 sm:hidden mt-1">
                          {gasto.categoria || 'Sin categoría'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(gasto.monto_gasto)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(gasto)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(gasto.id_gasto)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 sm:hidden">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {filteredGastos.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {filteredGastos.length} gastos
              </p>
              <div className="flex space-x-2">
                <Button variant="ghost" size="small" disabled>
                  Anterior
                </Button>
                <Button variant="ghost" size="small">
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear/editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingGasto(null)
        }}
        title={editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
        size="md"
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

      {/* Modal de confirmación para eliminar */}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setDeletingId(null)}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deletingId)}
                loading={loading}
                className="flex-1 sm:flex-none"
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