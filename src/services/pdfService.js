import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const pdfService = {
  // Generar PDF de días trabajados
  generarPDFDiasTrabajados: (diasTrabajados, fechaInicio, fechaFin) => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('Reporte de Días Trabajados', 14, 22)
    
    // Subtítulo
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Período: ${fechaInicio} al ${fechaFin}`, 14, 32)
    
    // Información general
    const totalDias = diasTrabajados.length
    const totalIngresos = diasTrabajados.reduce((sum, dia) => sum + parseFloat(dia.valor_ganado), 0)
    const promedioDia = totalDias > 0 ? totalIngresos / totalDias : 0
    
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.text(`Total días trabajados: ${totalDias}`, 14, 42)
    doc.text(`Total ingresos: $${totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 14, 48)
    doc.text(`Promedio por día: $${promedioDia.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 14, 54)
    
    // Tabla de días trabajados
    const tableColumn = ["Fecha", "Descripción", "Valor ($)"]
    const tableRows = []
    
    diasTrabajados.forEach(dia => {
      const diaData = [
        new Date(dia.fecha).toLocaleDateString('es-ES'),
        dia.descripcion_trabajo || 'Sin descripción',
        `$${parseFloat(dia.valor_ganado).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
      ]
      tableRows.push(diaData)
    })
    
    // Agregar total al final
    tableRows.push([
      'TOTAL',
      '',
      `$${totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
    ])
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 100 },
        2: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: 14 }
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
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES')}`,
        doc.internal.pageSize.width - 14,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      )
    }
    
    return doc
  },

  // Generar PDF de gastos
  generarPDFGastos: (gastos, fechaInicio, fechaFin) => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('Reporte de Gastos', 14, 22)
    
    // Subtítulo
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Período: ${fechaInicio} al ${fechaFin}`, 14, 32)
    
    // Información general
    const totalGastos = gastos.length
    const totalMonto = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto_gasto), 0)
    const promedioGasto = totalGastos > 0 ? totalMonto / totalGastos : 0
    
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.text(`Total gastos: ${totalGastos}`, 14, 42)
    doc.text(`Total monto: $${totalMonto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 14, 48)
    doc.text(`Promedio por gasto: $${promedioGasto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 14, 54)
    
    // Agrupar por categoría
    const gastosPorCategoria = {}
    gastos.forEach(gasto => {
      const categoria = gasto.categoria || 'Sin categoría'
      if (!gastosPorCategoria[categoria]) {
        gastosPorCategoria[categoria] = []
      }
      gastosPorCategoria[categoria].push(gasto)
    })
    
    let startY = 70
    
    // Tabla por categoría
    Object.entries(gastosPorCategoria).forEach(([categoria, gastosCategoria]) => {
      const totalCategoria = gastosCategoria.reduce((sum, g) => sum + parseFloat(g.monto_gasto), 0)
      
      doc.setFontSize(12)
      doc.setTextColor(41, 128, 185)
      doc.text(`${categoria}: $${totalCategoria.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 14, startY)
      startY += 8
      
      const tableColumn = ["Fecha", "Descripción", "Monto ($)"]
      const tableRows = []
      
      gastosCategoria.forEach(gasto => {
        const gastoData = [
          new Date(gasto.fecha).toLocaleDateString('es-ES'),
          gasto.descripcion_gasto,
          `$${parseFloat(gasto.monto_gasto).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
        ]
        tableRows.push(gastoData)
      })
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: startY,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 100 },
          2: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 14 }
      })
      
      startY = doc.lastAutoTable.finalY + 15
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
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES')}`,
        doc.internal.pageSize.width - 14,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      )
    }
    
    return doc
  },

  // Generar PDF de resumen general
  generarPDFResumenGeneral: (diasTrabajados, gastos, balance) => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(24)
    doc.setTextColor(41, 128, 185)
    doc.text('RESUMEN FINANCIERO', 14, 22)
    
    // Fecha de generación
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, 14, 32)
    
    // Estadísticas principales
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text('ESTADÍSTICAS PRINCIPALES', 14, 45)
    
    const totalIngresos = diasTrabajados.reduce((sum, dia) => sum + parseFloat(dia.valor_ganado), 0)
    const totalGastos = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto_gasto), 0)
    const balanceActual = totalIngresos - totalGastos
    const diasTrabajadosCount = diasTrabajados.length
    const gastosCount = gastos.length
    
    // Cuadro de estadísticas
    doc.setFillColor(240, 248, 255)
    doc.rect(14, 52, 185, 30, 'F')
    
    doc.setFontSize(11)
    doc.text(`Ingresos totales: $${totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 20, 60)
    doc.text(`Gastos totales: $${totalGastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 20, 67)
    doc.text(`Balance: $${balanceActual.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 20, 74)
    
    doc.text(`Días trabajados: ${diasTrabajadosCount}`, 120, 60)
    doc.text(`Total gastos: ${gastosCount}`, 120, 67)
    doc.text(`Promedio por día: $${(diasTrabajadosCount > 0 ? totalIngresos / diasTrabajadosCount : 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 120, 74)
    
    // Días trabajados
    doc.setFontSize(14)
    doc.text('DÍAS TRABAJADOS', 14, 95)
    
    const tableColumnDias = ["Fecha", "Descripción", "Valor ($)"]
    const tableRowsDias = []
    
    diasTrabajados.slice(0, 10).forEach(dia => {
      tableRowsDias.push([
        new Date(dia.fecha).toLocaleDateString('es-ES'),
        dia.descripcion_trabajo || 'Sin descripción',
        `$${parseFloat(dia.valor_ganado).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
      ])
    })
    
    doc.autoTable({
      head: [tableColumnDias],
      body: tableRowsDias,
      startY: 100,
      theme: 'striped',
      headStyles: { fillColor: [46, 204, 113], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 100 },
        2: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: 14 }
    })
    
    // Gastos por categoría
    const gastosPorCategoria = {}
    gastos.forEach(gasto => {
      const categoria = gasto.categoria || 'Sin categoría'
      if (!gastosPorCategoria[categoria]) {
        gastosPorCategoria[categoria] = 0
      }
      gastosPorCategoria[categoria] += parseFloat(gasto.monto_gasto)
    })
    
    const startYGastos = doc.lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.text('GASTOS POR CATEGORÍA', 14, startYGastos)
    
    const tableColumnGastos = ["Categoría", "Total ($)"]
    const tableRowsGastos = []
    
    Object.entries(gastosPorCategoria).forEach(([categoria, total]) => {
      tableRowsGastos.push([
        categoria,
        `$${total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
      ])
    })
    
    doc.autoTable({
      head: [tableColumnGastos],
      body: tableRowsGastos,
      startY: startYGastos + 5,
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: 14 }
    })
    
    // Nota final
    const finalY = doc.lastAutoTable.finalY + 15
    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text('* Este reporte es generado automáticamente por el sistema de finanzas.', 14, finalY)
    
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
    
    return doc
  }
}