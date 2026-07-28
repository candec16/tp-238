import React, { useState } from 'react';
import { Table, Search, Layers } from 'lucide-react';

export const StateVectorTable = ({ vectorEstado, params }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!vectorEstado || vectorEstado.length === 0) {
    return (
      <div className="card empty-card">
        <Layers size={32} className="text-muted" />
        <p>No hay datos del Vector de Estado disponibles. Ejecute la simulación.</p>
      </div>
    );
  }

  function notNil(val) { return val !== null && val !== undefined; }

  // Verificar por configuración de parámetros o por presencia de datos en la respuesta
  const tieneNormalLlegadas = params?.llegadas?.tipo === 'normal' || vectorEstado.some(f => notNil(f.t2_llegada) || notNil(f.rnd2_llegada));
  const tieneNormalCaminata = params?.caminata?.tipo === 'normal' || vectorEstado.some(f => notNil(f.t2_caminata) || notNil(f.rnd2_caminata));
  const tieneNormalAtencion = params?.atencion_empleado?.tipo === 'normal' || vectorEstado.some(f => notNil(f.t2_atencion) || notNil(f.rnd2_atencion_empleado));
  const tieneNormalCorta = params?.llamada_corta?.tipo === 'normal' || vectorEstado.some(f => notNil(f.t2_corta) || notNil(f.rnd2_llamada_corta));
  const tieneNormalCelular = params?.llamada_celular?.tipo === 'normal' || vectorEstado.some(f => notNil(f.t2_celular) || notNil(f.rnd2_llamada_celular));

  // Extraer todas las claves de clientes dinámicos presentes en el vector recortado
  const clientKeysSet = new Set();
  vectorEstado.forEach(fila => {
    if (fila.clientes) {
      Object.keys(fila.clientes).forEach(k => clientKeysSet.add(k));
    }
  });

  const sortedClientKeys = Array.from(clientKeysSet).sort((a, b) => {
    const numA = parseInt(a.replace('Cliente ', ''));
    const numB = parseInt(b.replace('Cliente ', ''));
    return numA - numB;
  });

  const visibleRows = vectorEstado.filter(row => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      row.i.toString().includes(term) ||
      row.evento.toLowerCase().includes(term) ||
      (row.va_a_corta && row.va_a_corta.toLowerCase().includes(term))
    );
  });

  const getEventBadgeClass = (evento) => {
    if (evento === 'Inicialización' || evento === 'Inicio de simulación') return 'badge-event init';
    if (evento === 'Llegada Cliente') return 'badge-event arrival';
    if (evento === 'Fin Caminata') return 'badge-event walk';
    if (evento === 'Fin Atención Empleado') return 'badge-event employee';
    if (evento === 'Fin Llamada Corta') return 'badge-event corta';
    if (evento === 'Fin Llamada Celular') return 'badge-event celular';
    return 'badge-event sim-end';
  };

  const getClientStateClass = (estado) => {
    if (!estado) return '';
    if (estado === 'Caminando') return 'client-state walking';
    if (estado.includes('Esperando')) return 'client-state waiting';
    if (estado.includes('Atención') || estado.includes('Hablando')) return 'client-state active';
    if (estado === 'Salio') return 'client-state finished';
    return 'client-state';
  };

  return (
    <div className="card table-card">
      <div className="table-header-bar">
        <div className="table-title">
          <Table size={20} className="text-primary" />
          <h2>Vector de Estado ({visibleRows.length} filas renderizadas)</h2>
        </div>

        <div className="table-actions">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Filtrar por evento o iteración..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="state-vector-table">
          <thead>
            {/* Fila 1: Grupos de Columnas */}
            <tr className="header-category">
              <th colSpan={3} className="cat-general">General</th>
              <th colSpan={tieneNormalLlegadas ? 5 : 3} className="cat-llegada">Llegada Cliente</th>
              <th colSpan={tieneNormalCaminata ? 5 : 3} className="cat-caminata">Caminata Pasillo</th>
              <th colSpan={tieneNormalAtencion ? 7 : 5} className="cat-empleado">Mostrador Empleado</th>
              <th colSpan={2} className="cat-decision">Decisión</th>
              <th colSpan={tieneNormalCorta ? 7 : 5} className="cat-corta">Cabina Corta Distancia</th>
              <th colSpan={tieneNormalCelular ? 7 : 5} className="cat-celular">Cabina Celulares</th>
              <th colSpan={4} className="cat-metricas">Acumuladores</th>
              {sortedClientKeys.length > 0 && (
                <th colSpan={sortedClientKeys.length * 2} className="cat-clientes">
                  Objetos Dinámicos (Clientes Activos)
                </th>
              )}
            </tr>

            {/* Fila 2: Nombres de Columnas */}
            <tr className="header-details">
              <th>i</th>
              <th>Evento</th>
              <th>Reloj (min)</th>

              {/* Llegada */}
              <th>RND 1</th>
              {tieneNormalLlegadas && <th>RND 2</th>}
              <th>{tieneNormalLlegadas ? 'T1 (Entre)' : 'Tiempo Entre'}</th>
              <th>Próx Llegada</th>
              {tieneNormalLlegadas && <th>T2 (Guardado)</th>}

              {/* Caminata */}
              <th>RND 1</th>
              {tieneNormalCaminata && <th>RND 2</th>}
              <th>{tieneNormalCaminata ? 'T1 (Caminata)' : 'Tiempo Caminata'}</th>
              <th>Fin Caminata</th>
              {tieneNormalCaminata && <th>T2 (Guardado)</th>}

              {/* Empleado */}
              <th>Estado</th>
              <th>RND 1</th>
              {tieneNormalAtencion && <th>RND 2</th>}
              <th>{tieneNormalAtencion ? 'T1 (Atención)' : 'Tiempo Atención'}</th>
              <th>Fin Atención</th>
              {tieneNormalAtencion && <th>T2 (Guardado)</th>}
              <th>Cola Empleado</th>

              {/* Decisión */}
              <th>RND Destino</th>
              <th>¿A Corta?</th>

              {/* Corta */}
              <th>Estado</th>
              <th>RND 1</th>
              {tieneNormalCorta && <th>RND 2</th>}
              <th>{tieneNormalCorta ? 'T1 (Llamada)' : 'Tiempo Llamada'}</th>
              <th>Fin Llamada</th>
              {tieneNormalCorta && <th>T2 (Guardado)</th>}
              <th>Cola Corta</th>

              {/* Celular */}
              <th>Estado</th>
              <th>RND 1</th>
              {tieneNormalCelular && <th>RND 2</th>}
              <th>{tieneNormalCelular ? 'T1 (Llamada)' : 'Tiempo Llamada'}</th>
              <th>Fin Llamada</th>
              {tieneNormalCelular && <th>T2 (Guardado)</th>}
              <th>Cola Celular</th>

              {/* Acumuladores */}
              <th>En Sistema</th>
              <th>Max Cola Emp</th>
              <th>Acum Sistema</th>
              <th>Acum Espera</th>

              {/* Clientes */}
              {sortedClientKeys.map(cKey => (
                <React.Fragment key={cKey}>
                  <th>{cKey} Estado</th>
                  <th>{cKey} Llegada</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((f) => (
              <tr key={f.i} className={f.i === vectorEstado[vectorEstado.length - 1].i ? 'last-row' : ''}>
                <td className="font-mono text-center">{f.i}</td>
                <td>
                  <span className={getEventBadgeClass(f.evento)}>
                    {f.evento}
                  </span>
                </td>
                <td className="font-mono text-right highlight-clock">{f.reloj}</td>

                {/* Llegada */}
                <td className="font-mono text-right text-muted">{f.rnd_llegada ?? '-'}</td>
                {tieneNormalLlegadas && <td className="font-mono text-right text-muted">{f.rnd2_llegada ?? '-'}</td>}
                <td className="font-mono text-right">{f.tiempo_llegada ?? '-'}</td>
                <td className="font-mono text-right">{f.proxima_llegada ?? '-'}</td>
                {tieneNormalLlegadas && (
                  <td className="font-mono text-right text-amber font-bold">{f.t2_llegada ?? '-'}</td>
                )}

                {/* Caminata */}
                <td className="font-mono text-right text-muted">{f.rnd_caminata ?? '-'}</td>
                {tieneNormalCaminata && <td className="font-mono text-right text-muted">{f.rnd2_caminata ?? '-'}</td>}
                <td className="font-mono text-right">{f.tiempo_caminata ?? '-'}</td>
                <td className="font-mono text-right">{f.fin_caminata ?? '-'}</td>
                {tieneNormalCaminata && (
                  <td className="font-mono text-right text-amber font-bold">{f.t2_caminata ?? '-'}</td>
                )}

                {/* Empleado */}
                <td className="text-center">
                  <span className={`status-pill ${f.estado_empleado === 'Ocupado' ? 'busy' : 'free'}`}>
                    {f.estado_empleado}
                  </span>
                </td>
                <td className="font-mono text-right text-muted">{f.rnd_atencion_empleado ?? '-'}</td>
                {tieneNormalAtencion && <td className="font-mono text-right text-muted">{f.rnd2_atencion_empleado ?? '-'}</td>}
                <td className="font-mono text-right">{f.tiempo_atencion_empleado ?? '-'}</td>
                <td className="font-mono text-right">{f.proximo_fin_atencion_empleado ?? '-'}</td>
                {tieneNormalAtencion && (
                  <td className="font-mono text-right text-amber font-bold">{f.t2_atencion ?? '-'}</td>
                )}
                <td className="font-mono text-center font-bold">{f.cola_empleado}</td>

                {/* Decisión */}
                <td className="font-mono text-right text-muted">{f.rnd_destino ?? '-'}</td>
                <td className="text-center font-bold">{f.va_a_corta ?? '-'}</td>

                {/* Corta */}
                <td className="text-center">
                  <span className={`status-pill ${f.estado_cabina_corta === 'Ocupado' ? 'busy' : 'free'}`}>
                    {f.estado_cabina_corta}
                  </span>
                </td>
                <td className="font-mono text-right text-muted">{f.rnd_llamada_corta ?? '-'}</td>
                {tieneNormalCorta && <td className="font-mono text-right text-muted">{f.rnd2_llamada_corta ?? '-'}</td>}
                <td className="font-mono text-right">{f.tiempo_llamada_corta ?? '-'}</td>
                <td className="font-mono text-right">{f.proximo_fin_llamada_corta ?? '-'}</td>
                {tieneNormalCorta && (
                  <td className="font-mono text-right text-amber font-bold">{f.t2_corta ?? '-'}</td>
                )}
                <td className="font-mono text-center font-bold">{f.cola_cabina_corta}</td>

                {/* Celular */}
                <td className="text-center">
                  <span className={`status-pill ${f.estado_cabina_celular === 'Ocupado' ? 'busy' : 'free'}`}>
                    {f.estado_cabina_celular}
                  </span>
                </td>
                <td className="font-mono text-right text-muted">{f.rnd_llamada_celular ?? '-'}</td>
                {tieneNormalCelular && <td className="font-mono text-right text-muted">{f.rnd2_llamada_celular ?? '-'}</td>}
                <td className="font-mono text-right">{f.tiempo_llamada_celular ?? '-'}</td>
                <td className="font-mono text-right">{f.proximo_fin_llamada_celular ?? '-'}</td>
                {tieneNormalCelular && (
                  <td className="font-mono text-right text-amber font-bold">{f.t2_celular ?? '-'}</td>
                )}
                <td className="font-mono text-center font-bold">{f.cola_cabina_celular}</td>

                {/* Acumuladores */}
                <td className="font-mono text-center font-bold text-primary">{f.clientes_en_sistema}</td>
                <td className="font-mono text-center font-bold">{f.max_cola_empleado}</td>
                <td className="font-mono text-right">{f.acum_tiempo_sistema}</td>
                <td className="font-mono text-right">{f.acum_espera_cola_empleado}</td>

                {/* Clientes Dinámicos */}
                {sortedClientKeys.map(cKey => {
                  const client = f.clientes ? f.clientes[cKey] : null;
                  return (
                    <React.Fragment key={cKey}>
                      <td className="text-center">
                        {client ? (
                          <span className={getClientStateClass(client.estado)}>
                            {client.estado}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="font-mono text-right text-muted">
                        {client ? client.llegada_sistema : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
