import React, { useState } from 'react'
import { useIngresos } from '../hooks/useIngresos'
import IngresoForm from '../components/ingresos/IngresoForm'
import Modal from '../components/common/UI/Modal'
import Button from '../components/common/UI/Button'
import PDFButton from '../components/common/UI/PDFButton'
import { Plus, Edit, Trash2, Calendar, FileText, Filter, X, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO } from 'date-fns'
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
  const [showFiltros, setShowFiltros] = useState(false)
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    descripcion: ''
  })
  const [generandoPDF, setGenerandoPDF] = useState(false)

  // Función CORREGIDA para manejar fechas UTC
  const parsearFechaUTC = (fechaString) => {
    if (!fechaString) return null
    
    try {
      if (typeof fechaString === 'string') {
        // Si tiene formato ISO con Z (UTC)
        if (fechaString.includes('T') && fechaString.includes('Z')) {
          // Parsear como UTC y ajustar para evitar problemas de zona horaria
          const fechaUTC = parseISO(fechaString)
          
          // Crear nueva fecha en hora local (evitar restar horas)
          // Las fechas sin hora se interpretan como 00:00:00 UTC
          // Para mostrar correctamente, necesitamos asegurar que se muestre el día correcto
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
  }

  // Función para formatear fecha CORREGIDA
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Fecha no disponible'
    
    try {
      const fechaObj = parsearFechaUTC(fechaString)
      if (!fechaObj || isNaN(fechaObj.getTime())) {
        return 'Fecha inválida'
      }
      
      // OPCIÓN 1: Usar date-fns con formato que evita problemas de zona horaria
      // Formato: "mar, 8 dic 2025"
      return format(fechaObj, "EEE, d 'de' MMM yyyy", { locale: es })
      
      // OPCIÓN 2: Usar toLocaleDateString con configuración específica
      // return fechaObj.toLocaleDateString('es-ES', {
      //   weekday: 'short',
      //   day: 'numeric',
      //   month: 'short',
      //   year: 'numeric'
      // })
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
      
      // Formato: "martes, 8 de diciembre de 2025"
      return format(fechaObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    } catch (error) {
      console.error('Error formateando fecha completa:', fechaString, error)
      return 'Fecha inválida'
    }
  }

  // Filtrar ingresos con fechas CORREGIDAS
  const ingresosFiltrados = ingresos.filter(ingreso => {
    if (!ingreso || !ingreso.fecha) return false
    
    try {
      const fechaIngreso = parsearFechaUTC(ingreso.fecha)
      if (!fechaIngreso || isNaN(fechaIngreso.getTime())) return false
      
      // Filtros por fecha
      if (filtros.fechaDesde) {
        const fechaDesde = new Date(filtros.fechaDesde + 'T00:00:00')
        if (fechaIngreso < fechaDesde) return false
      }
      
      if (filtros.fechaHasta) {
        const fechaHasta = new Date(filtros.fechaHasta + 'T23:59:59')
        if (fechaIngreso > fechaHasta) return false
      }
      
      // Filtro por descripción
      if (filtros.descripcion) {
        const descripcion = ingreso.descripcion_trabajo || ''
        if (!descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())) {
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('Error filtrando ingreso:', ingreso, error)
      return false
    }
  })

  const handleCreate = async (data) => {
    try {
      await createIngreso(data)
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
      let periodo = 'Todos los registros'
      if (filtros.fechaDesde && filtros.fechaHasta) {
        periodo = `Del ${filtros.fechaDesde} al ${filtros.fechaHasta}`
      } else if (filtros.fechaDesde) {
        periodo = `Desde ${filtros.fechaDesde}`
      } else if (filtros.fechaHasta) {
        periodo = `Hasta ${filtros.fechaHasta}`
      }
      
      doc.text(`Período: ${periodo}`, 14, 38)
      
      // Calcular total
      const totalIngresos = ingresosFiltrados.reduce((sum, ing) => 
        sum + parseFloat(ing.valor_ganado || 0), 0
      )
      
      // Estadísticas
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text(`Total registros: ${ingresosFiltrados.length}`, 14, 48)
      doc.text(`Total ingresos: $${totalIngresos.toFixed(2)}`, 14, 55)
      
      // Tabla de ingresos con fechas CORREGIDAS
      const tableColumn = ["Fecha", "Descripción", "Valor ($)"]
      const tableRows = []
      
      if (ingresosFiltrados.length > 0) {
        ingresosFiltrados.forEach(ingreso => {
          try {
            const fechaObj = parsearFechaUTC(ingreso.fecha)
            const fechaMostrar = fechaObj ? format(fechaObj, 'dd/MM/yyyy') : 'N/A'
            
            tableRows.push([
              fechaMostrar,
              ingreso.descripcion_trabajo || 'Sin descripción',
              `$${parseFloat(ingreso.valor_ganado || 0).toFixed(2)}`
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
        startY: 65,
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
      const fileName = `dias_trabajados_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      doc.save(fileName)
      
      toast.success('PDF generado exitosamente')
    } catch (error) {
      console.error('Error generando PDF:', error)
      toast.error('Error al generar PDF')
    } finally {
      setGenerandoPDF(false)
    }
  }

  const handleLimpiarFiltros = () => {
    setFiltros({
      fechaDesde: '',
      fechaHasta: '',
      descripcion: ''
    })
    toast.success('Filtros limpiados')
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00'
    
    const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numberAmount || 0)
  }

  const totalIngresosFiltrados = ingresosFiltrados.reduce((sum, ing) => 
    sum + parseFloat(ing.valor_ganado || 0), 0
  )

  const promedioIngresos = ingresosFiltrados.length > 0 
    ? totalIngresosFiltrados / ingresosFiltrados.length 
    : 0

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Días Trabajados</h1>
          <p className="text-gray-600">Registra y gestiona tus días trabajados</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowFiltros(!showFiltros)} variant="secondary">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button 
            onClick={handleGenerarPDF} 
            loading={generandoPDF}
            variant="secondary"
            className="flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
            <Download className="h-4 w-4 ml-2" />
          </Button>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Día
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFiltros && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtrar Días Trabajados</h3>
            <button
              onClick={() => setShowFiltros(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros({...filtros, fechaHasta: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar en descripción
              </label>
              <input
                type="text"
                value={filtros.descripcion}
                onChange={(e) => setFiltros({...filtros, descripcion: e.target.value})}
                placeholder="Palabra clave..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {ingresosFiltrados.length} de {ingresos.length} registros encontrados
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleLimpiarFiltros} variant="ghost" size="small">
                Limpiar filtros
              </Button>
              <Button onClick={() => setShowFiltros(false)} variant="secondary" size="small">
                Aplicar filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen de filtros aplicados */}
      {(filtros.fechaDesde || filtros.fechaHasta || filtros.descripcion) && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">
                <strong>Filtros aplicados:</strong>
                {filtros.fechaDesde && ` Desde ${filtros.fechaDesde}`}
                {filtros.fechaHasta && ` Hasta ${filtros.fechaHasta}`}
                {filtros.descripcion && ` Descripción: "${filtros.descripcion}"`}
              </p>
              <p className="text-sm text-blue-600">
                Total filtrado: {formatCurrency(totalIngresosFiltrados)}
              </p>
            </div>
            <Button
              onClick={handleLimpiarFiltros}
              variant="ghost"
              size="small"
              className="text-blue-600 hover:text-blue-800"
            >
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
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

      {/* Tabla de días trabajados */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Historial de Días Trabajados</h2>
              <p className="text-sm text-gray-500 mt-1">
                Total: {formatCurrency(totalIngresosFiltrados)} • {ingresosFiltrados.length} registros
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Promedio: {formatCurrency(promedioIngresos)}
              </span>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Fecha</th>
                  <th className="table-header-cell">Descripción del Trabajo</th>
                  <th className="table-header-cell">Valor Ganado</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : !ingresos || ingresosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      {!ingresos || ingresos.length === 0 ? 
                        'No hay días trabajados registrados' : 
                        'No hay resultados con los filtros aplicados'}
                    </td>
                  </tr>
                ) : (
                  ingresosFiltrados.map((ingreso, index) => (
                    <tr key={ingreso.id_ingreso || `ingreso-${index}`} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {/* CORRECCIÓN: Usar la función de formato corregida */}
                          {formatFecha(ingreso.fecha)}
                        </div>
                      </td>
                      <td className="table-cell font-medium">
                        {ingreso.descripcion_trabajo || (
                          <span className="text-gray-400 italic">Sin descripción</span>
                        )}
                      </td>
                      <td className="table-cell font-bold text-green-600">
                        {formatCurrency(ingreso.valor_ganado)}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(ingreso)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(ingreso.id_ingreso)}
                            className="p-1 text-red-600 hover:text-red-800"
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
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que quieres eliminar este día trabajado? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setDeletingId(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deletingId)}
                loading={loading}
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