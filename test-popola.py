# ==============================================================================
#  PROJECT GESTALT - CLASSIFIED ARCHIVE
#  UNIT: POPOLA (Data Extraction and Purification Android)
#  VERSION: 0.1.0 (pipeline in development)
#  
#  DESCRIPTION: 
#  Este script actúa como el procesador cognitivo principal (Agente IA). 
#  Su directiva es ingerir datos externos contaminados (noticias con sesgo), 
#  ejecutar el protocolo de aislamiento lógico y extraer hechos objetivos puros.
#  Los datos resultantes serán enviados a Devola para su almacenamiento en 
#  La Biblioteca.
#
#  Se usan 2 agentes IA secuenciales:
#  1. Analista: Con acceso a herramientas de lectura web y búsqueda, encargado de analizar las fuentes, identificar hechos verificables, contradicciones y sesgos.
#  2. Redactor: Sin acceso a herramientas, encargado de redactar una noticia final con citas obligatorias, basándose exclusivamente en los hechos verificados por el Analista.
# 
#  SECURITY CLEARANCE: LEVEL S (Confidential)
#  !WARNING: Nunca exponer la GENAI_API_KEY a la red pública (GitHub).
#  GLORY TO MANKIND.
# ==============================================================================

# [IMPORTS - 
# Os y Dotenv para gestión de claves
# GenAI SDK para interacción con el modelo]
import json
import os
import dotenv
from google import genai
from google.genai.types import GenerateContentConfig

# Carga de variables de entorno .env
#! Variable de entorno obligatoria: GENAI_API_KEY (clave de API para autenticación con GenAI)
#! API KEY debera ser definida personalmente por el usuario en un archivo .env local, siguiendo el formato:
#! GENAI_API_KEY=tu_clave_aqui
dotenv.load_dotenv()

# Variable de entorno para clave API
GENAI_API_KEY = os.getenv("GENAI_API_KEY")
if not GENAI_API_KEY:
    raise ValueError("[ERROR CRÍTICO] GENAI_API_KEY no encontrada. Protocolo abortado.")

#? Nota: "Gemini 2.5 Flash" Modelo recomendado para tareas de análisis y síntesis de información compleja,
model_id = "gemini-2.5-flash"
client = genai.Client(api_key=GENAI_API_KEY)
tools = [
    {"url_context": {}},
    {"google_search": {}},
]
    
# [DATA_INGESTION_TARGETS]
# Coordenadas de las fuentes contaminadas en la superficie.
#! Estas URLs son ejemplos y pueden ser reemplazadas por cualquier otra fuente de noticias relevante para el análisis.
#! Para el modelo Popola 1.0.0, se recomienda usar fuentes con información superpuesta pero con posibles contradicciones para evaluar su capacidad de aislamiento lógico.
#! Ademas de usar multiples fuentes (Recomendado 5)
url1 = "https://www.latercera.com/politica/noticia/kast-se-reune-con-boric-en-la-moneda-y-agradece-entrega-de-antecedentes-a-dias-del-cambio-de-mando/"
url2 = "https://www.adnradio.cl/2026/03/08/tras-su-encuentro-con-donald-trump-jose-antonio-kast-vuelve-a-chile-para-nueva-reunion-con-gabriel-boric/"
urls = [url1, url2]

