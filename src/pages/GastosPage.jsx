import React, { useState } from 'react'
import { useGastos } from '../hooks/useGastos'
import GastoForm from '../components/gastos/GastoForm'
import Modal from '../components/common/UI/Modal'
import Button from '../components/common/UI/Button'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const GastosPage = () => {
  const { 
    gastos, 
    loading, 
    error,
    categorias,
    createGasto, 
    deleteGasto 
  } = useGastos()
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Función para parsear fechas UTC correctamente
  const parsearFechaUTC = (fechaString) => {
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
  }

  // Función para formatear fecha CORREGIDA
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Fecha no disponible'
    
    try {
      const fechaObj = parsearFechaUTC(fechaString)
      if (!fechaObj || isNaN(fechaObj.getTime())) {
        return 'Fecha inválida'
      }
      
      // Formato: "mar, 8 dic 2025"
      return format(fechaObj, "EEE, d 'de' MMM yyyy", { locale: es })
    } catch (error) {
      console.error('Error formateando fecha:', fechaString, error)
      return 'Fecha inválida'
    }
  }

  const handleCreate = async (data) => {
    try {
      await createGasto(data)
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

  // Calcular total de gastos
  const totalGastos = gastos.reduce((sum, gasto) => {
    const monto = parseFloat(gasto.monto_gasto || 0)
    return sum + (isNaN(monto) ? 0 : monto)
  }, 0)

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
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-gray-600">Gestiona tus gastos por categorías</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total: {formatCurrency(totalGastos)}
          </div>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Gasto
          </Button>
        </div>
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

      {/* Tabla de gastos */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lista de Gastos</h2>
              <p className="text-sm text-gray-500 mt-1">
                {gastos.length} registros • Total: {formatCurrency(totalGastos)}
              </p>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Fecha</th>
                  <th className="table-header-cell">Categoría</th>
                  <th className="table-header-cell">Descripción</th>
                  <th className="table-header-cell">Monto</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : !gastos || gastos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No hay gastos registrados
                    </td>
                  </tr>
                ) : (
                  gastos.map((gasto, index) => (
                    <tr key={gasto.id_gasto || `gasto-${index}`} className="table-row hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {/* CORRECCIÓN: Usar la función de formato corregida */}
                          {formatFecha(gasto.fecha)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${gasto.categoria ? 'badge-primary' : 'badge-secondary'}`}>
                          {gasto.categoria || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="table-cell font-medium max-w-xs truncate" title={gasto.descripcion_gasto || 'Sin descripción'}>
                        {gasto.descripcion_gasto || (
                          <span className="text-gray-400 italic">Sin descripción</span>
                        )}
                      </td>
                      <td className="table-cell font-bold text-red-600">
                        {formatCurrency(gasto.monto_gasto)}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(gasto)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(gasto.id_gasto)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
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
              ¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setDeletingId(null)}
                disabled={loading}
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

export default GastosPage