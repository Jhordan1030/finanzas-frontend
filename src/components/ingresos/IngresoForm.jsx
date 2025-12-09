import React, { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/UI/Input';
import Button from '../common/UI/Button';
import { toast } from 'react-hot-toast';
import { Calendar, DollarSign, FileText } from 'lucide-react';

const IngresoForm = ({ onSubmit, initialData, loading, onClose }) => {
  // ... (Funciones de fecha sin cambios)

  const getFechaHoy = useCallback(() => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const extraerFechaDeBD = useCallback((fechaBD) => {
    if (!fechaBD) return getFechaHoy();
    
    if (fechaBD.includes('T')) {
      return fechaBD.split('T')[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaBD)) {
      return fechaBD;
    }
    
    return getFechaHoy();
  }, [getFechaHoy]);

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
        fecha: getFechaHoy(),
        descripcion_trabajo: '',
        valor_ganado: ''
    }
  });

  const fechaActual = watch('fecha');
  const valorActual = watch('valor_ganado');

  useEffect(() => {
    if (initialData) {
      const fechaFormulario = extraerFechaDeBD(initialData.fecha);
      reset({
        fecha: fechaFormulario,
        descripcion_trabajo: initialData.descripcion_trabajo || '',
        valor_ganado: initialData.valor_ganado || ''
      });
    } else {
      reset({
        fecha: getFechaHoy(),
        descripcion_trabajo: '',
        valor_ganado: ''
      });
    }
  }, [initialData, reset, getFechaHoy, extraerFechaDeBD, setValue]);

  const handleFormSubmit = async (data) => {
    try {
      const formattedData = {
        fecha: data.fecha, 
        descripcion_trabajo: data.descripcion_trabajo?.trim() || null,
        valor_ganado: parseFloat(data.valor_ganado) || 0
      };
      
      await onSubmit(formattedData);
      
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      toast.error('❌ Error al guardar el registro');
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full"> {/* CLAVE: w-full para asegurar ajuste */}
      
      {/* Formulario */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 w-full">
        
        {/* Campo Fecha */}
        <div className="space-y-2 w-full">
          <div className="flex items-center justify-between">
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
              Fecha de trabajo *
            </label>
          </div>
          <Input
            id="fecha"
            type="date"
            icon={<Calendar className="h-4 w-4" />}
            {...register('fecha', { 
              required: 'La fecha es requerida',
              validate: {
                notFuture: value => {
                  try {
                    const selectedDate = new Date(value);
                    const today = new Date(getFechaHoy());
                    return selectedDate <= today || 'No puedes seleccionar una fecha futura';
                  } catch {
                    return true;
                  }
                }
              }
            })}
            error={errors.fecha?.message}
            max={getFechaHoy()}
            className="w-full"
          />
        </div>

        {/* Campo Descripción */}
        <div className="space-y-2 w-full">
          <label htmlFor="descripcion_trabajo" className="block text-sm font-medium text-gray-700">
            Descripción del trabajo (opcional)
          </label>
          <Input
            id="descripcion_trabajo"
            placeholder="Ej: Desarrollo web para Cliente X"
            icon={<FileText className="h-4 w-4" />}
            {...register('descripcion_trabajo', {
              maxLength: {
                value: 255,
                message: 'Máximo 255 caracteres'
              }
            })}
            error={errors.descripcion_trabajo?.message}
            className="w-full"
          />
        </div>

        {/* Campo Valor */}
        <div className="space-y-2 w-full">
          <label htmlFor="valor_ganado" className="block text-sm font-medium text-gray-700">
            Valor ganado (USD) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 font-bold">$</span>
            </div>
            <Input
              id="valor_ganado"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="pl-7 w-full"
              {...register('valor_ganado', { 
                required: 'El valor es requerido',
                min: {
                  value: 0.01,
                  message: 'El valor debe ser mayor a 0'
                },
                valueAsNumber: true
              })}
              error={errors.valor_ganado?.message}
            />
          </div>
        </div>

        {/* Resumen (responsivo) */}
        {(fechaActual || valorActual) && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6 w-full max-w-full">
            <p className="text-sm font-semibold text-blue-700 mb-2">Previsualización:</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                {/* CLAVE: Asegura el ajuste de texto */}
                <span className="text-sm text-gray-700 font-medium break-words">{fechaActual || 'Sin fecha'}</span>
              </div>
              {valorActual > 0 && (
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600">
                    ${parseFloat(valorActual).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones (totalmente responsivos) */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 order-2 sm:order-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1 order-1 sm:order-2"
            disabled={loading}
          >
            <div className="flex items-center justify-center">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  {initialData ? (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Actualizar Registro
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Registrar Día
                    </>
                  )}
                </>
              )}
            </div>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default IngresoForm;