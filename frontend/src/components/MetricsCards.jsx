import React from 'react';
import { Clock, Hourglass, Users, CheckCircle2 } from 'lucide-react';

export const MetricsCards = ({ metricas }) => {
  if (!metricas) return null;

  return (
    <div className="metrics-grid">
      <div className="metric-card cyan">
        <div className="metric-icon">
          <Clock size={24} />
        </div>
        <div className="metric-content">
          <span className="metric-label">Tiempo Promedio en Sistema</span>
          <div className="metric-value">
            {metricas.tiempo_promedio_sistema} <span className="metric-unit">min</span>
          </div>
          <span className="metric-desc">Duración promedio desde llegada hasta salida</span>
        </div>
      </div>

      <div className="metric-card amber">
        <div className="metric-icon">
          <Hourglass size={24} />
        </div>
        <div className="metric-content">
          <span className="metric-label">Promedio Espera Cola Empleado</span>
          <div className="metric-value">
            {metricas.tiempo_promedio_espera_cola_empleado} <span className="metric-unit">min</span>
          </div>
          <span className="metric-desc">Tiempo de espera en cola de atención</span>
        </div>
      </div>

      <div className="metric-card rose">
        <div className="metric-icon">
          <Users size={24} />
        </div>
        <div className="metric-content">
          <span className="metric-label">Máxima Cola Empleado</span>
          <div className="metric-value">
            {metricas.max_personas_cola_empleado} <span className="metric-unit">personas</span>
          </div>
          <span className="metric-desc">Pico máximo de clientes esperando</span>
        </div>
      </div>

      <div className="metric-card emerald">
        <div className="metric-icon">
          <CheckCircle2 size={24} />
        </div>
        <div className="metric-content">
          <span className="metric-label">Clientes Atendidos / Total</span>
          <div className="metric-value">
            {metricas.total_clientes_completados} <span className="metric-unit">/ {metricas.total_clientes_ingresados}</span>
          </div>
          <span className="metric-desc">Clientes que finalizaron llamada</span>
        </div>
      </div>
    </div>
  );
};
