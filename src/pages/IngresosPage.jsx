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
  RefreshCw
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

  // Detectar tamaño de pantalla para la vista móvil
  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // FUNCIÓN CLAVE: Parsear Fecha de forma segura
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

  // Función para formatear fecha de forma responsive
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

  // Lógica de filtrado y búsqueda
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

  // Totales y estadísticas
  const totalIngresosMes = useMemo(() => {
    return filteredIngresos.reduce((sum, ing) => 
      sum + parseFloat(ing.valor_ganado || 0), 0
    )
  }, [filteredIngresos])

  const promedioIngresosMes = filteredIngresos.length > 0 
    ? totalIngresosMes / filteredIngresos.length 
    : 0

  const availableMonths = useMemo(() => {
    if (ingresos.length === 0) return [new Date()]
    
    const fechas = ingresos
      .map(ingreso => parsearFechaUTC(ingreso.fecha))
      .filter(fecha => fecha && !isNaN(fecha.getTime()))
    
    if (fechas.length === 0) return [new Date()]
    
    const minDate = new Date(Math.min(...fechas.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...fechas.map(d => d.getTime())))
    
    return eachMonthOfInterval({
      start: startOfMonth(minDate),
      end: endOfMonth(maxDate)
    }).reverse()
  }, [ingresos, parsearFechaUTC])

  const diasTrabajadosMes = filteredIngresos.length
  const totalDiasMes = useMemo(() => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }, [selectedMonth])
  
  const porcentajeTrabajo = totalDiasMes > 0 ? ((diasTrabajadosMes / totalDiasMes) * 100).toFixed(1) : 0

  // ** Manejo de eventos **
  
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
      toast.error('Error al registrar el día trabajado')
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
      
      toast.success('✅ Día trabajado actualizado exitosamente')
      
      setTimeout(async () => { await fetchIngresos() }, 500)
      
    } catch (error) {
      toast.error('Error al actualizar el día trabajado')
      setEditingIngreso(null)
      setModalOpen(false)
    }
  }, [editingIngreso, deleteIngreso, createIngreso, fetchIngresos])

  const handleDelete = async (id) => {
    try {
      await deleteIngreso(id)
      setDeletingId(null)
      toast.success('Día trabajado eliminado exitosamente')
      
      setTimeout(async () => { await fetchIngresos() }, 300)
      
    } catch (error) {
      toast.error('Error al eliminar el día trabajado')
    }
  }

  const handleEdit = useCallback((ingreso) => {
    setEditingIngreso(ingreso)
    setModalOpen(true)
  }, [])

  const handleOpenCreateModal = useCallback(() => {
    setEditingIngreso(null)
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

  const clearSearch = () => {
    setSearchQuery('')
  }

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchIngresos()
      } catch (error) {
        // Silencio en producción
      }
    }
    loadData()
  }, [fetchIngresos])

  // Generación de PDF (sin cambios en la lógica de jspdf)
  const handleGenerarPDF = async () => {
    setGenerandoPDF(true)
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(20)
      doc.text('Reporte de Días Trabajados', 14, 22)
      
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 32)
      
      const periodo = format(selectedMonth, 'MMMM yyyy', { locale: es }).charAt(0).toUpperCase() + 
                      format(selectedMonth, 'MMMM yyyy', { locale: es }).slice(1)
      
      doc.text(`Período: ${periodo}`, 14, 38)
      
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text(`Días trabajados: ${diasTrabajadosMes} de ${totalDiasMes} (${porcentajeTrabajo}%)`, 14, 48)
      doc.text(`Total ingresos: ${formatCurrency(totalIngresosMes)}`, 14, 55)
      doc.text(`Promedio por día: ${formatCurrency(promedioIngresosMes)}`, 14, 62)
      
      const tableColumn = ["Fecha", "Descripción", "Valor"]
      const tableRows = []
      
      if (filteredIngresos.length > 0) {
        filteredIngresos.forEach(ingreso => {
          try {
            const fechaObj = parsearFechaUTC(ingreso.fecha)
            const fechaMostrar = fechaObj ? format(fechaObj, 'dd/MM/yyyy') : 'N/A'
            
            tableRows.push([
              fechaMostrar,
              ingreso.descripcion_trabajo || 'Sin descripción',
              formatCurrency(ingreso.valor_ganado)
            ])
          } catch (error) {
            // Silencio en producción
          }
        })
      } else {
        tableRows.push(['No hay datos para mostrar', '', ''])
      }
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'striped',
        headStyles: { 
          fillColor: [46, 204, 113], 
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 100 },
          2: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 14 },
        styles: { fontSize: 10 }
      })
      
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
      
      const fileName = `dias_trabajados_${format(selectedMonth, 'yyyy-MM')}.pdf`
      doc.save(fileName)
      
      toast.success('PDF generado exitosamente')
    } catch (error) {
      toast.error('Error al generar PDF')
    } finally {
      setGenerandoPDF(false)
    }
  }

  // ** Renderizado **

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-red-200">
          <p className="text-red-600 font-semibold mb-4 text-lg">Error al cargar los días trabajados</p>
          <Button variant="secondary" onClick={handleRefresh} loading={isRefreshing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header y Acciones */}
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
            Registra y gestiona tus días trabajados.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Botón PDF (oculto en móvil, visible en desktop) */}
          <Button 
            variant="secondary"
            size="small"
            onClick={handleGenerarPDF}
            loading={generandoPDF}
            className="hidden md:flex" 
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
            <Download className="h-4 w-4 ml-2" />
          </Button>
          <Button onClick={handleOpenCreateModal} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Día</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas del mes - Totalmente Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total del Mes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalIngresosMes)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {filteredIngresos.length} días trabajados
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Promedio por Día</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(promedioIngresosMes)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {porcentajeTrabajo}% de los días
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm sm:col-span-2 md:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Días Trabajados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {diasTrabajadosMes}/{totalDiasMes}
              </p>
            </div>
            <div className="p-3 bg-violet-100 rounded-full">
              <Calendar className="h-6 w-6 text-violet-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {totalDiasMes - diasTrabajadosMes} días libres
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Buscador */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por descripción..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition duration-150"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filtro por mes */}
              <div className="relative w-full sm:w-auto">
                <Button
                  variant="secondary"
                  onClick={() => setShowMonthFilter(!showMonthFilter)}
                  className="flex items-center gap-2 w-full justify-center transition duration-150"
                  aria-expanded={showMonthFilter}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {format(selectedMonth, 'MMMM yyyy', { locale: es }).charAt(0).toUpperCase() + 
                     format(selectedMonth, 'MMMM yyyy', { locale: es }).slice(1)}
                  </span>
                  {showMonthFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {/* Dropdown de meses */}
                {showMonthFilter && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10 origin-top-right">
                    <div className="p-2 max-h-60 overflow-y-auto">
                      {availableMonths.map((month, index) => (
                        <button
                          key={index}
                          className={`w-full text-left px-3 py-2 rounded transition-colors duration-150 ${
                            isSameMonth(month, selectedMonth) ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
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

          <div className="flex items-center gap-3 mt-4 md:mt-0">
            {/* Botón limpiar búsqueda (visible solo si hay búsqueda y es desktop) */}
            {searchQuery && (
              <Button
                variant="ghost"
                size="small"
                onClick={clearSearch}
                className="hidden md:flex"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}

            {/* Botón PDF móvil (oculto en desktop, visible en mobile) */}
            <Button
              variant="secondary"
              size="small"
              onClick={handleGenerarPDF}
              loading={generandoPDF}
              className="md:hidden"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla de días trabajados - Contenedor Responsive */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Fecha
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Descripción
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] text-right">
                  Valor
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12 text-right">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 sm:px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
                      <p className="text-gray-500">Cargando días trabajados...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredIngresos.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 sm:px-6 py-12 text-center">
                    <div className="text-center p-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                        <Calendar className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-4 text-lg font-medium">
                        {searchQuery 
                          ? 'No hay días trabajados que coincidan con tu búsqueda en este mes' 
                          : 'No hay días trabajados registrados para este mes.'}
                      </p>
                      <Button onClick={handleOpenCreateModal} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Día
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIngresos.map((ingreso, index) => (
                  <tr key={ingreso.id_ingreso || `ingreso-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatFecha(ingreso.fecha)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="truncate max-w-xs sm:max-w-none" title={ingreso.descripcion_trabajo || 'Sin descripción'}>
                        <p className="text-sm font-medium text-gray-900">
                          {ingreso.descripcion_trabajo || (
                            <span className="text-gray-400 italic">Sin descripción</span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(ingreso.valor_ganado)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(ingreso)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-2 hover:bg-blue-50 rounded-full"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(ingreso.id_ingreso)}
                          className="text-red-600 hover:text-red-900 transition-colors p-2 hover:bg-red-50 rounded-full"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de la tabla / Paginación */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Mostrando **{filteredIngresos.length}** días trabajados de **{ingresos.length}** registros totales.
          </p>
          <div className="flex space-x-2">
            <Button variant="ghost" size="small" disabled>
              Anterior
            </Button>
            <Button variant="ghost" size="small" disabled>
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para Crear/Editar (se mantiene responsivo por el componente Modal) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setTimeout(() => { setEditingIngreso(null) }, 300)
        }}
        title={editingIngreso ? 'Editar Día Trabajado' : 'Nuevo Día Trabajado'}
        size="md"
      >
        {modalOpen && (
          <IngresoForm
            key={editingIngreso?.id_ingreso || 'new-form'}
            onSubmit={editingIngreso ? handleUpdate : handleCreate}
            initialData={editingIngreso}
            loading={loading}
            onClose={() => {
              setModalOpen(false)
              setTimeout(() => { setEditingIngreso(null) }, 300)
            }}
          />
        )}
      </Modal>

      {/* Modal de confirmación para eliminar (Responsivo) */}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl transform transition-transform duration-300 scale-100">
            <div className="text-center">
              <Trash2 className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Eliminar Día Trabajado?
              </h3>
              <p className="text-gray-600 mb-6">
                Estás a punto de eliminar este registro de día trabajado. **Esta acción no se puede deshacer**.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeletingId(null)}
                className="flex-1"
                disabled={loading}
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