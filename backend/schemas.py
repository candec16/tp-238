from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DistribucionConfig(BaseModel):
    tipo: str = Field(default="uniforme", description="Tipo de distribución: 'uniforme', 'exponencial' o 'normal'")
    a: Optional[float] = Field(default=None, description="Valor mínimo (A) para Uniforme")
    b: Optional[float] = Field(default=None, description="Valor máximo (B) para Uniforme")
    media: Optional[float] = Field(default=None, description="Media (Exponencial o Normal)")
    desviacion: Optional[float] = Field(default=None, description="Desviación Estándar (Normal)")

class SimulacionRequest(BaseModel):
    tiempo_simulacion: float = Field(default=480.0, description="Tiempo total de simulación en minutos")
    mostrar_desde_j: int = Field(default=1, description="Fila j a mostrar en el vector de estado (1-indexed)")
    cantidad_filas_i: int = Field(default=50, description="Cantidad de filas i a mostrar en el vector de estado")
    
    # Configuraciones de Distribución para cada evento por default
    llegadas: DistribucionConfig = Field(default_factory=lambda: DistribucionConfig(tipo="uniforme", a=5.0, b=15.0))         # 10 +/- 5 min
    caminata: DistribucionConfig = Field(default_factory=lambda: DistribucionConfig(tipo="uniforme", a=2.0, b=4.0))           # 3 +/- 1 min
    atencion_empleado: DistribucionConfig = Field(default_factory=lambda: DistribucionConfig(tipo="uniforme", a=2.0, b=6.0)) # 4 +/- 2 min
    llamada_corta: DistribucionConfig = Field(default_factory=lambda: DistribucionConfig(tipo="uniforme", a=10.0, b=20.0))    # 15 +/- 5 min
    llamada_celular: DistribucionConfig = Field(default_factory=lambda: DistribucionConfig(tipo="uniforme", a=4.0, b=10.0))    # 7 +/- 3 min
    
    probabilidad_corta: float = Field(default=0.60, description="Probabilidad de llamada corta distancia")

class MetricasResponse(BaseModel):
    tiempo_promedio_sistema: float
    tiempo_promedio_espera_cola_empleado: float
    max_personas_cola_empleado: int
    total_clientes_ingresados: int
    total_clientes_completados: int
    total_clientes_atendidos_empleado: int

class EvolucionMinuto(BaseModel):
    minuto: int
    cantidad_clientes: int

class SimulacionResponse(BaseModel):
    metricas: MetricasResponse
    vector_estado: List[Dict[str, Any]]
    evolucion_minutos: List[EvolucionMinuto]
