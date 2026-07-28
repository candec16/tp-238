import React from 'react';
import { PhoneCall, Play, Download, RefreshCw, BarChart2 } from 'lucide-react';

export const Header = ({ onSimular, onExportar, loading, hasData }) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="icon-badge">
          <PhoneCall size={26} />
        </div>
        <div>
          <h1>Simulación Central Telefónica</h1>
          <p className="subtitle">Simulación de Eventos Discretos (Teoría de Colas y Servicios)</p>
        </div>
      </div>

      <div className="header-actions">
        <button 
          className="btn btn-primary" 
          onClick={onSimular} 
          disabled={loading}
        >
          {loading ? (
            <>
              <RefreshCw className="spin" size={18} />
              <span>Simulando...</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>Ejecutar Simulación</span>
            </>
          )}
        </button>

        {hasData && (
          <button 
            className="btn btn-excel" 
            onClick={onExportar}
          >
            <Download size={18} />
            <span>Exportar a Excel (.xlsx)</span>
          </button>
        )}
      </div>
    </header>
  );
};
