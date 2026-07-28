import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ParamForm } from './components/ParamForm';
import { MetricsCards } from './components/MetricsCards';
import { MinutesChart } from './components/MinutesChart';
import { StateVectorTable } from './components/StateVectorTable';
import { exportarAExcel } from './utils/excelExporter';
import { AlertCircle } from 'lucide-react';

const BACKEND_URL = "http://127.0.0.1:8000";

export default function App() {
  const [params, setParams] = useState({
    tiempo_simulacion: 480,
    mostrar_desde_j: 0, // 0-indexed por defecto para ver la fila 0 de inicio
    cantidad_filas_i: 50,
    llegadas: { tipo: 'uniforme', a: 5.0, b: 15.0, media: 10.0, desviacion: 2.5 },
    caminata: { tipo: 'uniforme', a: 2.0, b: 4.0, media: 3.0, desviacion: 0.5 },
    atencion_empleado: { tipo: 'uniforme', a: 2.0, b: 6.0, media: 4.0, desviacion: 1.0 },
    probabilidad_corta: 0.60,
    llamada_corta: { tipo: 'uniforme', a: 10.0, b: 20.0, media: 15.0, desviacion: 2.5 },
    llamada_celular: { tipo: 'uniforme', a: 4.0, b: 10.0, media: 7.0, desviacion: 1.5 }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState(null);

  const ejecutarSimulacion = async (customParams = params) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/simular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customParams)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al procesar la simulación');
      }

      const data = await response.json();
      setResultados(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo conectar con el servidor backend FastAPI. Asegúrese de que main.py esté en ejecución.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ejecutarSimulacion();
  }, []);

  const handleExportarExcel = () => {
    if (!resultados) return;
    exportarAExcel(resultados.metricas, resultados.vector_estado, resultados.evolucion_minutos);
  };

  return (
    <div className="app-layout">
      <Header 
        onSimular={() => ejecutarSimulacion(params)} 
        onExportar={handleExportarExcel} 
        loading={loading}
        hasData={!!resultados}
      />

      <main className="app-main-content">
        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <ParamForm 
          params={params} 
          setParams={setParams} 
          onSimular={(newParams) => ejecutarSimulacion(newParams || params)}
          loading={loading}
        />

        {resultados && (
          <>
            <MetricsCards metricas={resultados.metricas} />
            <MinutesChart evolucionMinutos={resultados.evolucion_minutos} />
            <StateVectorTable vectorEstado={resultados.vector_estado} params={params} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Sistema de Simulación de Telefónica • Cátedra de Simulación UTN • Desarrollado con FastAPI + React</p>
      </footer>
    </div>
  );
}