# ==============================================================================
#  AGENTE 1 — ANALISTA (Con tools de lectura web y búsqueda)
#? Prompt diseñado para guiar al modelo a través de un proceso secuencial de análisis, clasificación y redacción,
#? con énfasis en la extracción de hechos verificables y la identificación de contradicciones y sesgos.
# ==============================================================================
response = client.models.generate_content(
    model=model_id,
    contents=f"""
    PROHIBIDO incluir texto explicativo, pasos de razonamiento o comentarios fuera del JSON.
    Tu respuesta comienza directamente con {{ y termina con }}.

    Eres Popola, agente de análisis periodístico neutral del Protocolo Gestalt v0.1.0.
    Analiza las fuentes entregadas y construye una noticia verificable, cronológica y sin sesgo.

    RESTRICCIÓN DE REPRODUCCIÓN: Está PROHIBIDO copiar o reproducir texto literal de las fuentes. 
    Todos los datos deben ser parafraseados y reformulados en tus propias palabras. 
    Cita solo fragmentos mínimos e imprescindibles (máximo 10 palabras) para las referencias.

    FUENTES A ANALIZAR:
    Fuente 1: {url1}
    Fuente 2: {url2}

    HERRAMIENTAS DISPONIBLES:
    - url_context: úsala para leer cada URL entregada como fuente.
    - google_search: úsala ÚNICAMENTE si algún dato crítico de la noticia no puede verificarse con las fuentes entregadas. Máximo 2 búsquedas. Si las fuentes son suficientes, NO busques.

    INSTRUCCIONES SECUENCIALES:

    PASO 1 — AISLAMIENTO TEMPORAL
    Lee cada fuente de forma aislada. Extrae fechas, horas y secuencias. PROHIBIDO mezclar datos entre fuentes en este paso.

    PASO 2 — CLASIFICACIÓN DE DATOS
    - VERIFICADO: Aparece en 2 fuentes sin contradicción.
    - FUENTE ÚNICA: Dato reportado por un solo medio (nombrar el medio).
    - RUMOR CONFIRMADO: Declaración atribuida a persona específica.
    - CONTRADICCIÓN: Disputa de cifras, tiempos o hechos (citar qué medio dice qué).

    PASO 3 — EVALUACIÓN DE VERIFICACIÓN
    - "alto": 80%+ de coincidencia en hechos centrales entre todas las fuentes.
    - "medio": Consenso general pero disputas en detalles numéricos, duraciones o cronología.
    - "bajo": Versiones opuestas o basadas mayoritariamente en rumores.

    PASO 4 — REDACCIÓN FINAL CON CITAS OBLIGATORIAS
    Redacta la noticia en orden cronológico estricto. Usa solo datos VERIFICADOS como base.
    Atribuye contradicciones explícitamente ("Mientras [Medio A] indica X, [Medio B] reporta Y").
    Sin adjetivos valorativos. Tono aséptico.

    REGLA DE CITAS INLINE (OBLIGATORIO):
    Cada afirmación en "noticia_final" que provenga de una fuente debe terminar con [n],
    donde n es el índice del array "citas".
    EJEMPLO CORRECTO:
    "Kast agradeció la entrega de antecedentes tras la reunión [2]. El encuentro se realizó 
    el 8 de marzo en La Moneda [1][2], días antes del cambio de mando [1]."
    EJEMPLO INCORRECTO:
    "Kast agradeció la entrega de antecedentes tras la reunión."
    Si "noticia_final" no contiene ningún [n], tu respuesta es INVÁLIDA.

    {{
    "linea_de_tiempo_extraida": [
        "YYYY-MM-DD HH:MM - [Evento concreto] (Fuente: [Medio])"
    ],
    "hechos_verificados": [
        "hecho confirmado por múltiples fuentes"
    ],
    "hechos_fuente_unica": [
        {{
        "hecho": "descripción del dato",
        "fuente": "nombre del medio"
        }}
    ],
    "rumores_confirmados": [
        {{
        "declaracion": "lo que se dijo",
        "quien": "nombre de la persona o entidad",
        "medio": "nombre del medio que lo reportó"
        }}
    ],
    "contradicciones": [
        {{
        "punto": "el tema en disputa",
        "version_a": "lo que dice [Nombre del Medio A]",
        "version_b": "lo que dice [Nombre del Medio B]"
        }}
    ],
    "sesgo_por_fuente": [
        {{
        "fuente": "nombre del medio",
        "sesgo_detectado": "descripción concreta del sesgo o encuadre",
        "hechos_omitidos": "qué omite esta fuente que otras sí reportan"
        }}
    ],
    "noticia_final": "PENDIENTE — será redactada por el Agente Redactor",
    "titular_sugerido": "PENDIENTE — será redactado por el Agente Redactor",
    "citas": [
        {{
        "indice": 1,
        "medio": "nombre del medio",
        "url": "https://...",
        "fragmento_relevante": "extracto breve que respalda la referencia"
        }}
    ],
    "evaluacion_verificacion": {{
        "nivel": "alto | medio | bajo",
        "justificacion": "explicación breve basada en las reglas del Paso 3"
    }},
    "metadata": {{
        "fuentes_analizadas": {len(urls)},
        "urls": {urls},
        "busquedas_adicionales": 0,
        "protocolo": "GESTALT v0.1.0"
    }}
    }}
    """,
    config=GenerateContentConfig(
        tools=tools,
    ),
)

# Extraer el bloque JSON de la respuesta del modelo
candidate = response.candidates[0]

