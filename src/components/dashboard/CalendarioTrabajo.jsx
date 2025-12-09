import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const CalendarioTrabajo = ({ diasTrabajados = [] }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [trabajoPorDia, setTrabajoPorDia] = React.useState({})

  React.useEffect(() => {
    // Crear un mapa de días trabajados
    const trabajoMap = {}
    diasTrabajados.forEach(dia => {
      const fecha = format(parseISO(dia.fecha), 'yyyy-MM-dd')
      trabajoMap[fecha] = {
        trabajado: true,
        valor: dia.valor_ganado,
        descripcion: dia.descripcion_trabajo
      }
    })
    setTrabajoPorDia(trabajoMap)
  }, [diasTrabajados])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getDayStatus = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const isTrabajado = trabajoPorDia[dateKey]?.trabajado || false
    
    if (isToday(date)) {
      return isTrabajado ? 'today-worked' : 'today-not-worked'
    }
    
    return isTrabajado ? 'worked' : 'not-worked'
  }

  const dayClasses = {
    'worked': 'bg-green-100 text-green-800 border-green-300',
    'not-worked': 'bg-gray-100 text-gray-400',
    'today-worked': 'bg-green-500 text-white border-green-600 font-bold',
    'today-not-worked': 'bg-red-100 text-red-800 border-red-300'
  }

  const getDayTooltip = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const trabajo = trabajoPorDia[dateKey]
    
    if (trabajo?.trabajado) {
      return `Trabajado: $${trabajo.valor}\n${trabajo.descripcion || 'Sin descripción'}`
    }
    
    return 'No trabajado'
  }

  const diasTrabajadosMes = Object.values(trabajoPorDia).filter(dia => 
    format(parseISO(Object.keys(trabajoPorDia).find(key => trabajoPorDia[key] === dia)), 'yyyy-MM').includes(format(currentDate, 'yyyy-MM'))
  ).length

  const totalDiasMes = days.length
  const porcentajeTrabajo = ((diasTrabajadosMes / totalDiasMes) * 100).toFixed(1)

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Calendario de Trabajo</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600">Trabajado</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-gray-300 mr-2"></div>
              <span className="text-sm text-gray-600">No trabajado</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {diasTrabajadosMes} de {totalDiasMes} días trabajados este mes ({porcentajeTrabajo}%)
        </p>
      </div>
      
      <div className="card-body">
        {/* Controles del calendario */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <h3 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h3>
          
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-2">
          {/* Espacios vacíos al inicio */}
          {Array.from({ length: monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12"></div>
          ))}
          
          {/* Días del mes */}
          {days.map((day) => {
            const status = getDayStatus(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            
            return (
              <div
                key={day.toString()}
                className={`h-12 flex flex-col items-center justify-center rounded-lg border ${dayClasses[status]} ${
                  isCurrentMonth ? 'opacity-100' : 'opacity-50'
                } transition-all duration-200 hover:scale-105 cursor-pointer relative group`}
                title={getDayTooltip(day)}
              >
                <span className="text-sm font-medium">
                  {format(day, 'd')}
                </span>
                {trabajoPorDia[format(day, 'yyyy-MM-dd')]?.trabajado && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="h-1 w-1 rounded-full bg-current"></div>
                  </div>
                )}
                
                {/* Tooltip */}
                <div className="absolute z-10 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-pre-line">
                  {getDayTooltip(day)}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Estadísticas */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{diasTrabajadosMes}</div>
              <div className="text-sm text-gray-500">Días trabajados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalDiasMes - diasTrabajadosMes}</div>
              <div className="text-sm text-gray-500">Días libres</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{porcentajeTrabajo}%</div>
              <div className="text-sm text-gray-500">Tasa de trabajo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${diasTrabajados.reduce((sum, dia) => sum + parseFloat(dia.valor_ganado), 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-500">Total del mes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarioTrabajo
