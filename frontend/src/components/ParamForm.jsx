import React, { useState } from 'react';
import { Sliders, Clock, Users, Phone, Footprints, Lock, Unlock } from 'lucide-react';

export const ParamForm = ({ params, setParams, onSimular, loading }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [permitirEdicion, setPermitirEdicion] = useState(false);

  const handleDistTypeChange = (category, tipo) => {
    setParams(prev => {
      const currentCat = prev[category] || {};
      let updatedCat = { ...currentCat, tipo };
      
      if (tipo === 'uniforme') {
        if (updatedCat.a === undefined) updatedCat.a = 5.0;
        if (updatedCat.b === undefined) updatedCat.b = 15.0;
      } else if (tipo === 'exponencial') {
        if (updatedCat.media === undefined) updatedCat.media = 10.0;
      } else if (tipo === 'normal') {
        if (updatedCat.media === undefined) updatedCat.media = 10.0;
        if (updatedCat.desviacion === undefined) updatedCat.desviacion = 2.0;
      }
      const newParams = { ...prev, [category]: updatedCat };
      if (onSimular) onSimular(newParams);
      return newParams;
    });
  };

  const handleChange = (category, field, value) => {
    const numVal = value === '' ? '' : parseFloat(value);
    setParams(prev => {
      let newParams;
      if (category) {
        newParams = {
          ...prev,
          [category]: {
            ...prev[category],
            [field]: numVal
          }
        };
      } else {
        newParams = {
          ...prev,
          [field]: numVal
        };
      }
      return newParams;
    });
  };

  const renderDistributionInputs = (categoryKey, titleDefault) => {
    const config = params[categoryKey] || { tipo: 'uniforme', a: 0, b: 0 };
    const disabled = !permitirEdicion;

    return (
      <div className="param-subgroup">
        <div className="subgroup-header">
          <span className="subgroup-title">{titleDefault}</span>
          <select 
            className="dist-select"
            value={config.tipo || 'uniforme'} 
            onChange={(e) => handleDistTypeChange(categoryKey, e.target.value)}
            disabled={disabled}
          >
            <option value="uniforme">Uniforme (A, B)</option>
            <option value="exponencial">Exponencial (μ)</option>
            <option value="normal">Normal (μ, σ)</option>
          </select>
        </div>

        {config.tipo === 'exponencial' ? (
          <div className="form-group">
            <label>Media (μ) en min:</label>
            <input 
              type="number" 
              step="0.1"
              value={config.media ?? 10}
              disabled={disabled}
              onChange={(e) => handleChange(categoryKey, 'media', e.target.value)}
            />
          </div>
        ) : config.tipo === 'normal' ? (
          <div className="form-row-2">
            <div className="form-group">
              <label>Media (μ):</label>
              <input 
                type="number" 
                step="0.1"
                value={config.media ?? 10}
                disabled={disabled}
                onChange={(e) => handleChange(categoryKey, 'media', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Desviación (σ):</label>
              <input 
                type="number" 
                step="0.1"
                value={config.desviacion ?? 2}
                disabled={disabled}
                onChange={(e) => handleChange(categoryKey, 'desviacion', e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="form-row-2">
            <div className="form-group">
              <label>Mín (A):</label>
              <input 
                type="number" 
                step="0.1"
                value={config.a ?? 0}
                disabled={disabled}
                onChange={(e) => handleChange(categoryKey, 'a', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Máx (B):</label>
              <input 
                type="number" 
                step="0.1"
                value={config.b ?? 0}
                disabled={disabled}
                onChange={(e) => handleChange(categoryKey, 'b', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card param-card">
      <div className="card-header">
        <div className="card-title">
          <Sliders size={20} className="text-primary" />
          <h2>Parámetros de Simulación</h2>
        </div>

        <div className="header-controls-right">
          <label className="edit-toggle-label">
            <input 
              type="checkbox"
              className="edit-toggle-checkbox"
              checked={permitirEdicion}
              onChange={(e) => setPermitirEdicion(e.target.checked)}
            />
            {permitirEdicion ? <Unlock size={14} /> : <Lock size={14} />}
            <span>Personalizar Parámetros</span>
          </label>

          {!permitirEdicion && (
            <span className="preset-badge">
              Valores por Defecto (Enunciado)
            </span>
          )}

          <button type="button" className="btn-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? 'Expandir' : 'Contraer'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <form onSubmit={(e) => { e.preventDefault(); if (onSimular) onSimular(params); }} className="param-form-grid">
          
          {/* SECCIÓN 1: TIEMPOS Y VISUALIZACIÓN */}
          <div className="param-section">
            <div className="section-header">
              <Clock size={16} />
              <h3>Tiempos y Recorte de Vector</h3>
            </div>
            
            <div className="form-group">
              <label>Tiempo Simulación (min):</label>
              <input 
                type="number" 
                min="1" 
                step="1"
                disabled={!permitirEdicion}
                value={params.tiempo_simulacion}
                onChange={(e) => handleChange(null, 'tiempo_simulacion', e.target.value)}
              />
              <span className="help-text">8 hs = 480 min</span>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Mostrar desde fila (j):</label>
                <input 
                  type="number" 
                  min="0" 
                  disabled={!permitirEdicion}
                  value={params.mostrar_desde_j}
                  onChange={(e) => handleChange(null, 'mostrar_desde_j', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Cantidad de filas (i):</label>
                <input 
                  type="number" 
                  min="1" 
                  disabled={!permitirEdicion}
                  value={params.cantidad_filas_i}
                  onChange={(e) => handleChange(null, 'cantidad_filas_i', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: LLEGADAS Y CAMINATA */}
          <div className="param-section">
            <div className="section-header">
              <Footprints size={16} />
              <h3>Llegadas y Caminata</h3>
            </div>

            {renderDistributionInputs('llegadas', 'Llegadas Clientes (10 ± 5 min)')}
            {renderDistributionInputs('caminata', 'Caminata Pasillo (3 ± 1 min)')}
          </div>

          {/* SECCIÓN 3: ATENCIÓN EN MOSTRADOR */}
          <div className="param-section">
            <div className="section-header">
              <Users size={16} />
              <h3>Atención Empleado Mostrador</h3>
            </div>

            {renderDistributionInputs('atencion_empleado', 'Pedir Llamada (4 ± 2 min)')}

            <div className="form-group">
              <label>Probabilidad Cabina Corta:</label>
              <input 
                type="number" 
                step="0.05"
                min="0"
                max="1"
                disabled={!permitirEdicion}
                value={params.probabilidad_corta}
                onChange={(e) => handleChange(null, 'probabilidad_corta', e.target.value)}
              />
              <span className="help-text">60% = 0.60 | Resto Celulares = {(1 - (params.probabilidad_corta || 0)).toFixed(2)}</span>
            </div>
          </div>

          {/* SECCIÓN 4: CABINAS DE LLAMADAS */}
          <div className="param-section">
            <div className="section-header">
              <Phone size={16} />
              <h3>Cabinas de Llamadas</h3>
            </div>

            {renderDistributionInputs('llamada_corta', 'Cabina Corta (15 ± 5 min)')}
            {renderDistributionInputs('llamada_celular', 'Cabina Celulares (7 ± 3 min)')}
          </div>

        </form>
      )}
    </div>
  );
};