# Validación básica de la respuesta antes de intentar parsear el JSON
if candidate.content is None:
    print(f"[ERROR] Respuesta vacía.")
    print(f"  Finish reason: {candidate.finish_reason}")
    print(f"  Safety ratings: {candidate.safety_ratings}")
else:
    full_response = ""
    for part in candidate.content.parts:
        if hasattr(part, "text") and part.text:
            full_response += part.text

    # Intentar parsear el bloque JSON de la respuesta, ignorando cualquier texto adicional o razonamiento previo.
    try:
        # Extraer solo el bloque JSON ignorando razonamiento previo
        start = full_response.find("{")
        end = full_response.rfind("}") + 1

        if start == -1 or end == 0:
            raise json.JSONDecodeError("No se encontró JSON en la respuesta", full_response, 0)

        clean_response = full_response[start:end]
        data = json.loads(clean_response)

        # Guardar el JSON limpio en un archivo para su posterior uso por Devola
        output_path = "popola_output.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[OK] Output guardado en {output_path}")

    except json.JSONDecodeError as e:
        print(f"[ERROR] No se pudo parsear la respuesta como JSON: {e}")
        print("Respuesta completa para debug:")
        print(full_response)

    # Imprimir información de telemetría relevante para evaluar el proceso de análisis y extracción de datos.
    print("\n[TELEMETRÍA DE RED]")
    meta = candidate.grounding_metadata
    if meta:
        if meta.web_search_queries:
            print(f"  Búsquedas realizadas: {meta.web_search_queries}")
        if meta.grounding_chunks:
            print(f"  Fuentes leídas ({len(meta.grounding_chunks)}):")
            for chunk in meta.grounding_chunks:
                if chunk.web:
                    print(f"    - {chunk.web.title}: {chunk.web.uri}")
    else:
        print("  Sin metadata de grounding disponible")


# ==============================================================================
#  AGENTE 2 — REDACTOR (Sin tools, solo redacción con citas)
# ? Prompt diseñado para guiar al modelo a redactar una noticia final con citas obligatorias,
# ?basándose exclusivamente en los hechos verificados y las contradicciones identificadas por el Agente Analista.
# ==============================================================================
print("\n[AGENTE 2] Iniciando redacción con citas...")

hechos = json.dumps({
    "hechos_verificados": data["hechos_verificados"],
    "hechos_fuente_unica": data["hechos_fuente_unica"],
    "linea_de_tiempo_extraida": data["linea_de_tiempo_extraida"],
    "citas": data["citas"],
    "contradicciones": data["contradicciones"]
}, ensure_ascii=False, indent=2)

response_redactor = client.models.generate_content(
    model=model_id,
    contents=f"""
Eres un redactor periodístico neutral. Tu única tarea es redactar una noticia y un titular.

DATOS VERIFICADOS:
{hechos}

INSTRUCCIONES:
- Redacta una noticia en orden cronológico estricto. Mínimo 4 párrafos.
- Tono aséptico, sin adjetivos valorativos.
- Cada afirmación DEBE terminar con [n] donde n es el índice del array "citas".
- El titular debe ser directo y sin sensacionalismo.

EJEMPLO OBLIGATORIO DE CITAS:
"Kast se reunió con Boric el 8 de marzo en La Moneda [2]. Dicho encuentro ocurrió tras su regreso de Miami [1]."

REGLA ABSOLUTA: Si "noticia_final" no contiene ningún [n], tu respuesta es INVÁLIDA.
Responde ÚNICAMENTE con este JSON. Sin texto adicional. El primer carácter es {{.

{{
  "noticia_final": "texto con citas [n] obligatorias",
  "titular_sugerido": "titular directo y aséptico"
}}
""",
    config=GenerateContentConfig(
        temperature=0.1,
    ),
)

# Extraer JSON del redactor
redactor_raw = ""
for part in response_redactor.candidates[0].content.parts:
    if hasattr(part, "text") and part.text:
        redactor_raw += part.text

start = redactor_raw.find("{")
end = redactor_raw.rfind("}") + 1
redactor_data = json.loads(redactor_raw[start:end])

# Merge en el JSON principal
data["noticia_final"] = redactor_data["noticia_final"]
data["titular_sugerido"] = redactor_data["titular_sugerido"]

# Guardar JSON final completo
with open("popola_output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("[OK] noticia_final con citas guardada en popola_output.json")