import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export const MinutesChart = ({ evolucionMinutos }) => {
  if (!evolucionMinutos || evolucionMinutos.length === 0) return null;

  // Encontrar el pico máximo de clientes simultáneos
  const maxClientes = Math.max(...evolucionMinutos.map(d => d.cantidad_clientes));
  const promClientes = (
    evolucionMinutos.reduce((acc, curr) => acc + curr.cantidad_clientes, 0) / evolucionMinutos.length
  ).toFixed(2);

  return (
    <div className="card chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <Activity size={20} className="text-primary" />
          <h2>Evolución Minuto a Minuto de Clientes en Telefónica</h2>
        </div>
        <div className="chart-badges">
          <span className="badge badge-peak">Pico Máximo: {maxClientes} clientes</span>
          <span className="badge badge-avg">Promedio: {promClientes} clientes/min</span>
        </div>
      </div>

      <div className="chart-container" style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={evolucionMinutos} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCantidad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis 
              dataKey="minuto" 
              stroke="#94a3b8"
              tickFormatter={(val) => `m. ${val}`} 
            />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
              labelFormatter={(val) => `Minuto: ${val}`}
              formatter={(value) => [`${value} clientes`, 'Cantidad en Sistema']}
            />
            <Area 
              type="monotone" 
              dataKey="cantidad_clientes" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCantidad)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
