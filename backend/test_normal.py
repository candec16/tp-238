import sys
sys.path.append(r'd:\Facultad\2026\SIMULACION\final\tp 238\backend')
from schemas import SimulacionRequest, DistribucionConfig
from simulation import ejecutar_simulacion

req = SimulacionRequest(
    tiempo_simulacion=480.0,
    mostrar_desde_j=0,
    cantidad_filas_i=20,
    llegadas=DistribucionConfig(tipo='normal', media=10.0, desviacion=2.5)
)
res = ejecutar_simulacion(req)
for f in res.vector_estado[:12]:
    evento = f["evento"][:22]
    r1 = f["rnd_llegada"]
    r2 = f["rnd2_llegada"]
    t1 = f["tiempo_llegada"]
    t2 = f["t2_llegada"]
    print(f"i={f['i']:2d} | {evento:22s} | RND1={r1} | RND2={r2} | T1={t1} | T2_guardado={t2}")
