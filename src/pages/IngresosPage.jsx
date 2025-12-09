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
  MoreVertical
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const IngresosPage = () => {
  const { 
    ingresos, 
    loading, 
    error,
    createIngreso, 
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

  // Totales
  const totalIngresosMes = useMemo(() => {
    return filteredIngresos.reduce((sum, ing) => 
      sum + parseFloat(ing.valor_ganado || 0), 0
    )
  }, [filteredIngresos])

  const promedioIngresosMes = filteredIngresos.length > 0 
    ? totalIngresosMes / filteredIngresos.length 
    : 0

  const diasTrabajadosMes = filteredIngresos.length
  const totalDiasMes = useMemo(() => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }, [selectedMonth])
  
  const porcentajeTrabajo = totalDiasMes > 0 ? ((diasTrabajadosMes / totalDiasMes) * 100).toFixed(1) : 0

  // Manejadores de eventos (igual que antes)
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
      toast.success('✅ Día trabajado registrado')
      setTimeout(async () => { await fetchIngresos() }, 500)
    } catch (error) {
      toast.error('Error al registrar')
      setModalOpen(false)
    }
  }, [createIngreso, fetchIngresos])

  const handleUpdate = useCallback(async (data) => {
    try {
      if (editingIngreso && editingIngreso.id_ingreso) {
        await deleteIngreso(editingIngreso.id_ingreso)
      }
      await createIngreso(data)
      setEditingIngreso(null)
      setModalOpen(false)
      toast.success('✅ Día trabajado actualizado')
      setTimeout(async () => { await fetchIngresos() }, 500)
    } catch (error) {
      toast.error('Error al actualizar')
      setEditingIngreso(null)
      setModalOpen(false)
    }
  }, [editingIngreso, deleteIngreso, createIngreso, fetchIngresos])

  const handleDelete = async (id) => {
    try {
      await deleteIngreso(id)
      setDeletingId(null)
      toast.success('Día trabajado eliminado')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Días Trabajados</h1>
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
            Registra y gestiona tus días trabajados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="small"
            onClick={() => {}}
            className="hidden sm:flex"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Día</span>
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
                {formatCurrency(totalIngresosMes)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {filteredIngresos.length} días trabajados
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Promedio por Día</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(promedioIngresosMes)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {porcentajeTrabajo}% de los días
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
              placeholder="Buscar por descripción..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <Button
            variant="secondary"
            onClick={() => {}}
            className="sm:w-auto"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Mes
          </Button>
        </div>
      </div>

      {/* TABLA RESPONSIVE - Versión optimizada para móvil */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Días</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredIngresos.length} registros • {formatCurrency(totalIngresosMes)}
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando días trabajados...</p>
          </div>
        ) : filteredIngresos.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? 'No hay días trabajados que coincidan con tu búsqueda' 
                : 'No hay días trabajados registrados para este mes'}
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primer Día
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
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedIngresos.map((ingreso) => (
                      <tr key={ingreso.id_ingreso} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {formatFecha(ingreso.fecha)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {ingreso.descripcion_trabajo || (
                              <span className="text-gray-400 italic">Sin descripción</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-emerald-600">
                            {formatCurrency(ingreso.valor_ganado)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(ingreso)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(ingreso.id_ingreso)}
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
                {paginatedIngresos.map((ingreso) => (
                  <div key={ingreso.id_ingreso} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Fecha y valor en la misma línea */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatFechaCorta(ingreso.fecha)}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">
                            {formatCurrency(ingreso.valor_ganado)}
                          </span>
                        </div>
                        
                        {/* Descripción */}
                        <div className="mb-3">
                          <p className="text-sm text-gray-900">
                            {ingreso.descripcion_trabajo || (
                              <span className="text-gray-400 italic">Sin descripción</span>
                            )}
                          </p>
                        </div>
                        
                        {/* Fecha completa y acciones */}
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            {formatFecha(ingreso.fecha)}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(ingreso)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(ingreso.id_ingreso)}
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
            {filteredIngresos.length > itemsPerPage && (
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
        onClose={() => setModalOpen(false)}
        title={editingIngreso ? 'Editar Día' : 'Nuevo Día'}
      >
        <IngresoForm
          onSubmit={editingIngreso ? handleUpdate : handleCreate}
          initialData={editingIngreso}
          loading={loading}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      {/* Modal de confirmación */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro de eliminar este día trabajado?</p>
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