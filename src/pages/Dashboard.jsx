import React, { useState, useMemo, useEffect } from 'react'
import StatsCards from '../components/dashboard/StatsCards'
import Modal from '../components/common/UI/Modal'
import Button from '../components/common/UI/Button'
import Input from '../components/common/UI/Input'
import Select from '../components/common/UI/Select'
import { useGastos } from '../hooks/useGastos'
import { useIngresos } from '../hooks/useIngresos'
import { ChevronLeft, ChevronRight, Plus, Calendar, Tag, DollarSign, TrendingUp, TrendingDown, FileText, Download, RefreshCw, Edit, Trash2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, subMonths, addMonths, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const Dashboard = () => {
  const { 
    balance, 
    dashboard, 
    loading: gastosLoading, 
    createGasto,
    fetchGastos,
    categorias: categoriasGastos,
    gastos
  } = useGastos()
  
  const { 
    ingresos, 
    loading: ingresosLoading, 
    createIngreso,
    fetchIngresos,
    deleteIngreso
  } = useIngresos()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModalDia, setShowModalDia] = useState(false)
  const [showModalGasto, setShowModalGasto] = useState(false)
  const [registroLoading, setRegistroLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // DEBUG: Mostrar datos
  useEffect(() => {
    console.log('Dashboard - Ingresos:', ingresos)
    if (ingresos.length > 0) {
      console.log('Primer ingreso fecha:', ingresos[0].fecha)
      console.log('Primer ingreso parseado:', parsearFechaUTC(ingresos[0].fecha))
    }
  }, [ingresos])

  // Obtener configuración regional del dispositivo
  const userLocale = navigator.language || 'es-ES'
  const userLanguage = userLocale.split('-')[0]
  
  // Seleccionar locale basado en el idioma del usuario
  const getLocale = () => {
    switch(userLanguage) {
      case 'es': return es
      case 'en': return {} // inglés por defecto
      default: return es
    }
  }

  const currentLocale = getLocale()

  // Formularios con react-hook-form
  const { 
    register: registerDia, 
    handleSubmit: handleSubmitDia, 
    formState: { errors: errorsDia }, 
    reset: resetDia 
  } = useForm({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      valor_ganado: '',
      descripcion_trabajo: ''
    }
  })

  const { 
    register: registerGasto, 
    handleSubmit: handleSubmitGasto, 
    formState: { errors: errorsGasto }, 
    reset: resetGasto 
  } = useForm({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      monto_gasto: '',
      descripcion_gasto: '',
      categoria: ''
    }
  })

  // Función CORREGIDA para parsear fechas UTC correctamente
  const parsearFechaUTC = (fechaString) => {
    if (!fechaString) return null
    
    try {
      if (typeof fechaString === 'string') {
        // Si tiene formato ISO con Z (UTC)
        if (fechaString.includes('T') && fechaString.includes('Z')) {
          const fechaUTC = parseISO(fechaString)
          
          // Crear nueva fecha en hora local (evitar restar horas)
          return new Date(
            fechaUTC.getUTCFullYear(),
            fechaUTC.getUTCMonth(),
            fechaUTC.getUTCDate(),
            12, 0, 0 // Poner a medio día para evitar problemas de zona horaria
          )
        } else {
          // Si es solo fecha, agregar hora local
          return new Date(fechaString + 'T12:00:00')
        }
      }
      return new Date(fechaString)
    } catch (error) {
      console.error('Error parseando fecha:', fechaString, error)
      return null
    }
  }

  // Función para formatear fecha CORREGIDA
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Fecha no disponible'
    
    try {
      const fechaObj = parsearFechaUTC(fechaString)
      if (!fechaObj || isNaN(fechaObj.getTime())) {
        return 'Fecha inválida'
      }
      
      // Formato: "mar, 8 dic 2025"
      return format(fechaObj, "EEE, d 'de' MMM yyyy", { locale: es })
    } catch (error) {
      console.error('Error formateando fecha:', fechaString, error)
      return 'Fecha inválida'
    }
  }

  // Función para formatear fecha completa
  const formatFechaCompleta = (fechaString) => {
    if (!fechaString) return 'Fecha no disponible'
    
    try {
      const fechaObj = parsearFechaUTC(fechaString)
      if (!fechaObj || isNaN(fechaObj.getTime())) {
        return 'Fecha inválida'
      }
      
      // Formato: "martes, 8 de diciembre de 2025"
      return format(fechaObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    } catch (error) {
      console.error('Error formateando fecha completa:', fechaString, error)
      return 'Fecha inválida'
    }
  }

  // Crear mapa de días trabajados usando useMemo para optimización
  const diasTrabajadosMap = useMemo(() => {
    const map = {}
    if (ingresos && Array.isArray(ingresos)) {
      ingresos.forEach(ingreso => {
        if (ingreso && ingreso.fecha) {
          try {
            const fechaObj = parsearFechaUTC(ingreso.fecha)
            if (fechaObj && !isNaN(fechaObj.getTime())) {
              const fecha = format(fechaObj, 'yyyy-MM-dd')
              map[fecha] = {
                trabajado: true,
                valor: parseFloat(ingreso.valor_ganado || 0),
                descripcion: ingreso.descripcion_trabajo || 'Sin descripción'
              }
            }
          } catch (error) {
            console.error('Error procesando fecha del ingreso:', ingreso.fecha, error)
          }
        }
      })
    }
    return map
  }, [ingresos])

  // Funciones para el calendario
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const prevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const nextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const getDayStatus = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const isTrabajado = diasTrabajadosMap[dateKey]?.trabajado || false
    
    if (isToday(date)) {
      return isTrabajado ? 'today-worked' : 'today-not-worked'
    }
    
    return isTrabajado ? 'worked' : 'not-worked'
  }

  const dayClasses = {
    'worked': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    'not-worked': 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100',
    'today-worked': 'bg-green-500 text-white border-green-600 hover:bg-green-600',
    'today-not-worked': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
  }

  const getDayTooltip = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const trabajo = diasTrabajadosMap[dateKey]
    
    if (trabajo?.trabajado) {
      return `Trabajado: $${trabajo.valor.toFixed(2)}\n${trabajo.descripcion}`
    }
    
    return 'No trabajado'
  }

  // Calcular estadísticas del mes
  const diasTrabajadosMes = useMemo(() => {
    const currentMonthYear = format(currentDate, 'yyyy-MM')
    return Object.keys(diasTrabajadosMap).filter(fecha => 
      fecha.startsWith(currentMonthYear)
    ).length
  }, [diasTrabajadosMap, currentDate])

  const totalDiasMes = days.length
  const porcentajeTrabajo = totalDiasMes > 0 ? ((diasTrabajadosMes / totalDiasMes) * 100).toFixed(1) : 0

  // Calcular total de ingresos del mes actual
  const totalIngresosMes = useMemo(() => {
    const currentMonthYear = format(currentDate, 'yyyy-MM')
    return ingresos
      .filter(ingreso => {
        if (!ingreso || !ingreso.fecha) return false
        try {
          const fechaObj = parsearFechaUTC(ingreso.fecha)
          if (!fechaObj || isNaN(fechaObj.getTime())) return false
          const ingresoMonthYear = format(fechaObj, 'yyyy-MM')
          return ingresoMonthYear === currentMonthYear
        } catch (error) {
          console.error('Error procesando fecha para total:', ingreso?.fecha)
          return false
        }
      })
      .reduce((sum, dia) => sum + parseFloat(dia.valor_ganado || 0), 0)
  }, [ingresos, currentDate])

  // Calcular total de gastos del mes actual
  const totalGastosMes = useMemo(() => {
    const currentMonthYear = format(currentDate, 'yyyy-MM')
    return gastos
      .filter(gasto => {
        if (!gasto || !gasto.fecha) return false
        try {
          const fechaObj = parsearFechaUTC(gasto.fecha)
          if (!fechaObj || isNaN(fechaObj.getTime())) return false
          const gastoMonthYear = format(fechaObj, 'yyyy-MM')
          return gastoMonthYear === currentMonthYear
        } catch (error) {
          console.error('Error procesando fecha de gasto:', gasto?.fecha)
          return false
        }
      })
      .reduce((sum, gasto) => sum + parseFloat(gasto.monto_gasto || 0), 0)
  }, [gastos, currentDate])

  // Calcular balance real del mes
  const balanceMes = useMemo(() => {
    return totalIngresosMes - totalGastosMes
  }, [totalIngresosMes, totalGastosMes])

  // Formatear número usando formato local del dispositivo
  const formatNumeroLocal = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return '$0.00'
    
    const numero = parseFloat(valor)
    
    // Usar formato de moneda local
    return numero.toLocaleString(userLocale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Formatear número sin símbolo de moneda
  const formatNumeroSimple = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return '0.00'
    
    const numero = parseFloat(valor)
    
    return numero.toLocaleString(userLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Manejar registro de día trabajado
  const handleRegistroDiaTrabajado = async (data) => {
    setRegistroLoading(true)
    try {
      const formattedData = {
        ...data,
        valor_ganado: parseFloat(data.valor_ganado),
        descripcion_trabajo: data.descripcion_trabajo || null
      }
      await createIngreso(formattedData)
      await fetchIngresos()
      resetDia()
      setShowModalDia(false)
      toast.success('¡Día trabajado registrado!')
    } catch (error) {
      console.error('Error al registrar día trabajado:', error)
      toast.error('Error al registrar día trabajado')
    } finally {
      setRegistroLoading(false)
    }
  }

  // Manejar registro de gasto
  const handleRegistroGasto = async (data) => {
    setRegistroLoading(true)
    try {
      const formattedData = {
        ...data,
        monto_gasto: parseFloat(data.monto_gasto),
        categoria: data.categoria || null
      }
      await createGasto(formattedData)
      await fetchGastos()
      resetGasto()
      setShowModalGasto(false)
      toast.success('¡Gasto registrado!')
    } catch (error) {
      console.error('Error al registrar gasto:', error)
      toast.error('Error al registrar gasto')
    } finally {
      setRegistroLoading(false)
    }
  }

  // Eliminar día trabajado
  const handleEliminarIngreso = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este día trabajado?')) {
      try {
        await deleteIngreso(id)
        toast.success('Día trabajado eliminado')
      } catch (error) {
        toast.error('Error al eliminar el día trabajado')
      }
    }
  }

  // Abrir modales
  const abrirModalDia = () => {
    resetDia({
      fecha: new Date().toISOString().split('T')[0],
      valor_ganado: '',
      descripcion_trabajo: ''
    })
    setShowModalDia(true)
  }

  const abrirModalGasto = () => {
    resetGasto({
      fecha: new Date().toISOString().split('T')[0],
      monto_gasto: '',
      descripcion_gasto: '',
      categoria: ''
    })
    setShowModalGasto(true)
  }

  // Refrescar datos
  const handleRefresh = async () => {
    try {
      await Promise.all([fetchIngresos(), fetchGastos()])
      toast.success('Datos actualizados')
    } catch (error) {
      toast.error('Error al actualizar datos')
    }
  }

  // Función para generar PDF de resumen
  const generarPDFResumen = () => {
    setPdfLoading(true)
    
    try {
      const doc = new jsPDF()
      
      // Configurar fuente
      doc.setFont("helvetica")
      
      // Título
      doc.setFontSize(20)
      doc.text('Resumen de Trabajo', 14, 22)
      
      // Fecha de generación usando formato local
      doc.setFontSize(11)
      doc.setTextColor(100)
      const fechaActual = new Date()
      doc.text(`Generado: ${fechaActual.toLocaleDateString(userLocale)}`, 14, 32)
      
      // Período usando date-fns con locale actual
      doc.text(`Período: ${format(currentDate, 'MMMM yyyy', { locale: currentLocale })}`, 14, 38)
      
      // Filtrar datos del mes actual
      const currentMonthYear = format(currentDate, 'yyyy-MM')
      
      const ingresosMes = ingresos.filter(ingreso => {
        if (!ingreso || !ingreso.fecha) return false
        try {
          const fechaObj = parsearFechaUTC(ingreso.fecha)
          if (!fechaObj || isNaN(fechaObj.getTime())) return false
          return format(fechaObj, 'yyyy-MM') === currentMonthYear
        } catch (error) {
          console.error('Error procesando fecha:', ingreso.fecha)
          return false
        }
      })
      
      const gastosMes = gastos.filter(gasto => {
        if (!gasto || !gasto.fecha) return false
        try {
          const fechaObj = parsearFechaUTC(gasto.fecha)
          if (!fechaObj || isNaN(fechaObj.getTime())) return false
          return format(fechaObj, 'yyyy-MM') === currentMonthYear
        } catch (error) {
          console.error('Error procesando fecha:', gasto.fecha)
          return false
        }
      })
      
      // Calcular totales
      const totalIngresosPDF = ingresosMes.reduce((sum, dia) => 
        sum + parseFloat(dia.valor_ganado || 0), 0)
      
      const totalGastosPDF = gastosMes.reduce((sum, gasto) => 
        sum + parseFloat(gasto.monto_gasto || 0), 0)
      
      const balanceMesPDF = totalIngresosPDF - totalGastosPDF
      
      // Cuadro de estadísticas
      doc.setFillColor(240, 248, 255)
      doc.rect(14, 45, 185, 40, 'F')
      
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text(`Días trabajados: ${diasTrabajadosMes} de ${totalDiasMes} (${porcentajeTrabajo}%)`, 20, 55)
      doc.text(`Ingresos totales: ${formatNumeroLocal(totalIngresosPDF)}`, 20, 62)
      doc.text(`Gastos totales: ${formatNumeroLocal(totalGastosPDF)}`, 20, 69)
      doc.text(`Balance del mes: ${formatNumeroLocal(balanceMesPDF)}`, 20, 76)
      
      // Tabla de días trabajados
      const tableColumnDias = ["Fecha", "Descripción", "Valor"]
      const tableRowsDias = []
      
      if (ingresosMes.length > 0) {
        ingresosMes.slice(0, 10).forEach(dia => {
          try {
            const fechaObj = parsearFechaUTC(dia.fecha)
            const fechaMostrar = fechaObj ? format(fechaObj, 'dd/MM/yyyy') : 'Fecha no disponible'
            
            tableRowsDias.push([
              fechaMostrar,
              dia.descripcion_trabajo || 'Sin descripción',
              formatNumeroLocal(dia.valor_ganado || 0)
            ])
          } catch (error) {
            console.error('Error procesando día para PDF:', dia)
          }
        })
      } else {
        tableRowsDias.push(['No hay días trabajados este mes', '', ''])
      }
      
      // Agregar tabla de días trabajados
      autoTable(doc, {
        head: [tableColumnDias],
        body: tableRowsDias,
        startY: 90,
        theme: 'striped',
        headStyles: { 
          fillColor: [46, 204, 113], 
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 90 },
          2: { cellWidth: 45, halign: 'right' }
        },
        margin: { left: 14 },
        styles: { fontSize: 10 }
      })
      
      // Obtener la posición Y final de la primera tabla
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 100
      
      // Tabla de gastos
      doc.setFontSize(14)
      doc.setTextColor(0)
      doc.text('GASTOS DEL MES', 14, finalY)
      
      const tableColumnGastos = ["Fecha", "Descripción", "Categoría", "Monto"]
      const tableRowsGastos = []
      
      if (gastosMes.length > 0) {
        gastosMes.slice(0, 10).forEach(gasto => {
          try {
            const fechaObj = parsearFechaUTC(gasto.fecha)
            const fechaMostrar = fechaObj ? format(fechaObj, 'dd/MM/yyyy') : 'Fecha no disponible'
            
            tableRowsGastos.push([
              fechaMostrar,
              gasto.descripcion_gasto || 'Sin descripción',
              gasto.categoria || 'Sin categoría',
              formatNumeroLocal(gasto.monto_gasto || 0)
            ])
          } catch (error) {
            console.error('Error procesando gasto para PDF:', gasto)
          }
        })
      } else {
        tableRowsGastos.push(['No hay gastos este mes', '', '', ''])
      }
      
      // Agregar tabla de gastos
      autoTable(doc, {
        head: [tableColumnGastos],
        body: tableRowsGastos,
        startY: finalY + 5,
        theme: 'striped',
        headStyles: { 
          fillColor: [231, 76, 60], 
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 70 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 14 },
        styles: { fontSize: 10 }
      })
      
      // Pie de página
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.setTextColor(150)
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }
      
      // Guardar PDF
      const fileName = `resumen_trabajo_${format(currentDate, 'yyyy-MM')}.pdf`
      doc.save(fileName)
      
      toast.success('¡PDF generado exitosamente!')
    } catch (error) {
      console.error('Error al generar PDF:', error)
      toast.error('Error al generar el PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  // Si los datos están cargando
  if (ingresosLoading || gastosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  // Formatear fecha actual para mostrar
  const fechaActualFormateada = new Date().toLocaleDateString(userLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Trabajo</h1>
          <p className="text-gray-600">Seguimiento de días trabajados y finanzas</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            {fechaActualFormateada}
          </div>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="small"
            className="flex items-center"
            title="Actualizar datos"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={generarPDFResumen}
            loading={pdfLoading}
            variant="secondary"
            size="small"
            className="flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
            <Download className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Botones de Acción Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card hover-lift">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Registrar Día Trabajado</h3>
                <p className="text-gray-600 mb-4">Añade un nuevo día de trabajo con su valor</p>
                <Button onClick={abrirModalDia} className="w-full md:w-auto">
                  <Calendar className="h-4 w-4 mr-2" />
                  Nuevo Día Trabajado
                </Button>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Total este mes: <strong className="text-green-600">{formatNumeroLocal(totalIngresosMes)}</strong></span>
            </div>
          </div>
        </div>

        <div className="card hover-lift">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Registrar Gasto</h3>
                <p className="text-gray-600 mb-4">Añade un nuevo gasto con categoría</p>
                <Button onClick={abrirModalGasto} variant="secondary" className="w-full md:w-auto">
                  <Tag className="h-4 w-4 mr-2" />
                  Nuevo Gasto
                </Button>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Total este mes: <strong className="text-red-600">
                {formatNumeroLocal(totalGastosMes)}
              </strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Pasar balance real */}
      <StatsCards balance={{
        total: balanceMes,
        ingresos: totalIngresosMes,
        gastos: totalGastosMes
      }} loading={gastosLoading || ingresosLoading} />

      {/* Calendario de Trabajo */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Calendario de Días Trabajados</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600">Trabajado</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-gray-300 mr-2"></div>
                <span className="text-sm text-gray-600">No trabajado</span>
              </div>
              <Button
                onClick={generarPDFResumen}
                loading={pdfLoading}
                variant="ghost"
                size="small"
                className="ml-2"
              >
                <FileText className="h-4 w-4" />
              </Button>
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
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <h3 className="text-xl font-bold text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: currentLocale }).charAt(0).toUpperCase() + 
               format(currentDate, 'MMMM yyyy', { locale: currentLocale }).slice(1)}
            </h3>
            
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Días de la semana - Usar formato local */}
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
            {Array.from({ 
              length: monthStart.getDay() === 0 ? 6 : (monthStart.getDay() - 1) 
            }).map((_, i) => (
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
                  <span className={`text-sm font-medium ${status.includes('today') ? 'font-bold' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {diasTrabajadosMap[format(day, 'yyyy-MM-dd')]?.trabajado && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="h-1 w-1 rounded-full bg-current"></div>
                    </div>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute z-10 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-pre-line max-w-xs">
                    {getDayTooltip(day)}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Estadísticas del calendario */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{diasTrabajadosMes}</div>
                <div className="text-sm text-gray-500">Días trabajados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{totalDiasMes - diasTrabajadosMes}</div>
                <div className="text-sm text-gray-500">Días no trabajados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{porcentajeTrabajo}%</div>
                <div className="text-sm text-gray-500">Tasa de trabajo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumeroLocal(totalIngresosMes)}
                </div>
                <div className="text-sm text-gray-500">Ingresos del mes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Últimos días trabajados y gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos días trabajados */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Últimos Días Trabajados</h2>
              <Button 
                size="small" 
                variant="ghost"
                onClick={abrirModalDia}
                aria-label="Agregar día trabajado"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="card-body p-0">
            {ingresosLoading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : !ingresos || ingresos.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">📅</div>
                <p className="text-gray-500">No hay días trabajados registrados</p>
                <Button onClick={abrirModalDia} className="mt-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  Registrar Primer Día
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {ingresos.slice(0, 10).map((ingreso, index) => (
                  ingreso ? (
                    <div key={ingreso.id_ingreso || `ingreso-${index}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {ingreso.descripcion_trabajo || (
                            <span className="text-gray-400 italic">Sin descripción</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {/* CORRECCIÓN: Usar la función de formato corregida */}
                          {formatFechaCompleta(ingreso.fecha)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <p className="font-bold text-green-600 whitespace-nowrap">
                          {formatNumeroLocal(ingreso.valor_ganado)}
                        </p>
                        <button
                          onClick={() => handleEliminarIngreso(ingreso.id_ingreso)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Últimos gastos */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Últimos Gastos</h2>
              <Button 
                size="small" 
                variant="ghost"
                onClick={abrirModalGasto}
                aria-label="Agregar gasto"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="card-body p-0">
            {gastosLoading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : !gastos || gastos.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">💰</div>
                <p className="text-gray-500">No hay gastos registrados</p>
                <Button onClick={abrirModalGasto} className="mt-4">
                  <Tag className="h-4 w-4 mr-2" />
                  Registrar Primer Gasto
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {gastos.slice(0, 10).map((gasto, index) => (
                  gasto ? (
                    <div key={gasto.id_gasto || `gasto-${index}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{gasto.descripcion_gasto || 'Sin descripción'}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {/* CORRECCIÓN: Usar la función de formato corregida */}
                          {formatFecha(gasto.fecha)} • 
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs whitespace-nowrap">
                            {gasto.categoria || 'Sin categoría'}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <p className="font-bold text-red-600 whitespace-nowrap">
                          {formatNumeroLocal(gasto.monto_gasto)}
                        </p>
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Día Trabajado */}
      <Modal
        isOpen={showModalDia}
        onClose={() => {
          setShowModalDia(false)
          resetDia()
        }}
        title="Registrar Día Trabajado"
        size="md"
      >
        <form onSubmit={handleSubmitDia(handleRegistroDiaTrabajado)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha*"
              type="date"
              {...registerDia('fecha', { required: 'La fecha es requerida' })}
              error={errorsDia.fecha?.message}
            />
            <Input
              label="Valor ganado ($)*"
              type="number"
              step="0.01"
              placeholder="0.00"
              min="0.01"
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

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              loading={registroLoading}
              className="flex-1"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Registrar Día
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModalDia(false)
                resetDia()
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para Gasto */}
      <Modal
        isOpen={showModalGasto}
        onClose={() => {
          setShowModalGasto(false)
          resetGasto()
        }}
        title="Registrar Gasto"
        size="md"
      >
        <form onSubmit={handleSubmitGasto(handleRegistroGasto)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha*"
              type="date"
              {...registerGasto('fecha', { required: 'La fecha es requerida' })}
              error={errorsGasto.fecha?.message}
            />
            <Input
              label="Monto ($)*"
              type="number"
              step="0.01"
              placeholder="0.00"
              min="0.01"
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
              options={categoriasGastos || []}
              {...registerGasto('categoria')}
              error={errorsGasto.categoria?.message}
            />
            <Input
              label="Descripción*"
              placeholder="¿En qué gastaste?"
              {...registerGasto('descripcion_gasto', { 
                required: 'La descripción es requerida',
                maxLength: { value: 255, message: 'Máximo 255 caracteres' }
              })}
              error={errorsGasto.descripcion_gasto?.message}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              loading={registroLoading}
              className="flex-1"
            >
              <Tag className="h-4 w-4 mr-2" />
              Registrar Gasto
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModalGasto(false)
                resetGasto()
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Dashboard