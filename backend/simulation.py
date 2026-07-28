import random
import math
from typing import Dict, Any, List, Optional
from schemas import SimulacionRequest, SimulacionResponse, MetricasResponse, EvolucionMinuto, DistribucionConfig

class Cliente:
    def __init__(self, cliente_id: int, hora_llegada: float):
        self.id = cliente_id
        self.estado = "Caminando"
        self.llegada_sistema = hora_llegada
        self.fin_caminata: Optional[float] = None
        self.inicio_espera_empleado: Optional[float] = None
        self.fin_espera_empleado: Optional[float] = None
        self.salida_sistema: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "estado": self.estado,
            "llegada_sistema": round(self.llegada_sistema, 2) if self.llegada_sistema is not None else None,
            "fin_caminata": round(self.fin_caminata, 2) if self.fin_caminata is not None else None,
            "inicio_espera_empleado": round(self.inicio_espera_empleado, 2) if self.inicio_espera_empleado is not None else None,
            "fin_espera_empleado": round(self.fin_espera_empleado, 2) if self.fin_espera_empleado is not None else None,
            "salida_sistema": round(self.salida_sistema, 2) if self.salida_sistema is not None else None,
        }

class GeneradorProceso:
    """
    Gestor estocástico para cada proceso con soporte de Box-Muller (Normal RND1, RND2, T1 y T2 guardado/arrastrado).
    """
    def __init__(self, config: DistribucionConfig):
        self.config = config
        self.t2_guardado: Optional[float] = None

    def obtener_tiempo(self) -> tuple[Optional[float], Optional[float], float, Optional[float]]:
        """
        Retorna: (rnd1, rnd2, t1_usado, t2_para_vector)
        - Si es Normal y hay T2 guardado: usa T1 = T2, rnd1=None, rnd2=None, t2_para_vector=None (limpia T2 guardado).
        - Si es Normal y NO hay T2 guardado: genera RND1 y RND2, calcula N1 (T1) y N2 (T2), almacena T2 y retorna (RND1, RND2, T1, T2).
        - Si es Uniforme o Exponencial: genera RND1, RND2=None, calcula T1, T2=None.
        """
        tipo = (self.config.tipo or "uniforme").lower()

        if tipo == "normal":
            if self.t2_guardado is not None:
                # Consumo de T2 previamente guardado
                t1_usado = self.t2_guardado
                self.t2_guardado = None
                return None, None, t1_usado, None
            else:
                # Generación de par Box-Muller (T1 y T2)
                media = self.config.media if self.config.media is not None else 10.0
                desviacion = self.config.desviacion if self.config.desviacion is not None else 2.0
                
                r1 = random.random()
                r2 = random.random()
                
                factor = math.sqrt(-2.0 * math.log(max(1e-9, r1)))
                z0 = factor * math.cos(2.0 * math.pi * r2)
                z1 = factor * math.sin(2.0 * math.pi * r2)
                
                t1 = max(0.01, media + desviacion * z0)
                t2 = max(0.01, media + desviacion * z1)
                
                self.t2_guardado = t2
                return r1, r2, t1, t2

        elif tipo == "exponencial":
            media = self.config.media if (self.config.media is not None and self.config.media > 0) else 10.0
            r1 = random.random()
            val = -media * math.log(max(1e-9, 1.0 - r1))
            return r1, None, max(0.01, val), None

        else:  # Uniforme por defecto
            a = self.config.a if self.config.a is not None else 5.0
            b = self.config.b if self.config.b is not None else 15.0
            r1 = random.random()
            val = a + r1 * (b - a)
            return r1, None, max(0.01, val), None


