import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const pdfService = {
  // Generar PDF de días trabajados
  generarPDFDiasTrabajados: (diasTrabajados, fechaInicio, fechaFin) => {
    try {
      const doc = new jsPDF();

      // Título
      doc.setFontSize(20);
      doc.text('Reporte de Días Trabajados', 14, 22);

      // Subtítulo
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Período: ${fechaInicio} al ${fechaFin}`, 14, 32);

      // Calcular días únicos trabajados
      const diasUnicos = new Set();
      const ingresosPorDia = {};

      diasTrabajados.forEach(dia => {
        if (dia?.fecha) {
          const fecha = new Date(dia.fecha);
          const fechaKey = fecha.toISOString().split('T')[0];
          diasUnicos.add(fechaKey);

          if (!ingresosPorDia[fechaKey]) {
            ingresosPorDia[fechaKey] = {
              fecha: fecha.toLocaleDateString('es-ES'),
              descripciones: [],
              total: 0,
              registros: 0
            };
          }

          ingresosPorDia[fechaKey].total += parseFloat(dia.valor_ganado || 0);
          ingresosPorDia[fechaKey].registros += 1;
          if (dia.descripcion_trabajo) {
            ingresosPorDia[fechaKey].descripciones.push(dia.descripcion_trabajo);
          }
        }
      });

      // Información general
      const totalDias = diasUnicos.size;
      const totalIngresos = diasTrabajados.reduce((sum, dia) => sum + parseFloat(dia.valor_ganado || 0), 0);
      const promedioDia = totalDias > 0 ? totalIngresos / totalDias : 0;
      const totalRegistros = diasTrabajados.length;

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Días trabajados (únicos): ${totalDias}`, 14, 42);
      doc.text(`Registros totales: ${totalRegistros}`, 14, 48);
      doc.text(`Total ingresos: $${totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 14, 54);
      doc.text(`Promedio por día: $${promedioDia.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 14, 60);

      // Tabla de días trabajados
      const tableColumn = ["Fecha", "Registros", "Descripción", "Total ($)"];
      const tableRows = [];

      // Ordenar días por fecha (más reciente primero)
      const diasOrdenados = Object.values(ingresosPorDia).sort((a, b) => {
        return new Date(b.fecha.split('/').reverse().join('-')) - new Date(a.fecha.split('/').reverse().join('-'));
      });

      diasOrdenados.forEach(dia => {
        const descripcion = dia.descripciones.length > 0
            ? (dia.descripciones.length > 1 ? `${dia.descripciones.length} tareas` : dia.descripciones[0])
            : 'Sin descripción';

        const diaData = [
          dia.fecha,
          dia.registros.toString(),
          descripcion,
          `$${dia.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
        ];
        tableRows.push(diaData);
      });

      // Agregar total al final
      if (tableRows.length > 0) {
        tableRows.push([
          'TOTAL',
          totalRegistros.toString(),
          '',
          `$${totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
        ]);
      }

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 85 },
          3: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 14 }
      });

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            `Generado el ${new Date().toLocaleDateString('es-ES')}`,
            doc.internal.pageSize.width - 14,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
      }

      return doc;
    } catch (error) {
      console.error('Error generando PDF de días trabajados:', error);
      return crearPDFSimple('Reporte de Días Trabajados', diasTrabajados, fechaInicio, fechaFin);
    }
  },

  // Generar PDF de gastos
  generarPDFGastos: (gastos, fechaInicio, fechaFin) => {
    try {
      const doc = new jsPDF();

      // Título
      doc.setFontSize(20);
      doc.text('Reporte de Gastos', 14, 22);

      // Subtítulo
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Período: ${fechaInicio} al ${fechaFin}`, 14, 32);

      // Información general
      const totalGastos = gastos.length;
      const totalMonto = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto_gasto || 0), 0);
      const promedioGasto = totalGastos > 0 ? totalMonto / totalGastos : 0;

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total gastos: ${totalGastos}`, 14, 42);
      doc.text(`Total monto: $${totalMonto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 14, 48);
      doc.text(`Promedio por gasto: $${promedioGasto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 14, 54);

      // Agrupar por categoría
      const gastosPorCategoria = {};
      gastos.forEach(gasto => {
        const categoria = gasto.categoria || 'Sin categoría';
        if (!gastosPorCategoria[categoria]) {
          gastosPorCategoria[categoria] = [];
        }
        gastosPorCategoria[categoria].push(gasto);
      });

      let startY = 70;

      // Tabla por categoría
      Object.entries(gastosPorCategoria).forEach(([categoria, gastosCategoria]) => {
        const totalCategoria = gastosCategoria.reduce((sum, g) => sum + parseFloat(g.monto_gasto || 0), 0);

        doc.setFontSize(12);
        doc.setTextColor(41, 128, 185);
        doc.text(`${categoria}: $${totalCategoria.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${gastosCategoria.length} gastos)`, 14, startY);
        startY += 8;

        const tableColumn = ["Fecha", "Descripción", "Monto ($)"];
        const tableRows = [];

        gastosCategoria.forEach(gasto => {
          const gastoData = [
            new Date(gasto.fecha).toLocaleDateString('es-ES'),
            gasto.descripcion_gasto || 'Sin descripción',
            `$${parseFloat(gasto.monto_gasto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
          ];
          tableRows.push(gastoData);
        });

        autoTable(doc, {
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
        });

        startY = doc.lastAutoTable.finalY + 15;
      });

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            `Generado el ${new Date().toLocaleDateString('es-ES')}`,
            doc.internal.pageSize.width - 14,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
      }

      return doc;
    } catch (error) {
      console.error('Error generando PDF de gastos:', error);
      return crearPDFSimple('Reporte de Gastos', gastos, fechaInicio, fechaFin);
    }
  },

  // Generar PDF del dashboard completo
  generarPDFDashboard: (estadisticas, datosMes) => {
    try {
      const doc = new jsPDF();

      // Título principal
      doc.setFontSize(24);
      doc.setTextColor(41, 128, 185);
      doc.text('DASHBOARD FINANCIERO', 14, 22);

      // Período
      doc.setFontSize(11);
      doc.setTextColor(100);
      const hoy = new Date();
      doc.text(`Reporte generado: ${hoy.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, 14, 32);

      doc.text(`Período: ${datosMes.mes}`, 14, 38);

      // Estadísticas principales en cuadros
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('ESTADÍSTICAS DEL MES', 14, 50);

      // Primer cuadro - Ingresos
      doc.setFillColor(230, 255, 238);
      doc.rect(14, 55, 60, 25, 'F');
      doc.setFontSize(12);
      doc.setTextColor(39, 174, 96);
      doc.text('INGRESOS', 20, 62);
      doc.setFontSize(16);
      doc.text(`$${estadisticas.totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 20, 72);

      // Segundo cuadro - Gastos
      doc.setFillColor(255, 235, 238);
      doc.rect(79, 55, 60, 25, 'F');
      doc.setFontSize(12);
      doc.setTextColor(231, 76, 60);
      doc.text('GASTOS', 85, 62);
      doc.setFontSize(16);
      doc.text(`$${estadisticas.totalGastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 85, 72);

      // Tercer cuadro - Balance
      doc.setFillColor(230, 242, 255);
      doc.rect(144, 55, 60, 25, 'F');
      doc.setFontSize(12);
      doc.setTextColor(52, 152, 219);
      doc.text('BALANCE', 150, 62);
      doc.setFontSize(16);
      doc.text(`$${estadisticas.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 150, 72);

      // Cuadro de rendimiento
      doc.setFontSize(14);
      doc.text('RENDIMIENTO', 14, 95);

      doc.setFillColor(248, 249, 250);
      doc.rect(14, 100, 190, 30, 'F');

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Días trabajados: ${estadisticas.diasTrabajados} de ${estadisticas.diasMes}`, 20, 108);
      doc.text(`Tasa de trabajo: ${estadisticas.porcentajeTrabajo}%`, 20, 115);
      doc.text(`Registros ingresos: ${estadisticas.totalRegistrosIngresos || 0}`, 20, 122);
      doc.text(`Días restantes: ${estadisticas.diasRestantes}`, 120, 108);
      doc.text(`Ingresos última semana: ${estadisticas.ingresosUltimaSemana} días`, 120, 115);
      doc.text(`Registros gastos: ${estadisticas.totalRegistrosGastos || 0}`, 120, 122);

      // Días trabajados recientes
      const startYDias = 135;
      doc.setFontSize(14);
      doc.text('DÍAS TRABAJADOS RECIENTES', 14, startYDias);

      if (estadisticas.ingresosMes && estadisticas.ingresosMes.length > 0) {
        const tableColumn = ["Fecha", "Descripción", "Valor ($)"];
        const tableRows = [];

        // Agrupar por día para el PDF
        const ingresosPorDiaPDF = {};
        estadisticas.ingresosMes.slice(0, 8).forEach(dia => {
          if (dia?.fecha) {
            const fecha = new Date(dia.fecha);
            const fechaKey = fecha.toLocaleDateString('es-ES');

            if (!ingresosPorDiaPDF[fechaKey]) {
              ingresosPorDiaPDF[fechaKey] = {
                fecha: fechaKey,
                descripciones: [],
                total: 0,
                registros: 0
              };
            }

            ingresosPorDiaPDF[fechaKey].total += parseFloat(dia.valor_ganado || 0);
            ingresosPorDiaPDF[fechaKey].registros += 1;
            if (dia.descripcion_trabajo) {
              ingresosPorDiaPDF[fechaKey].descripciones.push(dia.descripcion_trabajo);
            }
          }
        });

        // Convertir a filas de tabla
        Object.values(ingresosPorDiaPDF).forEach(dia => {
          const descripcion = dia.descripciones.length > 0
              ? (dia.descripciones.length > 1 ? `${dia.registros} registros` : dia.descripciones[0])
              : 'Sin descripción';

          tableRows.push([
            dia.fecha,
            descripcion,
            `$${dia.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
          ]);
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: startYDias + 5,
          theme: 'striped',
          headStyles: { fillColor: [46, 204, 113], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 100 },
            2: { cellWidth: 40, halign: 'right' }
          },
          margin: { left: 14 }
        });
      } else {
        doc.setFontSize(11);
        doc.setTextColor(150);
        doc.text('No hay días trabajados este mes.', 14, startYDias + 10);
      }

      // Gastos recientes
      const startYGastos = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : startYDias + 25;
      doc.setFontSize(14);
      doc.text('GASTOS RECIENTES', 14, startYGastos);

      if (estadisticas.gastosMes && estadisticas.gastosMes.length > 0) {
        const tableColumn = ["Fecha", "Descripción", "Categoría", "Monto ($)"];
        const tableRows = [];

        estadisticas.gastosMes.slice(0, 6).forEach(gasto => {
          tableRows.push([
            new Date(gasto.fecha).toLocaleDateString('es-ES'),
            gasto.descripcion_gasto || 'Sin descripción',
            gasto.categoria || 'Sin categoría',
            `$${parseFloat(gasto.monto_gasto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
          ]);
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: startYGastos + 5,
          theme: 'striped',
          headStyles: { fillColor: [231, 76, 60], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 75 },
            2: { cellWidth: 40 },
            3: { cellWidth: 35, halign: 'right' }
          },
          margin: { left: 14 }
        });
      } else {
        doc.setFontSize(11);
        doc.setTextColor(150);
        doc.text('No hay gastos este mes.', 14, startYGastos + 10);
      }

      // Gastos por categoría
      if (estadisticas.gastosPorCategoria && Object.keys(estadisticas.gastosPorCategoria).length > 0) {
        const startYCategorias = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : startYGastos + 25;
        doc.setFontSize(14);
        doc.text('DISTRIBUCIÓN DE GASTOS', 14, startYCategorias);

        const tableColumn = ["Categoría", "Total ($)", "%"];
        const tableRows = [];

        const totalGastos = estadisticas.totalGastos;
        Object.entries(estadisticas.gastosPorCategoria).forEach(([categoria, total]) => {
          const porcentaje = totalGastos > 0 ? (total / totalGastos * 100).toFixed(1) : 0;
          tableRows.push([
            categoria,
            `$${total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
            `${porcentaje}%`
          ]);
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: startYCategorias + 5,
          theme: 'striped',
          headStyles: { fillColor: [155, 89, 182], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 50, halign: 'right' },
            2: { cellWidth: 30, halign: 'right' }
          },
          margin: { left: 14 }
        });
      }

      // Nota final
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 200;
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('* Reporte generado automáticamente - Sistema Finanzas Tracker', 14, finalY);
      doc.text(`* ${estadisticas.totalRegistrosIngresos || 0} registro(s) en ${estadisticas.diasTrabajados || 0} día(s) trabajado(s)`, 14, finalY + 5);

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
      }

      return doc;
    } catch (error) {
      console.error('Error generando PDF dashboard:', error);
      return crearPDFSimple('Dashboard Financiero', null, datosMes.mes, null, estadisticas);
    }
  }
};

// Función de fallback para PDF simple
function crearPDFSimple(titulo, datos, fechaInicio, fechaFin, estadisticas) {
  try {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(titulo, 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    if (fechaInicio && fechaFin) {
      doc.text(`Período: ${fechaInicio} al ${fechaFin}`, 20, 30);
    } else if (fechaInicio) {
      doc.text(`Período: ${fechaInicio}`, 20, 30);
    }
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 37);

    if (estadisticas) {
      let y = 50;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('ESTADÍSTICAS:', 20, y);

      y += 15;
      doc.setFontSize(11);
      doc.text(`Ingresos: $${estadisticas.totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 20, y);
      y += 8;
      doc.text(`Gastos: $${estadisticas.totalGastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 20, y);
      y += 8;
      doc.text(`Balance: $${estadisticas.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 20, y);
      y += 8;
      doc.text(`Días trabajados: ${estadisticas.diasTrabajados}/${estadisticas.diasMes} (${estadisticas.porcentajeTrabajo}%)`, 20, y);
      y += 8;
      doc.text(`Registros: ${estadisticas.totalRegistrosIngresos || 0} en ${estadisticas.diasTrabajados || 0} día(s)`, 20, y);
    }

    return doc;
  } catch (error) {
    console.error('Error en PDF simple:', error);
    // Crear un PDF mínimo
    const doc = new jsPDF();
    doc.text('Error generando reporte', 20, 20);
    doc.text('Por favor, intente nuevamente', 20, 30);
    return doc;
  }
}