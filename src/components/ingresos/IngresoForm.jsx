import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Input from '../common/UI/Input'
import Button from '../common/UI/Button'
import { toast } from 'react-hot-toast'

const IngresoForm = ({ onSubmit, initialData, loading, onClose }) => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset
  } = useForm()

  // 1. Al CREAR: Usar fecha del dispositivo
  // 2. Al EDITAR: Usar fecha de la base de datos
  useEffect(() => {
    if (initialData) {
      // EDITAR: Fecha de la base de datos
      console.log('📝 EDITANDO - Fecha de BD:', initialData.fecha)
      
      // Extraer solo YYYY-MM-DD de la fecha ISO
      let fechaFormateada = initialData.fecha
      if (fechaFormateada && fechaFormateada.includes('T')) {
        fechaFormateada = fechaFormateada.split('T')[0]
      }
      
      reset({
        fecha: fechaFormateada || getFechaHoy(),
        descripcion_trabajo: initialData.descripcion_trabajo || '',
        valor_ganado: initialData.valor_ganado || ''
      })
    } else {
      // CREAR: Fecha del dispositivo actual
      console.log('🆕 CREANDO - Usando fecha de hoy')
      reset({
        fecha: getFechaHoy(),
        descripcion_trabajo: '',
        valor_ganado: ''
      })
    }
  }, [initialData, reset])

  // Obtener fecha actual en formato YYYY-MM-DD
  const getFechaHoy = () => {
    const hoy = new Date()
    const year = hoy.getFullYear()
    const month = String(hoy.getMonth() + 1).padStart(2, '0')
    const day = String(hoy.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit({
        fecha: data.fecha,
        descripcion_trabajo: data.descripcion_trabajo || null,
        valor_ganado: parseFloat(data.valor_ganado) || 0
      })
      
      toast.success(initialData ? 'Día actualizado' : 'Día creado')
      if (onClose) onClose()
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Fecha*"
        type="date"
        {...register('fecha', { required: 'Fecha requerida' })}
        error={errors.fecha?.message}
        max={getFechaHoy()}
      />

      <Input
        label="Descripción (opcional)"
        placeholder="Ej: Desarrollo web"
        {...register('descripcion_trabajo')}
      />

      <Input
        label="Valor* (USD)"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        {...register('valor_ganado', { 
          required: 'Valor requerido',
          min: { value: 0.01, message: 'Debe ser mayor a 0' }
        })}
        error={errors.valor_ganado?.message}
      />

      <div className="flex space-x-3 pt-4">
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? 'Actualizar' : 'Crear'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export default IngresoForm