def ejecutar_simulacion(params: SimulacionRequest) -> SimulacionResponse:
    reloj = 0.0
    tiempo_limite = params.tiempo_simulacion

    # Instanciar generadores para cada proceso
    gen_llegadas = GeneradorProceso(params.llegadas)
    gen_caminata = GeneradorProceso(params.caminata)
    gen_atencion = GeneradorProceso(params.atencion_empleado)
    gen_corta = GeneradorProceso(params.llamada_corta)
    gen_celular = GeneradorProceso(params.llamada_celular)

    # Clientes
    clientes_dict: Dict[int, Cliente] = {}
    cliente_count = 0

    # Estado de Servidores y Colas
    estado_empleado = "Libre"
    cliente_en_empleado: Optional[Cliente] = None
    cola_empleado: List[Cliente] = []

    estado_corta = "Libre"
    cliente_en_corta: Optional[Cliente] = None
    cola_corta: List[Cliente] = []

    estado_celular = "Libre"
    cliente_en_celular: Optional[Cliente] = None
    cola_celular: List[Cliente] = []

    # Próximos eventos iniciales
    rnd_lleg, rnd2_lleg, t_entre_lleg, t2_lleg_gen = gen_llegadas.obtener_tiempo()
    proxima_llegada = reloj + t_entre_lleg

    proximo_fin_atencion_empleado: Optional[float] = None
    rnd_atencion_emp: Optional[float] = None
    rnd2_atencion_emp: Optional[float] = None
    t_atencion_emp: Optional[float] = None
    t2_atencion_gen: Optional[float] = None

    proximo_fin_corta: Optional[float] = None
    rnd_corta: Optional[float] = None
    rnd2_corta: Optional[float] = None
    t_corta: Optional[float] = None
    t2_corta_gen: Optional[float] = None

    proximo_fin_celular: Optional[float] = None
    rnd_celular: Optional[float] = None
    rnd2_celular: Optional[float] = None
    t_celular: Optional[float] = None
    t2_celular_gen: Optional[float] = None

    rnd_destino: Optional[float] = None
    va_a_corta_str: Optional[str] = None

    rnd_cam_actual: Optional[float] = None
    rnd2_cam_actual: Optional[float] = None
    t_cam_actual: Optional[float] = None
    fin_cam_actual: Optional[float] = None
    t2_cam_gen: Optional[float] = None

    # Acumuladores
    max_cola_empleado = 0
    acum_espera_cola_empleado = 0.0
    total_clientes_atendidos_empleado = 0
    acum_tiempo_sistema = 0.0
    total_clientes_completados = 0

    vector_estado_filas: List[Dict[str, Any]] = []
    
    iteracion = 0
    j_start = params.mostrar_desde_j
    j_end = params.mostrar_desde_j + params.cantidad_filas_i - 1

    def construir_fila_estado(nombre_evento: str) -> Dict[str, Any]:
        clientes_en_sistema_cnt = sum(1 for c in clientes_dict.values() if c.estado != "Salio")
        
        dynamic_clients = {}
        for cid, c in clientes_dict.items():
            if c.estado != "Salio" or (c.salida_sistema is not None and abs(c.salida_sistema - reloj) < 0.001):
                dynamic_clients[f"Cliente {cid}"] = c.to_dict()

        return {
            "i": iteracion,
            "evento": nombre_evento,
            "reloj": round(reloj, 2),
            
            # Llegada
            "rnd_llegada": round(rnd_lleg, 4) if rnd_lleg is not None else None,
            "rnd2_llegada": round(rnd2_lleg, 4) if rnd2_lleg is not None else None,
            "tiempo_llegada": round(t_entre_lleg, 2) if t_entre_lleg is not None else None,
            "proxima_llegada": round(proxima_llegada, 2) if proxima_llegada is not None else None,
            "t2_llegada": round(t2_lleg_gen, 2) if t2_lleg_gen is not None else (round(gen_llegadas.t2_guardado, 2) if gen_llegadas.t2_guardado is not None else None),
            
            # Caminata
            "rnd_caminata": round(rnd_cam_actual, 4) if rnd_cam_actual is not None else None,
            "rnd2_caminata": round(rnd2_cam_actual, 4) if rnd2_cam_actual is not None else None,
            "tiempo_caminata": round(t_cam_actual, 2) if t_cam_actual is not None else None,
            "fin_caminata": round(fin_cam_actual, 2) if fin_cam_actual is not None else None,
            "t2_caminata": round(t2_cam_gen, 2) if t2_cam_gen is not None else (round(gen_caminata.t2_guardado, 2) if gen_caminata.t2_guardado is not None else None),
            
            # Empleado
            "estado_empleado": estado_empleado,
            "rnd_atencion_empleado": round(rnd_atencion_emp, 4) if rnd_atencion_emp is not None else None,
            "rnd2_atencion_empleado": round(rnd2_atencion_emp, 4) if rnd2_atencion_emp is not None else None,
            "tiempo_atencion_empleado": round(t_atencion_emp, 2) if t_atencion_emp is not None else None,
            "proximo_fin_atencion_empleado": round(proximo_fin_atencion_empleado, 2) if proximo_fin_atencion_empleado is not None else None,
            "cola_empleado": len(cola_empleado),
            "cliente_empleado_id": cliente_en_empleado.id if cliente_en_empleado else None,
            "t2_atencion": round(t2_atencion_gen, 2) if t2_atencion_gen is not None else (round(gen_atencion.t2_guardado, 2) if gen_atencion.t2_guardado is not None else None),
            
            # Decisión Cabina
            "rnd_destino": round(rnd_destino, 4) if rnd_destino is not None else None,
            "va_a_corta": va_a_corta_str,
            
            # Cabina Corta
            "estado_cabina_corta": estado_corta,
            "rnd_llamada_corta": round(rnd_corta, 4) if rnd_corta is not None else None,
            "rnd2_llamada_corta": round(rnd2_corta, 4) if rnd2_corta is not None else None,
            "tiempo_llamada_corta": round(t_corta, 2) if t_corta is not None else None,
            "proximo_fin_llamada_corta": round(proximo_fin_corta, 2) if proximo_fin_corta is not None else None,
            "cola_cabina_corta": len(cola_corta),
            "cliente_corta_id": cliente_en_corta.id if cliente_en_corta else None,
            "t2_corta": round(t2_corta_gen, 2) if t2_corta_gen is not None else (round(gen_corta.t2_guardado, 2) if gen_corta.t2_guardado is not None else None),
            
            # Cabina Celulares
            "estado_cabina_celular": estado_celular,
            "rnd_llamada_celular": round(rnd_celular, 4) if rnd_celular is not None else None,
            "rnd2_llamada_celular": round(rnd2_celular, 4) if rnd2_celular is not None else None,
            "tiempo_llamada_celular": round(t_celular, 2) if t_celular is not None else None,
            "proximo_fin_llamada_celular": round(proximo_fin_celular, 2) if proximo_fin_celular is not None else None,
            "cola_cabina_celular": len(cola_celular),
            "cliente_celular_id": cliente_en_celular.id if cliente_en_celular else None,
            "t2_celular": round(t2_celular_gen, 2) if t2_celular_gen is not None else (round(gen_celular.t2_guardado, 2) if gen_celular.t2_guardado is not None else None),
            
            # Acumuladores
            "clientes_en_sistema": clientes_en_sistema_cnt,
            "max_cola_empleado": max_cola_empleado,
            "acum_tiempo_sistema": round(acum_tiempo_sistema, 2),
            "acum_espera_cola_empleado": round(acum_espera_cola_empleado, 2),
            "total_clientes_completados": total_clientes_completados,
            
            "clientes": dynamic_clients
        }

    # Fila inicial 0: Inicio de simulación
    iteracion = 0
    fila_inicial = construir_fila_estado("Inicio de simulación")
    if j_start <= 0 <= j_end:
        vector_estado_filas.append(fila_inicial)

    ultima_fila = fila_inicial

    while reloj < tiempo_limite:
        iteracion += 1
        
        # Limpiar RNDs y T2 temporales generados en esta iteración específica
        rnd_lleg = None; rnd2_lleg = None; t_entre_lleg = None; t2_lleg_gen = None
        rnd_cam_actual = None; rnd2_cam_actual = None; t_cam_actual = None; fin_cam_actual = None; t2_cam_gen = None
        rnd_atencion_emp = None; rnd2_atencion_emp = None; t_atencion_emp = None; t2_atencion_gen = None
        rnd_destino = None; va_a_corta_str = None
        rnd_corta = None; rnd2_corta = None; t_corta = None; t2_corta_gen = None
        rnd_celular = None; rnd2_celular = None; t_celular = None; t2_celular_gen = None

        cand_llegada = proxima_llegada if proxima_llegada is not None else float('inf')
        
        caminando_clientes = [c for c in clientes_dict.values() if c.estado == "Caminando" and c.fin_caminata is not None]
        cand_caminata = min((c.fin_caminata for c in caminando_clientes), default=float('inf'))

        cand_atencion_emp = proximo_fin_atencion_empleado if proximo_fin_atencion_empleado is not None else float('inf')
        cand_corta = proximo_fin_corta if proximo_fin_corta is not None else float('inf')
        cand_celular = proximo_fin_celular if proximo_fin_celular is not None else float('inf')

        siguiente_reloj = min(cand_llegada, cand_caminata, cand_atencion_emp, cand_corta, cand_celular, tiempo_limite)

        if siguiente_reloj >= tiempo_limite:
            reloj = tiempo_limite
            nombre_evento = "Fin Simulación"
            ultima_fila = construir_fila_estado(nombre_evento)
            if j_start <= iteracion <= j_end:
                vector_estado_filas.append(ultima_fila)
            break

        reloj = siguiente_reloj

        if abs(reloj - cand_llegada) < 1e-7:
            nombre_evento = "Llegada Cliente"
            cliente_count += 1
            nuevo_cliente = Cliente(cliente_count, reloj)
            clientes_dict[cliente_count] = nuevo_cliente
            
            rnd_cam_actual, rnd2_cam_actual, t_cam_actual, t2_cam_gen = gen_caminata.obtener_tiempo()
            fin_cam_actual = reloj + t_cam_actual
            nuevo_cliente.fin_caminata = fin_cam_actual
            
            rnd_lleg, rnd2_lleg, t_entre_lleg, t2_lleg_gen = gen_llegadas.obtener_tiempo()
            proxima_llegada = reloj + t_entre_lleg

        elif abs(reloj - cand_caminata) < 1e-7:
            nombre_evento = "Fin Caminata"
            cliente_llegando = next(c for c in caminando_clientes if c.fin_caminata is not None and abs(c.fin_caminata - reloj) < 1e-7)
            cliente_llegando.inicio_espera_empleado = reloj
            
            if estado_empleado == "Libre":
                estado_empleado = "Ocupado"
                cliente_en_empleado = cliente_llegando
                cliente_llegando.estado = "En Atención Empleado"
                cliente_llegando.fin_espera_empleado = reloj
                total_clientes_atendidos_empleado += 1
                
                rnd_atencion_emp, rnd2_atencion_emp, t_atencion_emp, t2_atencion_gen = gen_atencion.obtener_tiempo()
                proximo_fin_atencion_empleado = reloj + t_atencion_emp
            else:
                cliente_llegando.estado = "Esperando Empleado"
                cola_empleado.append(cliente_llegando)
                if len(cola_empleado) > max_cola_empleado:
                    max_cola_empleado = len(cola_empleado)

        elif abs(reloj - cand_atencion_emp) < 1e-7:
            nombre_evento = "Fin Atención Empleado"
            cliente_atendido = cliente_en_empleado
            
            if cola_empleado:
                siguiente_emp = cola_empleado.pop(0)
                siguiente_emp.fin_espera_empleado = reloj
                espera = reloj - siguiente_emp.inicio_espera_empleado
                acum_espera_cola_empleado += espera
                total_clientes_atendidos_empleado += 1
                
                cliente_en_empleado = siguiente_emp
                siguiente_emp.estado = "En Atención Empleado"
                rnd_atencion_emp, rnd2_atencion_emp, t_atencion_emp, t2_atencion_gen = gen_atencion.obtener_tiempo()
                proximo_fin_atencion_empleado = reloj + t_atencion_emp
            else:
                estado_empleado = "Libre"
                cliente_en_empleado = None
                proximo_fin_atencion_empleado = None
            
            rnd_destino = random.random()
            if rnd_destino < params.probabilidad_corta:
                va_a_corta_str = "Sí"
                if estado_corta == "Libre":
                    estado_corta = "Ocupado"
                    cliente_en_corta = cliente_atendido
                    cliente_atendido.estado = "Hablando Cabina Corta"
                    rnd_corta, rnd2_corta, t_corta, t2_corta_gen = gen_corta.obtener_tiempo()
                    proximo_fin_corta = reloj + t_corta
                else:
                    cliente_atendido.estado = "Esperando Cabina Corta"
                    cola_corta.append(cliente_atendido)
            else:
                va_a_corta_str = "No"
                if estado_celular == "Libre":
                    estado_celular = "Ocupado"
                    cliente_en_celular = cliente_atendido
                    cliente_atendido.estado = "Hablando Cabina Celular"
                    rnd_celular, rnd2_celular, t_celular, t2_celular_gen = gen_celular.obtener_tiempo()
                    proximo_fin_celular = reloj + t_celular
                else:
                    cliente_atendido.estado = "Esperando Cabina Celular"
                    cola_celular.append(cliente_atendido)

        elif abs(reloj - cand_corta) < 1e-7:
            nombre_evento = "Fin Llamada Corta"
            cliente_sale = cliente_en_corta
            if cliente_sale:
                cliente_sale.salida_sistema = reloj
                cliente_sale.estado = "Salio"
                acum_tiempo_sistema += (reloj - cliente_sale.llegada_sistema)
                total_clientes_completados += 1
            
            if cola_corta:
                sig_corta = cola_corta.pop(0)
                cliente_en_corta = sig_corta
                sig_corta.estado = "Hablando Cabina Corta"
                rnd_corta, rnd2_corta, t_corta, t2_corta_gen = gen_corta.obtener_tiempo()
                proximo_fin_corta = reloj + t_corta
            else:
                estado_corta = "Libre"
                cliente_en_corta = None
                proximo_fin_corta = None

        elif abs(reloj - cand_celular) < 1e-7:
            nombre_evento = "Fin Llamada Celular"
            cliente_sale = cliente_en_celular
            if cliente_sale:
                cliente_sale.salida_sistema = reloj
                cliente_sale.estado = "Salio"
                acum_tiempo_sistema += (reloj - cliente_sale.llegada_sistema)
                total_clientes_completados += 1
            
            if cola_celular:
                sig_cel = cola_celular.pop(0)
                cliente_en_celular = sig_cel
                sig_cel.estado = "Hablando Cabina Celular"
                rnd_celular, rnd2_celular, t_celular, t2_celular_gen = gen_celular.obtener_tiempo()
                proximo_fin_celular = reloj + t_celular
            else:
                estado_celular = "Libre"
                cliente_en_celular = None
                proximo_fin_celular = None

        fila_actual = construir_fila_estado(nombre_evento)
        ultima_fila = fila_actual

        if j_start <= iteracion <= j_end:
            vector_estado_filas.append(fila_actual)

    if not (j_start <= iteracion <= j_end):
        if not vector_estado_filas or vector_estado_filas[-1]["i"] != ultima_fila["i"]:
            vector_estado_filas.append(ultima_fila)

    tiempo_prom_sistema = (acum_tiempo_sistema / total_clientes_completados) if total_clientes_completados > 0 else 0.0
    tiempo_prom_espera_cola = (acum_espera_cola_empleado / total_clientes_atendidos_empleado) if total_clientes_atendidos_empleado > 0 else 0.0

    evolucion_minutos: List[EvolucionMinuto] = []
    minutos_max = int(tiempo_limite)
    
    for m in range(minutos_max + 1):
        cant = 0
        for c in clientes_dict.values():
            if c.llegada_sistema <= m:
                if c.salida_sistema is None or c.salida_sistema > m:
                    cant += 1
        evolucion_minutos.append(EvolucionMinuto(minuto=m, cantidad_clientes=cant))

    metricas = MetricasResponse(
        tiempo_promedio_sistema=round(tiempo_prom_sistema, 2),
        tiempo_promedio_espera_cola_empleado=round(tiempo_prom_espera_cola, 2),
        max_personas_cola_empleado=max_cola_empleado,
        total_clientes_ingresados=cliente_count,
        total_clientes_completados=total_clientes_completados,
        total_clientes_atendidos_empleado=total_clientes_atendidos_empleado
    )

    return SimulacionResponse(
        metricas=metricas,
        vector_estado=vector_estado_filas,
        evolucion_minutos=evolucion_minutos
    )
