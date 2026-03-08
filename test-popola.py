# ==============================================================================
#  PROJECT GESTALT - CLASSIFIED ARCHIVE
#  UNIT: POPOLA (Data Extraction and Purification Android)
#  VERSION: 0.1.0-alpha (Initial Awakening)
#  
#  DESCRIPTION: 
#  Este script actúa como el procesador cognitivo principal (Agente IA). 
#  Su directiva es ingerir datos externos contaminados (noticias con sesgo), 
#  ejecutar el protocolo de aislamiento lógico y extraer hechos objetivos puros.
#  Los datos resultantes serán enviados a Devola para su almacenamiento en 
#  La Biblioteca.
# 
#  SECURITY CLEARANCE: LEVEL S (Confidential)
#  WARNING: Nunca exponer la GENAI_API_KEY a la red pública (GitHub).
#  GLORY TO MANKIND.
# ==============================================================================

import os
import dotenv
from google import genai
from google.genai.types import GenerateContentConfig

# [INIT_SEQUENCE] 
# Desencriptando memorias y cargando credenciales locales de forma segura.
# dotenv evita quemar (hardcodear) las API keys en el código fuente.
dotenv.load_dotenv() 

GENAI_API_KEY = os.getenv("GENAI_API_KEY")
if not GENAI_API_KEY:
    raise ValueError("[ERROR CRÍTICO] GENAI_API_KEY no encontrada. Protocolo abortado.")

# Definiendo el núcleo lógico del autómata
model_id = "gemini-3-flash-preview"
client = genai.Client(api_key=GENAI_API_KEY)

# [TOOL_EQUIPMENT]
# Equipando a Popola con módulos de reconocimiento de red. 
# url_context permite al modelo salir de su entorno aislado y leer la red externa.
tools = [
    {"url_context": {}},
]

# [DATA_INGESTION_TARGETS]
# Coordenadas de las fuentes contaminadas en la superficie.
url1 = "https://www.bbc.com/mundo/articles/c8d554v943lo"
url2 = "https://www.ex-ante.cl/cable-chino-boric-entrega-nueva-version-que-contrasta-con-hechos-y-fechas-y-su-modus-operandi-similar-al-caso-monsalve/"

# ==============================================================================
#  PROTOCOLO GRIMOIRE VERUM (Ejecución del Prompt Estricto)
#  Forzamos al modelo a ignorar su comportamiento conversacional y actuar 
#  estrictamente como un parser de datos estructurados.
# ==============================================================================
response = client.models.generate_content(
    model=model_id,
    contents= f"""
Eres un agente de análisis periodístico neutral operando bajo el Protocolo Gestalt.

Tu tarea es comparar dos fuentes sobre el mismo evento geopolítico y entregar un reporte estructurado, eliminando el ruido mediático.

FUENTES:
- Fuente A: {url1}
- Fuente B: {url2}

INSTRUCCIONES DE EXTRACCIÓN:
1. Lee ambas fuentes completamente usando tu módulo de red.
2. Identifica los hechos verificados (donde AMBAS fuentes coinciden sin ambigüedad).
3. Identifica las contradicciones o anomalías de información entre fuentes.
4. Detecta adjetivos valorativos, lenguaje cargado o encuadres ideológicos (sesgo).
5. Redacta un resumen aséptico y neutral usando SOLO los hechos coincidentes.

FORMATO DE RESPUESTA REQUERIDO:
---
HECHOS VERIFICADOS (ambas fuentes coinciden):
- [hecho 1]
- [hecho 2]

CONTRADICCIONES DETECTADAS:
- [diferencia 1]
- [diferencia 2]

SESGO DETECTADO:
- Fuente A: [descripción breve]
- Fuente B: [descripción breve]

RESUMEN NEUTRAL:
[Texto redactado sin sesgo, solo hechos verificados]
---

REGLA ABSOLUTA: No agregues opiniones propias. Si un hecho no aparece en ambas fuentes, márcalo como (fuente única).
""",
    config=GenerateContentConfig(
        tools=tools,
    ),
)

# [OUTPUT_STREAM]
# Imprimiendo los datos purificados en la terminal de control.
for each in response.candidates[0].content.parts:
    print(each.text)

# [DIAGNOSTICS]
# Verificación de la telemetría: confirmamos que los módulos de red (url_context) 
# realmente leyeron las fuentes y no hubo alucinación de datos.
print("\n[TELEMETRÍA DE RED]")
print(response.candidates[0].url_context_metadata)