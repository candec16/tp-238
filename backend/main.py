from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import SimulacionRequest, SimulacionResponse
from simulation import ejecutar_simulacion

app = FastAPI(
    title="API Simulación Telefónica",
    description="Backend de Simulación de Eventos Discretos para Central Telefónica",
    version="1.0.0"
)

# Permitir CORS para comunicación fluida con el frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Servidor de simulación activo y respondiendo."}

@app.post("/simular", response_model=SimulacionResponse)
def simular_endpoint(request: SimulacionRequest):
    try:
        resultado = ejecutar_simulacion(request)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en la simulación: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
