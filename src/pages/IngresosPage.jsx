import React, { useState, useMemo, useEffect } from 'react'
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
  Filter, 
  X, 
  Download, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  Search,
  MoreVertical,
  DollarSign
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

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Función CORREGIDA para manejar fechas UTC
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

  // Función para formatear fecha completa
  const formatFechaCompleta = (fechaString) => {
    if (!fechaString) return 'Fecha no disponible'
    
    try {
      const fechaObj = parsearFechaUTC(fechaString)
      if (!fechaObj || isNaN(fechaObj.getTime())) {
        return 'Fecha inválida'
      }
      
      if (mobileView) {
        return format(fechaObj, "EEE, d MMM", { locale: es })
      }
      
      return format(fechaObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    } catch (error) {
      console.error('Error formateando fecha completa:', fechaString, error)
      return 'Fecha inválida'
    }
  }

  // Filtrar ingresos por mes
  const filteredIngresos = useMemo(() => {
    return ingresos.filter(ingreso => {
      if (!ingreso.fecha) return false
      
      try {
        const fechaIngreso = parsearFechaUTC(ingreso.fecha)
        if (!fechaIngreso || isNaN(fechaIngreso.getTime())) return false
        
        // Filtrar por mes seleccionado
        const isSameMonthIngreso = isSameMonth(fechaIngreso, selectedMonth)
        
        // Filtrar por búsqueda
        const matchesSearch = searchQuery === '' || 
          (ingreso.descripcion_trabajo && 
           ingreso.descripcion_trabajo.toLowerCase().includes(searchQuery.toLowerCase()))
        
        return isSameMonthIngreso && matchesSearch
      } catch (error) {
        console.error('Error filtrando ingreso:', ingreso, error)
        return false
      }
    })
  }, [ingresos, selectedMonth, searchQuery])

  // Calcular totales del mes
  const totalIngresosMes = useMemo(() => {
    return filteredIngresos.reduce((sum, ing) => 
      sum + parseFloat(ing.valor_ganado || 0), 0
    )
  }, [filteredIngresos])

  const promedioIngresosMes = filteredIngresos.length > 0 
    ? totalIngresosMes / filteredIngresos.length 
    : 0

  // Obtener meses disponibles
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
  }, [ingresos])

  // Calcular días trabajados y libres del mes
  const diasTrabajadosMes = filteredIngresos.length
  const totalDiasMes = useMemo(() => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }, [selectedMonth])
  
  const porcentajeTrabajo = totalDiasMes > 0 ? ((diasTrabajadosMes / totalDiasMes) * 100).toFixed(1) : 0

  const handleCreate = async (data) => {
    try {
      await createIngreso(data)
      await fetchIngresos()
      setModalOpen(false)
      toast.success('Día trabajado registrado exitosamente')
    } catch (error) {
      console.error('Error creando día trabajado:', error)
      toast.error('Error al registrar el día trabajado')
    }
  }

  const handleUpdate = async (data) => {
    try {
      if (editingIngreso && editingIngreso.id_ingreso) {
        await deleteIngreso(editingIngreso.id_ingreso)
      }
      await createIngreso(data)
      setEditingIngreso(null)
      setModalOpen(false)
      toast.success('Día trabajado actualizado exitosamente')
    } catch (error) {
      console.error('Error actualizando día trabajado:', error)
      toast.error('Error al actualizar el día trabajado')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteIngreso(id)
      setDeletingId(null)
      toast.success('Día trabajado eliminado exitosamente')
    } catch (error) {
      console.error('Error eliminando día trabajado:', error)
      toast.error('Error al eliminar el día trabajado')
    }
  }

  const handleEdit = (ingreso) => {
    setEditingIngreso(ingreso)
    setModalOpen(true)
  }

  const handleOpenCreateModal = () => {
    setEditingIngreso(null)
    setModalOpen(true)
  }

  const handleGenerarPDF = async () => {
    setGenerandoPDF(true)
    try {
      const doc = new jsPDF()
      
      // Título
      doc.setFontSize(20)
      doc.text('Reporte de Días Trabajados', 14, 22)
      
      // Fecha de generación
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 32)
      
      // Período del reporte
      const periodo = format(selectedMonth, 'MMMM yyyy', { locale: es }).charAt(0).toUpperCase() + 
                     format(selectedMonth, 'MMMM yyyy', { locale: es }).slice(1)
      
      doc.text(`Período: ${periodo}`, 14, 38)
      
      // Estadísticas
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text(`Días trabajados: ${diasTrabajadosMes} de ${totalDiasMes} (${porcentajeTrabajo}%)`, 14, 48)
      doc.text(`Total ingresos: ${formatCurrency(totalIngresosMes)}`, 14, 55)
      doc.text(`Promedio por día: ${formatCurrency(promedioIngresosMes)}`, 14, 62)
      
      // Tabla de ingresos
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
            console.error('Error procesando ingreso para PDF:', ingreso)
          }
        })
      } else {
        tableRows.push(['No hay datos para mostrar', '', ''])
      }
      
      // Agregar tabla
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
      
      // Descargar PDF
      const fileName = `dias_trabajados_${format(selectedMonth, 'yyyy-MM')}.pdf`
      doc.save(fileName)
      
      toast.success('PDF generado exitosamente')
    } catch (error) {
      console.error('Error generando PDF:', error)
      toast.error('Error al generar PDF')
    } finally {
      setGenerandoPDF(false)
    }
  }

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

  // Función para limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery('')
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error al cargar los días trabajados</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Días Trabajados</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Registra y gestiona tus días trabajados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="small"
            onClick={handleGenerarPDF}
            loading={generandoPDF}
            className="hidden sm:flex"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
            <Download className="h-4 w-4 ml-2" />
          </Button>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Día</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas del mes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
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

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
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

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
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
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Buscador */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por descripción..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filtro por mes */}
              <div className="relative">
                <Button
                  variant="secondary"
                  onClick={() => setShowMonthFilter(!showMonthFilter)}
                  className="flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {format(selectedMonth, 'MMMM yyyy', { locale: es }).charAt(0).toUpperCase() + 
                     format(selectedMonth, 'MMMM yyyy', { locale: es }).slice(1)}
                  </span>
                  <span className="sm:hidden">Mes</span>
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

          <div className="flex items-center gap-3">
            {/* Botón limpiar búsqueda */}
            {searchQuery && (
              <Button
                variant="ghost"
                size="small"
                onClick={clearSearch}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}

            {/* Botón PDF móvil */}
            <Button
              variant="secondary"
              size="small"
              onClick={handleGenerarPDF}
              loading={generandoPDF}
              className="sm:hidden"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla de días trabajados - Responsive */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Historial de Días Trabajados</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredIngresos.length} de {ingresos.length} registros • {formatCurrency(totalIngresosMes)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="small"
                onClick={handleGenerarPDF}
                loading={generandoPDF}
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
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="sr-only sm:not-sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 sm:px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredIngresos.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 sm:px-6 py-12 text-center">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                        <Calendar className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-2">
                        {searchQuery 
                          ? 'No hay días trabajados que coincidan con tu búsqueda' 
                          : 'No hay días trabajados registrados para este mes'}
                      </p>
                      <Button onClick={handleOpenCreateModal} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Primer Día
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIngresos.map((ingreso, index) => (
                  <tr key={ingreso.id_ingreso || `ingreso-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div className="text-sm font-medium text-gray-900">
                          {formatFecha(ingreso.fecha)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate" title={ingreso.descripcion_trabajo || 'Sin descripción'}>
                          {ingreso.descripcion_trabajo || (
                            <span className="text-gray-400 italic">Sin descripción</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 sm:hidden mt-1">
                          {formatFecha(ingreso.fecha)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(ingreso.valor_ganado)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(ingreso)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(ingreso.id_ingreso)}
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
        {filteredIngresos.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {filteredIngresos.length} días trabajados
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
          setEditingIngreso(null)
        }}
        title={editingIngreso ? 'Editar Día Trabajado' : 'Nuevo Día Trabajado'}
        size="md"
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

      {/* Modal de confirmación para eliminar */}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar este día trabajado? Esta acción no se puede deshacer.
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

export default IngresosPage