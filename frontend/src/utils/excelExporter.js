import * as XLSX from 'xlsx';

export const exportarAExcel = (metricas, vectorEstado, evolucionMinutos) => {
  const wb = XLSX.utils.book_new();

  // ----------------------------------------------------
  // HOJA 1: Métricas
  // ----------------------------------------------------
  const dataMetricas = [
    ["Métrica / Indicador", "Valor", "Unidad / Descripción"],
    ["Tiempo Promedio que estuvieron las personas en el sistema", metricas.tiempo_promedio_sistema, "minutos"],
    ["Tiempo Promedio de espera en cola frente al empleado", metricas.tiempo_promedio_espera_cola_empleado, "minutos"],
    ["Cantidad Máxima de personas en cola frente al empleado", metricas.max_personas_cola_empleado, "personas"],
    ["Total Clientes Ingresados al sistema", metricas.total_clientes_ingresados, "clientes"],
    ["Total Clientes Atendidos por el empleado", metricas.total_clientes_atendidos_empleado, "clientes"],
    ["Total Clientes que completaron y salieron", metricas.total_clientes_completados, "clientes"],
  ];
  const wsMetricas = XLSX.utils.aoa_to_sheet(dataMetricas);

  // Formato simple de ancho de columnas
  wsMetricas['!cols'] = [
    { wch: 55 },
    { wch: 15 },
    { wch: 25 }
  ];

  XLSX.utils.book_append_sheet(wb, wsMetricas, "Métricas");

  // ----------------------------------------------------
  // HOJA 2: Vector de Estado
  // ----------------------------------------------------
  // Transformar vector_estado a formato plano de filas
  if (vectorEstado && vectorEstado.length > 0) {
    // Obtener todos los IDs de clientes presentes en las filas recortadas
    const allClientIds = new Set();
    vectorEstado.forEach(fila => {
      if (fila.clientes) {
        Object.keys(fila.clientes).forEach(cKey => allClientIds.add(cKey));
      }
    });
    const sortedClientKeys = Array.from(allClientIds).sort((a, b) => {
      const numA = parseInt(a.replace('Cliente ', ''));
      const numB = parseInt(b.replace('Cliente ', ''));
      return numA - numB;
    });

    const rowsVector = vectorEstado.map(f => {
      const rowObj = {
        "i": f.i,
        "Evento": f.evento,
        "Reloj (min)": f.reloj,
        
        "RND Llegada": f.rnd_llegada ?? "",
        "Tiempo Llegada": f.tiempo_llegada ?? "",
        "Próxima Llegada": f.proxima_llegada ?? "",
        
        "RND Caminata": f.rnd_caminata ?? "",
        "Tiempo Caminata": f.tiempo_caminata ?? "",
        "Fin Caminata": f.fin_caminata ?? "",
        
        "Estado Empleado": f.estado_empleado,
        "RND Atención Empleado": f.rnd_atencion_empleado ?? "",
        "Tiempo Atención": f.tiempo_atencion_empleado ?? "",
        "Fin Atención Empleado": f.proximo_fin_atencion_empleado ?? "",
        "Cola Empleado": f.cola_empleado,
        
        "RND Destino": f.rnd_destino ?? "",
        "Va a Corta": f.va_a_corta ?? "",
        
        "Estado Cabina Corta": f.estado_cabina_corta,
        "RND Llamada Corta": f.rnd_llamada_corta ?? "",
        "Tiempo Llamada Corta": f.tiempo_llamada_corta ?? "",
        "Fin Llamada Corta": f.proximo_fin_llamada_corta ?? "",
        "Cola Cabina Corta": f.cola_cabina_corta,
        
        "Estado Cabina Celular": f.estado_cabina_celular,
        "RND Llamada Celular": f.rnd_llamada_celular ?? "",
        "Tiempo Llamada Celular": f.tiempo_llamada_celular ?? "",
        "Fin Llamada Celular": f.proximo_fin_llamada_celular ?? "",
        "Cola Cabina Celular": f.cola_cabina_celular,
        
        "Clientes en Sistema": f.clientes_en_sistema,
        "Max Cola Empleado": f.max_cola_empleado,
        "Acum. Tiempo Sistema": f.acum_tiempo_sistema,
        "Acum. Espera Cola": f.acum_espera_cola_empleado,
      };

      // Agregar columnas para cada cliente dinámico
      sortedClientKeys.forEach(cKey => {
        const clientInfo = f.clientes ? f.clientes[cKey] : null;
        rowObj[`${cKey} Estado`] = clientInfo ? clientInfo.estado : "";
        rowObj[`${cKey} Hora Llegada`] = clientInfo ? clientInfo.llegada_sistema : "";
      });

      return rowObj;
    });

    const wsVector = XLSX.utils.json_to_sheet(rowsVector);
    XLSX.utils.book_append_sheet(wb, wsVector, "Vector de Estado");
  }

  // ----------------------------------------------------
  // HOJA 3: Clientes por Minuto
  // ----------------------------------------------------
  const dataMinutos = [
    ["Minuto", "Cantidad"],
    ...(evolucionMinutos || []).map(m => [m.minuto, m.cantidad_clientes])
  ];
  const wsMinutos = XLSX.utils.aoa_to_sheet(dataMinutos);
  wsMinutos['!cols'] = [{ wch: 15 }, { wch: 15 }];

  XLSX.utils.book_append_sheet(wb, wsMinutos, "Clientes por Minuto");

  // Descargar archivo Excel con tipo MIME explícito para que Windows lo reconozca
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Simulacion_Telefonica.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
