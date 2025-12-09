import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Input from '../common/UI/Input'
import Select from '../common/UI/Select'
import Button from '../common/UI/Button'
import { toast } from 'react-hot-toast'

const GastoForm = ({ onSubmit, initialData, loading, categorias = [], onClose }) => {
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
      console.log('📝 EDITANDO GASTO - Fecha de BD:', initialData.fecha)
      
      // Extraer solo YYYY-MM-DD de la fecha ISO
      let fechaFormateada = initialData.fecha
      if (fechaFormateada && fechaFormateada.includes('T')) {
        fechaFormateada = fechaFormateada.split('T')[0]
      }
      
      reset({
        fecha: fechaFormateada || getFechaHoy(),
        categoria: initialData.categoria || (categorias[0]?.value || ''),
        descripcion_gasto: initialData.descripcion_gasto || '',
        monto_gasto: initialData.monto_gasto || ''
      })
    } else {
      // CREAR: Fecha del dispositivo actual
      console.log('🆕 CREANDO GASTO - Usando fecha de hoy')
      reset({
        fecha: getFechaHoy(),
        categoria: categorias[0]?.value || '',
        descripcion_gasto: '',
        monto_gasto: ''
      })
    }
  }, [initialData, reset, categorias])

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
        categoria: data.categoria,
        descripcion_gasto: data.descripcion_gasto,
        monto_gasto: parseFloat(data.monto_gasto) || 0
      })
      
      toast.success(initialData ? 'Gasto actualizado' : 'Gasto creado')
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

      <Select
        label="Categoría*"
        options={categorias}
        {...register('categoria', { required: 'Categoría requerida' })}
        error={errors.categoria?.message}
      />

      <Input
        label="Descripción*"
        placeholder="Ej: Supermercado"
        {...register('descripcion_gasto', { required: 'Descripción requerida' })}
        error={errors.descripcion_gasto?.message}
      />

      <Input
        label="Monto* (USD)"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        {...register('monto_gasto', { 
          required: 'Monto requerido',
          min: { value: 0.01, message: 'Debe ser mayor a 0' }
        })}
        error={errors.monto_gasto?.message}
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

export default GastoForm