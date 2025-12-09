import React from 'react'
import { useForm } from 'react-hook-form'
import Input from '../common/UI/Input'
import Button from '../common/UI/Button'
import { toast } from 'react-hot-toast'

// Función para obtener fecha actual
const obtenerFechaActual = () => {
  const hoy = new Date();
  // Ajustar a la zona horaria local
  const fechaAjustada = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000));
  return fechaAjustada.toISOString().split('T')[0];
};

const IngresoForm = ({ onSubmit, initialData, loading, onClose }) => {
  // Determinar la fecha inicial
  const fechaInicial = initialData?.fecha || obtenerFechaActual();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      fecha: fechaInicial,
      descripcion_trabajo: initialData?.descripcion_trabajo || '',
      valor_ganado: initialData?.valor_ganado || '',
    }
  })

  const handleFormSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        valor_ganado: parseFloat(data.valor_ganado),
        // Si la descripción está vacía, enviar null
        descripcion_trabajo: data.descripcion_trabajo || null
      }
      await onSubmit(formattedData)
      reset()
      toast.success(initialData ? 'Día trabajado actualizado exitosamente' : 'Día trabajado creado exitosamente')
      if (onClose) onClose()
    } catch (error) {
      toast.error(error.message || 'Error al guardar el día trabajado')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Fecha*"
        type="date"
        {...register('fecha', { required: 'La fecha es requerida' })}
        error={errors.fecha?.message}
        // Establecer máximo como fecha actual
        max={obtenerFechaActual()}
      />

      <Input
        label="Descripción del trabajo (opcional)"
        placeholder="Ej: Desarrollo web para Cliente X"
        {...register('descripcion_trabajo', { 
          maxLength: {
            value: 255,
            message: 'Máximo 255 caracteres'
          }
        })}
        error={errors.descripcion_trabajo?.message}
      />

      <Input
        label="Valor ganado*"
        type="number"
        step="0.01"
        placeholder="0.00"
        {...register('valor_ganado', { 
          required: 'El valor es requerido',
          min: {
            value: 0,
            message: 'El valor debe ser positivo'
          }
        })}
        error={errors.valor_ganado?.message}
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

export default IngresoForm