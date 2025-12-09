import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/UI/Input';
import Select from '../common/UI/Select';
import Button from '../common/UI/Button';
import { toast } from 'react-hot-toast';
import { Calendar, DollarSign, FileText, Tag } from 'lucide-react';

const GastoForm = ({ onSubmit, initialData, loading, categorias = [], onClose }) => {
  // Obtener fecha actual en formato YYYY-MM-DD
  const getFechaHoy = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  // Formatear fecha para mostrar en texto
  const formatFechaParaMostrar = (fechaString) => {
    if (!fechaString) return '';
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-ES', opciones);
  };

  // Preparar categorías para el select
  const prepararCategorias = () => {
    if (!categorias || categorias.length === 0) {
      return [
        { value: 'alimentacion', label: '🍔 Alimentación' },
        { value: 'transporte', label: '🚗 Transporte' },
        { value: 'vivienda', label: '🏠 Vivienda' },
        { value: 'servicios', label: '💡 Servicios' },
        { value: 'entretenimiento', label: '🎬 Entretenimiento' },
        { value: 'salud', label: '🏥 Salud' },
        { value: 'educacion', label: '📚 Educación' },
        { value: 'otros', label: '📦 Otros' }
      ];
    }
    return categorias;
  };

  const categoriasLista = prepararCategorias();

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty }, 
    reset,
    watch
  } = useForm({
    defaultValues: {
      fecha: getFechaHoy(),
      categoria: categoriasLista[0]?.value || '',
      descripcion_gasto: '',
      monto_gasto: ''
    }
  });

  // Observar valores para mostrar preview
  const fechaActual = watch('fecha');
  const montoActual = watch('monto_gasto');
  const categoriaActual = watch('categoria');

  // Obtener nombre de categoría actual
  const getNombreCategoria = (valor) => {
    const cat = categoriasLista.find(c => c.value === valor);
    return cat ? cat.label.replace(/^[^ ]+ /, '') : 'Sin categoría';
  };

  // Resetear formulario cuando cambian los datos iniciales
  useEffect(() => {
    if (initialData) {
      // EDITAR: Extraer fecha de la base de datos
      let fechaDeBD = initialData.fecha;
      if (fechaDeBD && fechaDeBD.includes('T')) {
        fechaDeBD = fechaDeBD.split('T')[0];
      }

      reset({
        fecha: fechaDeBD || getFechaHoy(),
        categoria: initialData.categoria || categoriasLista[0]?.value || '',
        descripcion_gasto: initialData.descripcion_gasto || '',
        monto_gasto: initialData.monto_gasto || ''
      });
    } else {
      // CREAR: Usar fecha actual
      reset({
        fecha: getFechaHoy(),
        categoria: categoriasLista[0]?.value || '',
        descripcion_gasto: '',
        monto_gasto: ''
      });
    }
  }, [initialData, reset, categoriasLista]);

  const handleFormSubmit = async (data) => {
    try {
      const formattedData = {
        fecha: data.fecha,
        categoria: data.categoria,
        descripcion_gasto: data.descripcion_gasto.trim(),
        monto_gasto: parseFloat(data.monto_gasto) || 0
      };

      await onSubmit(formattedData);
      
      toast.success(initialData ? '✅ Gasto actualizado' : '✅ Gasto creado');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error(error.message || '❌ Error al guardar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con icono */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-red-100 rounded-lg">
          <DollarSign className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Editar Gasto' : 'Nuevo Gasto'}
          </h3>
          <p className="text-sm text-gray-500">
            {initialData ? 'Modifica los detalles del gasto' : 'Registra un nuevo gasto'}
          </p>
        </div>
      </div>

      {/* Resumen del gasto */}
      {(fechaActual || montoActual) && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Resumen del gasto</p>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Fecha</p>
                <p className="text-sm font-medium text-gray-900">
                  {fechaActual ? formatFechaParaMostrar(fechaActual) : 'No establecida'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Categoría</p>
                <p className="text-sm font-medium text-gray-900">
                  {categoriaActual ? getNombreCategoria(categoriaActual) : 'Sin categoría'}
                </p>
              </div>
            </div>
            {montoActual && (
              <div className="col-span-2 flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Monto total</p>
                  <p className="text-lg font-bold text-red-600">
                    ${parseFloat(montoActual).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* Campo Fecha */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Fecha del gasto
            </label>
            <span className="text-xs text-gray-500">Obligatorio</span>
          </div>
          <Input
            type="date"
            {...register('fecha', { 
              required: 'La fecha es requerida',
              validate: {
                notFuture: value => {
                  const selectedDate = new Date(value);
                  const today = new Date();
                  today.setHours(23, 59, 59, 999);
                  return selectedDate <= today || 'No puedes seleccionar una fecha futura';
                }
              }
            })}
            error={errors.fecha?.message}
            max={getFechaHoy()}
            className="w-full"
          />
        </div>

        {/* Campo Categoría */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Categoría
            </label>
            <span className="text-xs text-gray-500">Obligatorio</span>
          </div>
          <Select
            options={categoriasLista}
            {...register('categoria', { 
              required: 'La categoría es requerida'
            })}
            error={errors.categoria?.message}
            className="w-full"
          />
        </div>

        {/* Campo Descripción */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Descripción del gasto
            </label>
            <span className="text-xs text-gray-500">Obligatorio</span>
          </div>
          <Input
            placeholder="Ej: Supermercado mensual, factura de servicios, compra de materiales, etc."
            {...register('descripcion_gasto', {
              required: 'La descripción es requerida',
              maxLength: {
                value: 255,
                message: 'Máximo 255 caracteres'
              }
            })}
            error={errors.descripcion_gasto?.message}
            className="w-full"
          />
        </div>

        {/* Campo Monto */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Monto del gasto (USD)
            </label>
            <span className="text-xs text-gray-500">Obligatorio</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="pl-7 w-full"
              {...register('monto_gasto', { 
                required: 'El monto es requerido',
                min: {
                  value: 0.01,
                  message: 'El monto debe ser mayor a 0'
                },
                pattern: {
                  value: /^[0-9]*\.?[0-9]{0,2}$/,
                  message: 'Formato inválido (ej: 25.50)'
                }
              })}
              error={errors.monto_gasto?.message}
            />
          </div>
          <p className="text-xs text-gray-500">
            Ingresa el monto en dólares americanos (USD)
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
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
            disabled={loading || !isDirty}
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
                      <DollarSign className="h-4 w-4 mr-2" />
                      Registrar Gasto
                    </>
                  )}
                </>
              )}
            </div>
          </Button>
        </div>

        {/* Información de ayuda */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Información importante</h4>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>La fecha no puede ser futura</li>
                  <li>El monto debe ser mayor a $0.00</li>
                  <li>Selecciona la categoría más apropiada para tu gasto</li>
                  <li>Los cambios se guardarán inmediatamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GastoForm;