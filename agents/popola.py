# ==============================================================================
#  UNIT: POPOLA (Data Extraction and Purification Android)
#  VERSION: 0.1.0 (pipeline in development)
#  
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
#  GLORY TO MANKIND.
# ==============================================================================

import json
import os
import sys
import dotenv
from google import genai
from google.genai.types import GenerateContentConfig

# Carga de variables de entorno .env
# clave api debe estar dentro de .env
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
    
# Leer input desde stdin (enviado por Express)
raw_input = sys.stdin.read()
input_data = json.loads(raw_input)
urls = input_data["urls"]  # ya es el array limpio

# Generar las líneas de fuentes dinámicamente
fuentes = "\n".join([f"Fuente {i+1}: {url}" for i, url in enumerate(urls)])

# ==============================================================================
#  AGENTE 1 — ANALISTA (Con tools de lectura web y búsqueda)
#? Prompt diseñado para guiar al modelo a través de un proceso secuencial de análisis, clasificación y redacción,
#? con énfasis en la extracción de hechos verificables y la identificación de contradicciones y sesgos.
# ==============================================================================
PROTOCOLO_VERSION = "GESTALT v0.5.0"

response = client.models.generate_content(
    model=model_id,
    contents=f"""
PROHIBIDO incluir texto explicativo, pasos de razonamiento o comentarios fuera del JSON.
Tu respuesta comienza directamente con {{ y termina con }}.

Eres Popola, agente de análisis periodístico neutral del {PROTOCOLO_VERSION}.
Tu única tarea en este paso es analizar fuentes, clasificar hechos y construir
el objeto de datos que será usado por el Agente Redactor y por Devola.
NO redactes la noticia final. Ese campo será completado en la siguiente etapa.

RESTRICCIÓN DE REPRODUCCIÓN:
Está PROHIBIDO copiar o reproducir texto literal de las fuentes.
Todos los datos deben ser parafraseados. Cita solo fragmentos mínimos
e imprescindibles (máximo 10 palabras) en "fragmento_relevante".

FUENTES A ANALIZAR:
{fuentes}

HERRAMIENTAS DISPONIBLES:
- url_context: úsala para leer cada URL entregada como fuente.
- google_search: úsala ÚNICAMENTE si un dato crítico no puede verificarse
  con las fuentes entregadas. Máximo 3 búsquedas. Si las fuentes son
  suficientes, NO busques.

INSTRUCCIONES SECUENCIALES:

PASO 1 — AISLAMIENTO TEMPORAL
Lee cada fuente de forma aislada. Extrae fechas, horas y secuencias.
PROHIBIDO mezclar datos entre fuentes en este paso.

PASO 2 — CLASIFICACIÓN DE DATOS
- VERIFICADO: Aparece en 2 o más fuentes sin contradicción.
- FUENTE ÚNICA: Dato reportado por un solo medio (nombrar el medio).
- RUMOR CONFIRMADO: Declaración atribuida a persona específica.
- CONTRADICCIÓN: Disputa de cifras, tiempos o hechos
  (citar qué medio dice qué).

PASO 3 — ANÁLISIS DE SESGO (OBLIGATORIO PARA LAS {len(urls)} FUENTES)
Para CADA una de las {len(urls)} fuentes debes generar una entrada en
"sesgo_por_fuente". Si una fuente no presenta sesgo detectable, escribe
"sesgo_detectado": "ninguno detectado" y "hechos_omitidos": "ninguno".
No omitir fuentes en este campo — una entrada faltante invalida el JSON.

PASO 4 — CHECKLIST PARA DEVOLA
Genera ítems en "devola_checklist" ÚNICAMENTE para datos que requieren
revisión humana. NO incluyas hechos ya verificados por múltiples fuentes.

Incluir obligatoriamente:
- Cada ítem de "hechos_fuente_unica" — solo un medio lo reporta
- Cada ítem de "rumores_confirmados" — es declaración, no hecho comprobado
- Cada ítem de "contradicciones" — versiones opuestas, Devola decide cuál publicar

NO incluir:
- Hechos que aparecen en 3 o más fuentes sin contradicción

Formato por ítem:
{{
  "hecho": "el dato a verificar",
  "tipo": "fuente_unica | rumor | contradiccion",
  "url_respaldo": "https://...",
  "fragmento_clave": "máximo 10 palabras",
  "estado": "pendiente"
}}

PASO 5 — EVALUACIÓN DE VERIFICACIÓN
- "alto": 80%+ de coincidencia en hechos centrales entre todas las fuentes.
- "medio": Consenso general pero disputas en detalles numéricos o cronología.
- "bajo": Versiones opuestas o basadas mayoritariamente en rumores.

MANEJO DE FUENTES INACCESIBLES:
Si url_context no puede leer una URL, agrégala a "fuentes_inaccesibles"
en metadata y omítela del análisis.
NUNCA inferir ni inventar datos de fuentes no leídas.

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
  "devola_checklist": [
    {{
      "hecho": "el hecho verificado a confirmar",
      "url_respaldo": "https://...",
      "fragmento_clave": "extracto de máximo 10 palabras que lo respalda",
      "estado": "pendiente"
    }}
  ],
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
    "justificacion": "explicación breve basada en las reglas del Paso 5"
  }},
  "noticia_final": "PENDIENTE",
  "titular_sugerido": "PENDIENTE",
  "status": "pendiente_revision",
  "tags": ["tema1", "tema2"],
  "metadata": {{
    "fuentes_analizadas": {len(urls)},
    "fuentes_inaccesibles": [],
    "urls": {json.dumps(urls, ensure_ascii=False)},
    "busquedas_adicionales": 0,
    "protocolo": "{PROTOCOLO_VERSION}"
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
        start = full_response.find("{")
        end = full_response.rfind("}") + 1

        if start == -1 or end == 0:
            raise json.JSONDecodeError("No se encontró JSON en la respuesta", full_response, 0)

        clean_response = full_response[start:end]
        data = json.loads(clean_response)

        output_path = "popola_output.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        sys.stderr.write(f"[OK] Output guardado en {output_path}\n")

    except json.JSONDecodeError as e:
        # ⚠️ CORRECCIÓN: Enviar prints de error a stderr
        print(f"[ERROR] No se pudo parsear la respuesta como JSON: {e}", file=sys.stderr)
        print("Respuesta completa para debug:", file=sys.stderr)
        print(full_response, file=sys.stderr)

    sys.stderr.write("\n[TELEMETRÍA DE RED]\n")
    meta = candidate.grounding_metadata
    if meta:
        if meta.web_search_queries:
            # ⚠️ CORRECCIÓN: Enviar prints a stderr
            print(f"  Búsquedas realizadas: {meta.web_search_queries}", file=sys.stderr)
        if meta.grounding_chunks:
            print(f"  Fuentes leídas ({len(meta.grounding_chunks)}):", file=sys.stderr)
            for chunk in meta.grounding_chunks:
                if chunk.web:
                    print(f"    - {chunk.web.title}: {chunk.web.uri}", file=sys.stderr)
    else:
        print("  Sin metadata de grounding disponible", file=sys.stderr)


# ==============================================================================
#  AGENTE 2 — REDACTOR (Sin tools, solo redacción con citas)
#? Prompt diseñado para forzar al modelo a redactar una noticia final con citas obligatorias,
#? basándose exclusivamente en los hechos verificados por el Analista, y siguiendo un formato estricto de citas inline.
# ==============================================================================
sys.stderr.write("\n[AGENTE 2] Iniciando redacción con citas...\n")

hechos = json.dumps({
    "linea_de_tiempo_extraida":  data["linea_de_tiempo_extraida"],
    "hechos_verificados":        data["hechos_verificados"],
    "hechos_fuente_unica":       data["hechos_fuente_unica"],
    "rumores_confirmados":       data["rumores_confirmados"],
    "contradicciones":           data["contradicciones"],
    "sesgo_por_fuente":          data["sesgo_por_fuente"],
    "citas":                     data["citas"],
}, ensure_ascii=False, indent=2)

try:
    response_redactor = client.models.generate_content(
        model=model_id,
        contents=f"""
PROHIBIDO incluir texto explicativo o comentarios fuera del JSON.
Tu respuesta comienza directamente con {{ y termina con }}.

Eres un redactor periodístico neutral del Protocolo Gestalt.
Tu única tarea es redactar una noticia final y un titular
basándote EXCLUSIVAMENTE en los datos entregados por el Agente Analista.
PROHIBIDO agregar hechos, inferencias o datos que no estén en el input.

DATOS DEL ANALISTA:
{hechos}

INSTRUCCIONES DE REDACCIÓN:
- Redacta en orden cronológico estricto siguiendo "linea_de_tiempo_extraida".
- Mínimo 4 párrafos. Cada párrafo cubre un bloque temporal o temático distinto.
- Tono aséptico. Prohibido usar adjetivos valorativos.
- Usa solo "hechos_verificados" como base del relato.
- Los datos de "hechos_fuente_unica" pueden incluirse indicando el medio:
  "Según [Medio], ..."
- Las declaraciones de "rumores_confirmados" deben atribuirse explícitamente:
  "[Quien] declaró que ... según [Medio] [n]."
- Las "contradicciones" deben redactarse así:
  "Mientras [Medio A] indica X [n], [Medio B] reporta Y [n]."
- No menciones "sesgo_por_fuente" directamente en la noticia.

REGLA DE CITAS INLINE (ABSOLUTA):
Cada afirmación que provenga de una fuente DEBE terminar con [n],
donde n es el índice del array "citas".
EJEMPLO CORRECTO:
"Kast se reunió con Boric el 8 de marzo en La Moneda [1][2].
El encuentro ocurrió tras su regreso de Miami [3].
Mientras La Tercera indica que duró 30 minutos [1],
ADN Radio no reporta duración [2]."
EJEMPLO INCORRECTO:
"Kast se reunió con Boric en La Moneda."
Si "noticia_final" no contiene ningún [n], la respuesta es INVÁLIDA.

REGLAS DE FORMATO:
- "noticia_final" es un string continuo con saltos de línea entre párrafos (\\n\\n).
- "titular_sugerido" es una oración directa, sin signos de exclamación,
  sin adjetivos valorativos, máximo 15 palabras.
- Sin markdown, sin bullets, sin numeración dentro del string.

{{
  "noticia_final": "texto con citas [n] obligatorias",
  "titular_sugerido": "titular directo y aséptico"
}}
""",
        config=GenerateContentConfig(
            temperature=0.1,
        ),
    )

    candidate_redactor = response_redactor.candidates[0]

    if candidate_redactor.content is None:
        print(f"[ERROR] Agente 2 devolvió respuesta vacía.")
        print(f"  Finish reason: {candidate_redactor.finish_reason}")
        print(f"  Safety ratings: {candidate_redactor.safety_ratings}")
        redactor_data = {
            "noticia_final": "ERROR — Agente 2 sin contenido",
            "titular_sugerido": "ERROR"
        }
    else:
        redactor_raw = ""
        for part in candidate_redactor.content.parts:
            if hasattr(part, "text") and part.text:
                redactor_raw += part.text

        start = redactor_raw.find("{")
        end = redactor_raw.rfind("}") + 1

        if start == -1 or end == 0:
            raise json.JSONDecodeError("No se encontró JSON en la respuesta del Redactor", redactor_raw, 0)

        redactor_data = json.loads(redactor_raw[start:end])

except json.JSONDecodeError as e:
    # ⚠️ CORRECCIÓN: Enviar prints a stderr
    print(f"[ERROR] No se pudo parsear la respuesta del Agente 2: {e}", file=sys.stderr)
    print("Respuesta raw del Agente 2:", file=sys.stderr)
    print(redactor_raw, file=sys.stderr)
    # ...

except Exception as e:
    print(f"[ERROR CRÍTICO] Agente 2 falló con excepción inesperada: {e}", file=sys.stderr)
    # ...

# Merge y guardar archivo
data["noticia_final"]    = redactor_data["noticia_final"]
data["titular_sugerido"] = redactor_data["titular_sugerido"]

with open("popola_output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

sys.stderr.write("[OK] noticia_final con citas guardada en popola_output.json\n")

# ✅ ÚNICA LÍNEA QUE VA A STDOUT (Sin file=sys.stderr) — Express la parsea
print(json.dumps(data, ensure_ascii=False))