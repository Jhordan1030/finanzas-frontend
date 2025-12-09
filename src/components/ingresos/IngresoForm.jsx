import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/UI/Input';
import Button from '../common/UI/Button';
import { toast } from 'react-hot-toast';
import { Calendar, DollarSign, FileText } from 'lucide-react';

const IngresoForm = ({ onSubmit, initialData, loading, onClose }) => {
  // **SOLUCIÓN 1: Fecha actual del dispositivo SIN problemas de zona horaria**
  const getFechaHoy = () => {
    const hoy = new Date();
    // Obtener componentes locales (del dispositivo)
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // **SOLUCIÓN 2: Extraer fecha de BD SIN conversión de zona horaria**
  const extraerFechaDeBD = (fechaBD) => {
    if (!fechaBD) return getFechaHoy();
    
    // Si ya está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaBD)) {
      return fechaBD;
    }
    
    // Si es formato ISO con T
    if (fechaBD.includes('T')) {
      // Tomar SOLO la parte de la fecha, ignorar hora/zona
      return fechaBD.split('T')[0];
    }
    
    // Para cualquier otro formato, usar fecha actual
    return getFechaHoy();
  };

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty }, 
    reset,
    watch,
    setValue
  } = useForm();

  // Observar valores para mostrar preview
  const fechaActual = watch('fecha');
  const valorActual = watch('valor_ganado');

  // **SOLUCIÓN 3: Resetear formulario correctamente**
  useEffect(() => {
    if (initialData) {
      console.log('📝 EDITANDO - Datos iniciales:', initialData);
      
      // Usar fecha de BD SIN conversiones complicadas
      const fechaFormulario = extraerFechaDeBD(initialData.fecha);
      console.log('📝 Fecha para formulario:', fechaFormulario);
      
      // Establecer valores directamente
      setValue('fecha', fechaFormulario);
      setValue('descripcion_trabajo', initialData.descripcion_trabajo || '');
      setValue('valor_ganado', initialData.valor_ganado || '');
      
    } else {
      console.log('🆕 CREANDO - Usando fecha actual del dispositivo');
      const fechaHoy = getFechaHoy();
      console.log('🆕 Fecha hoy:', fechaHoy);
      
      reset({
        fecha: fechaHoy,
        descripcion_trabajo: '',
        valor_ganado: ''
      });
    }
  }, [initialData, reset, setValue]);

  // **SOLUCIÓN 4: Manejar submit SIN recargar página**
  const handleFormSubmit = async (data) => {
    try {
      console.log('📤 Enviando datos del formulario:', data);
      
      const formattedData = {
        fecha: data.fecha, // Ya está en formato YYYY-MM-DD
        descripcion_trabajo: data.descripcion_trabajo?.trim() || null,
        valor_ganado: parseFloat(data.valor_ganado) || 0
      };

      console.log('📤 Datos formateados para API:', formattedData);
      
      // Enviar datos
      await onSubmit(formattedData);
      
      // Mostrar mensaje de éxito
      toast.success(initialData ? '✅ Día trabajado actualizado' : '✅ Día trabajado creado');
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      toast.error(error.message || '❌ Error al guardar el registro');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Editar Día Trabajado' : 'Nuevo Día Trabajado'}
          </h3>
          <p className="text-sm text-gray-500">
            {initialData ? 'Fecha en BD: ' + (initialData.fecha || 'N/A') : 'Fecha actual del sistema'}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* Campo Fecha */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Fecha de trabajo *
            </label>
            <span className="text-xs text-gray-500">
              {initialData ? 'De la base de datos' : 'Del dispositivo'}
            </span>
          </div>
          <Input
            type="date"
            {...register('fecha', { 
              required: 'La fecha es requerida',
              validate: {
                notFuture: value => {
                  try {
                    const selectedDate = new Date(value);
                    const today = new Date();
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
          <p className="text-xs text-gray-500 mt-1">
            Valor actual en el campo: <span className="font-mono">{fechaActual || 'No establecida'}</span>
          </p>
        </div>

        {/* Campo Descripción */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Descripción del trabajo (opcional)
          </label>
          <Input
            placeholder="Ej: Desarrollo web para Cliente X"
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
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Valor ganado (USD) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <Input
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
                }
              })}
              error={errors.valor_ganado?.message}
            />
          </div>
        </div>

        {/* Resumen */}
        {(fechaActual || valorActual) && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Resumen:</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{fechaActual || 'Sin fecha'}</span>
              </div>
              {valorActual && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-bold text-emerald-600">
                    ${parseFloat(valorActual).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              console.log('Cancelando formulario');
              if (onClose) onClose();
            }}
            className="flex-1 order-2 sm:order-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1 order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
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
                      Actualizar
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Registrar
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