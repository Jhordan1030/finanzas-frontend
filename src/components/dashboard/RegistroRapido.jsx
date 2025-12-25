import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/UI/Input';
import Select from '../common/UI/Select';
import Button from '../common/UI/Button';
import { Plus, DollarSign, Calendar, Tag, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RegistroRapido = ({
  onRegistroDia,
  onRegistroGasto,
  loading,
  categoriasGastos = [],
  // Nuevos props para controlar modales
  onOpenModalDia,
  onOpenModalGasto
}) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState('dia');

  const formattedCategories = useMemo(() => {
    return Array.isArray(categoriasGastos) ? categoriasGastos.map(cat => {
      if (typeof cat === 'object' && cat !== null) {
        const val = cat.value || cat.categoria || cat.id || cat.nombre;
        return {
          value: val,
          label: cat.label || cat.nombre || cat.categoria || val
        };
      }
      return cat;
    }) : [];
  }, [categoriasGastos]);

  const { register: registerDia, handleSubmit: handleSubmitDia, formState: { errors: errorsDia }, reset: resetDia } = useForm({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      valor_ganado: '',
      descripcion_trabajo: ''
    }
  });

  const { register: registerGasto, handleSubmit: handleSubmitGasto, formState: { errors: errorsGasto }, reset: resetGasto } = useForm({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      monto_gasto: '',
      descripcion_gasto: '',
      categoria: ''
    }
  });

  const handleRegistroDia = async (data) => {
    try {
      await onRegistroDia(data);
      resetDia();
      setMostrarFormulario(false);
      toast.success('Día trabajado registrado');
    } catch (error) {
      toast.error('Error al registrar día trabajado');
    }
  };

  const handleRegistroGasto = async (data) => {
    try {
      await onRegistroGasto(data);
      resetGasto();
      setMostrarFormulario(false);
      toast.success('Gasto registrado');
    } catch (error) {
      toast.error('Error al registrar gasto');
    }
  };

  const toggleFormulario = () => {
    setMostrarFormulario(!mostrarFormulario);
    if (mostrarFormulario) {
      resetDia();
      resetGasto();
    }
  };

  // Función para abrir modal de Día
  const handleAbrirModalDia = () => {
    if (onOpenModalDia) {
      onOpenModalDia();
    } else {
      setTipoRegistro('dia');
      setMostrarFormulario(true);
    }
  };

  // Función para abrir modal de Gasto
  const handleAbrirModalGasto = () => {
    if (onOpenModalGasto) {
      onOpenModalGasto();
    } else {
      setTipoRegistro('gasto');
      setMostrarFormulario(true);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
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

      {/* Opción 1: Formulario en línea (cuando mostrarFormulario es true) */}
      {mostrarFormulario && !onOpenModalDia && !onOpenModalGasto ? (
        <div className="p-6 space-y-6">
          {/* Selector de tipo */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTipoRegistro('dia')}
              className={`flex items-center justify-center p-4 rounded-lg border transition-all ${tipoRegistro === 'dia'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Día Trabajado
            </button>
            <button
              onClick={() => setTipoRegistro('gasto')}
              className={`flex items-center justify-center p-4 rounded-lg border transition-all ${tipoRegistro === 'gasto'
                ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Tag className="h-5 w-5 mr-2" />
              Gasto
            </button>
          </div>

          {/* Formulario de Día Trabajado */}
          {tipoRegistro === 'dia' && (
            <form onSubmit={handleSubmitDia(handleRegistroDia)} className="space-y-4">
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
                    min: { value: 0.01, message: 'Debe ser mayor a 0' }
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

              <Button type="submit" loading={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Día Trabajado
              </Button>
            </form>
          )}

          {/* Formulario de Gasto */}
          {tipoRegistro === 'gasto' && (
            <form onSubmit={handleSubmitGasto(handleRegistroGasto)} className="space-y-4">
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
                    min: { value: 0.01, message: 'Debe ser mayor a 0' }
                  })}
                  error={errorsGasto.monto_gasto?.message}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Categoría"
                  options={formattedCategories}
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

              <Button type="submit" loading={loading} className="w-full bg-rose-600 hover:bg-rose-700">
                <Tag className="h-4 w-4 mr-2" />
                Registrar Gasto
              </Button>
            </form>
          )}
        </div>
      ) : (
        /* Opción 2: Tarjetas de acción (cuando mostrarFormulario es false o hay props de modales) */
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tarjeta Día Trabajado */}
            <button
              onClick={handleAbrirModalDia}
              className="flex flex-col items-center justify-center p-6 bg-white border-2 border-emerald-50 rounded-2xl shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10">
                <Calendar className="h-8 w-8" />
              </div>
              <span className="font-bold text-gray-900 relative z-10 text-lg">Día Trabajado</span>
              <span className="text-sm text-gray-500 mt-1 relative z-10">Registrar actividad laboral</span>
            </button>

            {/* Tarjeta Gasto */}
            <button
              onClick={handleAbrirModalGasto}
              className="flex flex-col items-center justify-center p-6 bg-white border-2 border-rose-50 rounded-2xl shadow-sm hover:shadow-lg hover:border-rose-200 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10">
                <Tag className="h-8 w-8" />
              </div>
              <span className="font-bold text-gray-900 relative z-10 text-lg">Nuevo Gasto</span>
              <span className="text-sm text-gray-500 mt-1 relative z-10">Registrar egreso</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Haz clic en cualquier tarjeta para registrar rápidamente
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroRapido;