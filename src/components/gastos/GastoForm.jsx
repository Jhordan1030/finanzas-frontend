import React from 'react'
import { useForm } from 'react-hook-form'
import Input from '../common/UI/Input'
import Select from '../common/UI/Select'
import Button from '../common/UI/Button'
import { toast } from 'react-hot-toast'

const GastoForm = ({ onSubmit, initialData, loading, categorias = [], onClose }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: initialData || {
      fecha: new Date().toISOString().split('T')[0],
      categoria: '',
      descripcion_gasto: '',
      monto_gasto: '',
    }
  })

  const handleFormSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        monto_gasto: parseFloat(data.monto_gasto)
      }
      await onSubmit(formattedData)
      reset()
      toast.success(initialData ? 'Gasto actualizado exitosamente' : 'Gasto creado exitosamente')
      if (onClose) onClose()
    } catch (error) {
      toast.error(error.message || 'Error al guardar el gasto')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Fecha"
        type="date"
        {...register('fecha', { required: 'La fecha es requerida' })}
        error={errors.fecha?.message}
      />

      <Select
        label="Categoría"
        options={categorias}
        {...register('categoria')}
        error={errors.categoria?.message}
      />

      <Input
        label="Descripción del gasto"
        placeholder="Ej: Supermercado mensual"
        {...register('descripcion_gasto', { 
          required: 'La descripción es requerida',
          maxLength: {
            value: 255,
            message: 'Máximo 255 caracteres'
          }
        })}
        error={errors.descripcion_gasto?.message}
      />

      <Input
        label="Monto del gasto"
        type="number"
        step="0.01"
        placeholder="0.00"
        {...register('monto_gasto', { 
          required: 'El monto es requerido',
          min: {
            value: 0,
            message: 'El monto debe ser positivo'
          }
        })}
        error={errors.monto_gasto?.message}
      />

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          loading={loading}
          className="flex-1"
        >
          {initialData ? 'Actualizar' : 'Crear'}
        </Button>
        {onClose && (
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}

export default GastoForm