import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfDay,
  isValid
} from 'date-fns';
import { es } from 'date-fns/locale';

// Misma función de parseo que en Dashboard
const parsearFecha = (fechaString) => {
  try {
    // Si la fecha es un string YYYY-MM-DD
    if (typeof fechaString === 'string' && fechaString.includes('-')) {
      // Dividir la fecha
      const partes = fechaString.split('-');
      if (partes.length === 3) {
        // Crear fecha local (NO UTC)
        const año = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1;
        const dia = parseInt(partes[2]);

        const fechaLocal = new Date(año, mes, dia);

        // Validar que la fecha sea válida
        if (isValid(fechaLocal)) {
          return startOfDay(fechaLocal);
        }
      }
    }

    // Si no, intentar parsear normalmente
    const fecha = new Date(fechaString);
    if (isValid(fecha)) {
      return startOfDay(fecha);
    }

    return null;
  } catch (error) {
    console.error('Error parseando fecha:', fechaString, error);
    return null;
  }
};

const CalendarioTrabajo = ({
  diasTrabajados = [],
  currentDate,
  onPrevMonth,
  onNextMonth
}) => {
  // Crear mapa de días trabajados - VERSIÓN CORREGIDA (por día, no por registro)
  const trabajoPorDia = useMemo(() => {
    const map = {};
    const diasUnicos = new Set();

    // Primero, agrupar todos los ingresos por día
    diasTrabajados.forEach(dia => {
      if (dia?.fecha) {
        const fecha = parsearFecha(dia.fecha);
        if (fecha) {
          const fechaKey = format(fecha, 'yyyy-MM-dd');
          diasUnicos.add(fechaKey);

          // Si ya existe un registro para este día, sumar el valor
          if (map[fechaKey]) {
            map[fechaKey].valor += parseFloat(dia.valor_ganado || 0);
            // Mantener la descripción más reciente o combinarlas
            if (dia.descripcion_trabajo) {
              if (map[fechaKey].descripcion) {
                map[fechaKey].descripcion += `, ${dia.descripcion_trabajo}`;
              } else {
                map[fechaKey].descripcion = dia.descripcion_trabajo;
              }
            }
          } else {
            // Primer registro para este día
            map[fechaKey] = {
              trabajado: true,
              valor: parseFloat(dia.valor_ganado || 0),
              descripcion: dia.descripcion_trabajo || '',
              registros: 1 // Contar cuántos registros tiene este día
            };
          }
        }
      }
    });

    return map;
  }, [diasTrabajados]);

  // Calcular días del mes - VERSIÓN CORREGIDA
  const monthData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calcular estadísticas CORREGIDAS - usar días únicos del mapa
    const diasTrabajadosMes = Object.keys(trabajoPorDia).length;

    const totalDiasMes = days.length;
    const porcentajeTrabajo = totalDiasMes > 0 ?
      ((diasTrabajadosMes / totalDiasMes) * 100).toFixed(1) : 0;

    const totalIngresosMes = Object.values(trabajoPorDia).reduce((sum, dia) => {
      return sum + (dia.valor || 0);
    }, 0);

    return {
      monthStart,
      monthEnd,
      days,
      diasTrabajadosMes,
      totalDiasMes,
      porcentajeTrabajo,
      totalIngresosMes
    };
  }, [currentDate, trabajoPorDia]);

  // Clases para los días
  const dayClasses = {
    'worked': 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
    'not-worked': 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100',
    'today-worked': 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600',
    'today-not-worked': 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
  };

  // Determinar estado del día
  const getDayStatus = (date) => {
    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      const isTrabajado = trabajoPorDia[dateKey]?.trabajado || false;

      if (isToday(date)) {
        return isTrabajado ? 'today-worked' : 'today-not-worked';
      }

      return isTrabajado ? 'worked' : 'not-worked';
    } catch {
      return 'not-worked';
    }
  };

  // Tooltip del día - VERSIÓN MEJORADA
  const getDayTooltip = (date) => {
    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      const trabajo = trabajoPorDia[dateKey];

      if (trabajo?.trabajado) {
        const valor = trabajo.valor || 0;
        const registros = trabajo.registros || 1;
        let descripcion = trabajo.descripcion || 'Sin descripción';

        if (registros > 1) {
          descripcion = `${registros} registros: ${descripcion}`;
        }

        return `Trabajado: $${valor.toFixed(2)}\n${descripcion}`;
      }

      return 'No trabajado';
    } catch {
      return 'No trabajado';
    }
  };

  // Formatear número
  const formatNumero = (valor) => {
    try {
      const numero = parseFloat(valor || 0);
      return numero.toLocaleString('es-ES', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch {
      return '$0.00';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Calendario de Trabajo</h2>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center">
                {monthData.diasTrabajadosMes} de {monthData.totalDiasMes} días trabajados ({monthData.porcentajeTrabajo}%)
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 lg:mt-0">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-xs sm:text-sm text-gray-600">Trabajado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-300"></div>
              <span className="text-xs sm:text-sm text-gray-600">No trabajado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Controles del calendario */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <h3 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h3>

          <button
            onClick={onNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Espacios vacíos al inicio */}
          {Array.from({
            length: monthData.monthStart.getDay() === 0 ? 6 : (monthData.monthStart.getDay() - 1)
          }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 sm:h-12"></div>
          ))}

          {/* Días del mes */}
          {monthData.days.map((day) => {
            const status = getDayStatus(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                className={`h-10 sm:h-12 flex flex-col items-center justify-center rounded-lg border ${dayClasses[status]} ${isCurrentMonth ? 'opacity-100' : 'opacity-50'
                  } transition-all duration-200 hover:scale-105 cursor-pointer relative group`}
                title={getDayTooltip(day)}
              >
                <span className="text-xs sm:text-sm font-medium">
                  {format(day, 'd')}
                </span>
                {trabajoPorDia[format(day, 'yyyy-MM-dd')]?.trabajado && (
                  <>
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="h-1 w-1 rounded-full bg-current"></div>
                    </div>
                    {/* Mostrar indicador si hay múltiples registros */}
                    {trabajoPorDia[format(day, 'yyyy-MM-dd')]?.registros > 1 && (
                      <div className="absolute top-1 right-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                      </div>
                    )}
                  </>
                )}

                {/* Tooltip */}
                <div className="absolute z-10 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-pre-line">
                  {getDayTooltip(day)}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estadísticas */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-700">{monthData.diasTrabajadosMes}</div>
              <div className="text-sm text-emerald-600">Días trabajados</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">{monthData.totalDiasMes - monthData.diasTrabajadosMes}</div>
              <div className="text-sm text-gray-600">Días libres</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{monthData.porcentajeTrabajo}%</div>
              <div className="text-sm text-blue-600">Tasa de trabajo</div>
            </div>
            <div className="text-center p-3 bg-violet-50 rounded-lg">
              <div className="text-2xl font-bold text-violet-700">
                {formatNumero(monthData.totalIngresosMes)}
              </div>
              <div className="text-sm text-violet-600">Ingresos mes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarioTrabajo;