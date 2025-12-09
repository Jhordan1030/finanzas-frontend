import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import Input from '../common/UI/Input'
import Select from '../common/UI/Select'
import Button from '../common/UI/Button'
import { Plus, DollarSign, Calendar, Tag, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

const RegistroRapido = ({ onRegistroDiaTrabajado, onRegistroGasto, loading }) => {
  const [tipoRegistro, setTipoRegistro] = useState('dia') // 'dia' o 'gasto'
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const { register: registerDia, handleSubmit: handleSubmitDia, formState: { errors: errorsDia }, reset: resetDia } = useForm({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      valor_ganado: '',
      descripcion_trabajo: ''
    }
  })

  const { register: registerGasto, handleSubmit: handleSubmitGasto, formState: { errors: errorsGasto }, reset: resetGasto } = useForm({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      monto_gasto: '',
      descripcion_gasto: '',
      categoria: ''
    }
  })

  const categoriasGastos = [
    'Alimentación',
    'Transporte',
    'Servicios',
    'Entretenimiento',
    'Educación',
    'Salud',
    'Ropa',
    'Hogar',
    'Otros'
  ]

  const handleRegistroDia = async (data) => {
    try {
      const formattedData = {
        ...data,
        valor_ganado: parseFloat(data.valor_ganado),
        descripcion_trabajo: data.descripcion_trabajo || null
      }
      await onRegistroDiaTrabajado(formattedData)
      resetDia()
      toast.success('Día trabajado registrado')
      setMostrarFormulario(false)
    } catch (error) {
      toast.error('Error al registrar día trabajado')
    }
  }

  const handleRegistroGasto = async (data) => {
    try {
      const formattedData = {
        ...data,
        monto_gasto: parseFloat(data.monto_gasto),
        categoria: data.categoria || null
      }
      await onRegistroGasto(formattedData)
      resetGasto()
      toast.success('Gasto registrado')
      setMostrarFormulario(false)
    } catch (error) {
      toast.error('Error al registrar gasto')
    }
  }

  const toggleFormulario = () => {
    setMostrarFormulario(!mostrarFormulario)
    if (mostrarFormulario) {
      resetDia()
      resetGasto()
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Registro Rápido</h2>
          <Button
            size="small"
            onClick={toggleFormulario}
            variant={mostrarFormulario ? "secondary" : "primary"}
          >
            {mostrarFormulario ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cerrar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Registro
              </>
            )}
          </Button>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="card-body space-y-4">
          {/* Selector de tipo */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setTipoRegistro('dia')}
              className={`flex-1 flex items-center justify-center py-3 rounded-lg border transition-colors ${
                tipoRegistro === 'dia'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Día Trabajado
            </button>
            <button
              onClick={() => setTipoRegistro('gasto')}
              className={`flex-1 flex items-center justify-center py-3 rounded-lg border transition-colors ${
                tipoRegistro === 'gasto'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Tag className="h-5 w-5 mr-2" />
              Gasto
            </button>
          </div>

          {/* Formulario de Día Trabajado */}
          {tipoRegistro === 'dia' && (
            <form onSubmit={handleSubmitDia(handleRegistroDia)} className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha"
                  type="date"
                  {...registerDia('fecha', { required: 'La fecha es requerida' })}
                  error={errorsDia.fecha?.message}
                />
                <Input
                  label="Valor ganado ($)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...registerDia('valor_ganado', { 
                    required: 'El valor es requerido',
                    min: { value: 0, message: 'Debe ser positivo' }
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

              <Button type="submit" loading={loading} className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Día Trabajado
              </Button>
            </form>
          )}

          {/* Formulario de Gasto */}
          {tipoRegistro === 'gasto' && (
            <form onSubmit={handleSubmitGasto(handleRegistroGasto)} className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha"
                  type="date"
                  {...registerGasto('fecha', { required: 'La fecha es requerida' })}
                  error={errorsGasto.fecha?.message}
                />
                <Input
                  label="Monto ($)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...registerGasto('monto_gasto', { 
                    required: 'El monto es requerido',
                    min: { value: 0, message: 'Debe ser positivo' }
                  })}
                  error={errorsGasto.monto_gasto?.message}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Categoría"
                  options={categoriasGastos}
                  {...registerGasto('categoria')}
                  error={errorsGasto.categoria?.message}
                />
                <Input
                  label="Descripción"
                  placeholder="¿En qué gastaste?"
                  {...registerGasto('descripcion_gasto', { 
                    required: 'La descripción es requerida',
                    maxLength: { value: 255, message: 'Máximo 255 caracteres' }
                  })}
                  error={errorsGasto.descripcion_gasto?.message}
                />
              </div>

              <Button type="submit" loading={loading} className="w-full">
                <Tag className="h-4 w-4 mr-2" />
                Registrar Gasto
              </Button>
            </form>
          )}

          {/* Consejos rápidos */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              💡 <strong>Consejo rápido:</strong> {tipoRegistro === 'dia' 
                ? 'Usa descripciones breves como "Desarrollo web" o "Consultoría"'
                : 'Agrupa gastos similares en la misma categoría para mejores reportes'}
            </p>
          </div>
        </div>
      )}

      {/* Acciones rápidas cuando el formulario está cerrado */}
      {!mostrarFormulario && (
        <div className="card-body">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setTipoRegistro('dia')
                setMostrarFormulario(true)
              }}
              className="flex flex-col items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div className="p-3 bg-green-100 rounded-full mb-2 group-hover:bg-green-200 transition-colors">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <span className="font-medium text-gray-900">Día Trabajado</span>
              <span className="text-sm text-gray-500">Registro rápido</span>
            </button>

            <button
              onClick={() => {
                setTipoRegistro('gasto')
                setMostrarFormulario(true)
              }}
              className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors group"
            >
              <div className="p-3 bg-red-100 rounded-full mb-2 group-hover:bg-red-200 transition-colors">
                <Tag className="h-6 w-6 text-red-600" />
              </div>
              <span className="font-medium text-gray-900">Gasto</span>
              <span className="text-sm text-gray-500">Registro rápido</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Haz clic en cualquier tarjeta para registrar rápidamente
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegistroRapido