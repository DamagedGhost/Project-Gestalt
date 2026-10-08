# ==============================================================================
#  UNIT: POPOLA (Data Extraction and Purification Android)
#  VERSION: 1.2.0 (Protocolo de deteccion de tipo de sesgo, checklist de verificación y evaluación de nivel de verificación)
#  (Mejora en redacción del prompt para el Agente Redactor, con reglas estrictas de citas inline y agrupación narrativa de declaraciones)
#  AKA menos mecánico y más fluido, pero con citas obligatorias para cada hecho reportado.
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
import time
import dotenv
from google import genai
from google.genai.types import GenerateContentConfig

# Asegurar codificación UTF-8 en stdin/stdout/stderr (crucial en Windows)
if hasattr(sys.stdin, "reconfigure"):
    sys.stdin.reconfigure(encoding="utf-8")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Carga de variables de entorno .env (revisa la raíz del proyecto y cwd)
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(script_dir)
dotenv.load_dotenv(os.path.join(root_dir, ".env"))
dotenv.load_dotenv()

# Modo simulación (Mock) para depuración a costo $0 sin gastar cuota de API
POPOLA_MOCK = os.getenv("POPOLA_MOCK", "false").strip().lower() in ("true", "1", "yes")

# Configuración de modelo Gemini
model_id = os.getenv("POPOLA_MODEL", "gemini-2.5-flash").strip()

# Configuración de creatividad/temperatura del Agente 2 (Redactor)
# 0.0 - 0.2: Máxima fidelidad y apego estricto a las reglas de citas (más aséptico).
# 0.3 - 0.5: Balance recomendado (redacción periodística atractiva y fluida).
# 0.6 - 0.8: Mayor creatividad y libertad narrativa (estilo más llamativo).
try:
    redactor_temperature = float(os.getenv("POPOLA_REDACTOR_TEMPERATURE", "0.2"))
    redactor_temperature = max(0.0, min(1.0, redactor_temperature))
except ValueError:
    redactor_temperature = 0.2

# Variable de entorno para clave API (solo obligatoria si no estamos en modo Mock)
GENAI_API_KEY = os.getenv("GENAI_API_KEY")
client = None

if not POPOLA_MOCK:
    if not GENAI_API_KEY or GENAI_API_KEY.startswith("AIzaSy...") or "Clave eliminada" in GENAI_API_KEY:
        raise ValueError("[ERROR CRÍTICO] GENAI_API_KEY inválida o ausente. Para depurar sin clave, activa POPOLA_MOCK=true en .env")
    client = genai.Client(api_key=GENAI_API_KEY)

tools = [
    {"url_context": {}},
    {"google_search": {}},
]
    
# Leer input desde stdin (enviado por Express)
raw_input = sys.stdin.read()
input_data = json.loads(raw_input)

sources = input_data.get("sources")
use_purified_sources = isinstance(sources, list) and len(sources) > 0

if use_purified_sources:
    urls = [s.get("url", "") for s in sources]
    fuentes_inaccesibles = input_data.get("fuentes_inaccesibles", [])
    tools = [
        {"google_search": {}},
    ]
    fuentes = "\n".join([
        f"Fuente {i+1}: {s.get('medio', 'Fuente')} ({s.get('url', '')})\n"
        f"TITULAR: {s.get('titular', '')}\n"
        f"TEXTO LIMPIO:\n{s.get('texto', '')}"
        for i, s in enumerate(sources)
    ])
else:
    urls = input_data.get("urls", [])  # array de URLs crudas
    fuentes_inaccesibles = input_data.get("fuentes_inaccesibles", [])
    # Generar las líneas de fuentes dinámicamente
    fuentes = "\n".join([f"Fuente {i+1}: {url}" for i, url in enumerate(urls)])

# ==============================================================================
#  RAMA MOCK — EJECUCIÓN SIMULADA PARA DESARROLLO SIN CONSUMO DE API
# ==============================================================================
PROTOCOLO_VERSION = "GESTALT v0.5.0"

if POPOLA_MOCK:
    sys.stderr.write("[POPOLA MOCK] Modo simulación activo. Procesando con datos de prototipo...\n")
    mock_candidates = [
        os.path.join(root_dir, "prototype", "popola_output_FINAL.json"),
        os.path.join(script_dir, "..", "prototype", "popola_output_FINAL.json"),
        os.path.join(os.getcwd(), "prototype", "popola_output_FINAL.json"),
        os.path.join(os.getcwd(), "popola_output_FINAL.json"),
    ]
    mock_data = None
    for cand in mock_candidates:
        if os.path.exists(cand):
            try:
                with open(cand, "r", encoding="utf-8") as f:
                    mock_data = json.load(f)
                sys.stderr.write(f"[POPOLA MOCK] Archivo de referencia cargado: {cand}\n")
                break
            except Exception as e:
                sys.stderr.write(f"[POPOLA MOCK] Error leyendo {cand}: {e}\n")

    if not mock_data:
        sys.stderr.write("[POPOLA MOCK] No se encontró popola_output_FINAL.json, utilizando estructura base.\n")
        mock_data = {
            "titular_sugerido": "Simulación: Nota verificada por Protocolo Gestalt",
            "noticia_final": "Esta es una noticia generada en modo simulación para desarrollo local [1]. El sistema opera desacoplado de la API externa para preservar cuota [1].",
            "hechos_verificados": ["Modo simulación de Popola activo."],
            "hechos_fuente_unica": [],
            "rumores_confirmados": [],
            "contradicciones": [],
            "sesgo_por_fuente": [],
            "devola_checklist": [],
            "citas": [{"indice": 1, "medio": "Protocolo Gestalt", "url": "https://gestalt.local", "fragmento_relevante": "Modo simulación"}],
            "evaluacion_verificacion": {"nivel": "alto", "justificacion": "Datos de simulación validados localmente."},
            "tags": ["simulacion", "gestalt", "mock"],
            "metadata": {}
        }

    # Adaptar metadatos con las URLs de la petición actual
    if "metadata" not in mock_data or not isinstance(mock_data["metadata"], dict):
        mock_data["metadata"] = {}
    mock_data["metadata"]["urls"] = urls
    mock_data["metadata"]["fuentes_analizadas"] = len(urls)
    mock_data["metadata"]["fuentes_inaccesibles"] = fuentes_inaccesibles
    mock_data["metadata"]["busquedas_adicionales"] = 0
    mock_data["metadata"]["protocolo"] = f"{PROTOCOLO_VERSION} (MOCK)"

    # Simular una breve latencia de procesamiento (1 segundo)
    time.sleep(1.0)

    output_path = os.path.join(os.getcwd(), "popola_output.json")
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(mock_data, f, indent=2, ensure_ascii=False)
        sys.stderr.write(f"[POPOLA MOCK] Output guardado en {output_path}\n")
    except Exception as e:
        sys.stderr.write(f"[POPOLA MOCK] Advertencia al escribir archivo local: {e}\n")

    # Salida única por STDOUT (lo que parsea Express)
    print(json.dumps(mock_data, ensure_ascii=False))
    sys.exit(0)

# ==============================================================================
#  AGENTE 1 — ANALISTA (Con tools de lectura web y búsqueda)
#? Prompt diseñado para guiar al modelo a través de un proceso secuencial de análisis, clasificación y redacción,
#? con énfasis en la extracción de hechos verificables y la identificación de contradicciones y sesgos.
# ==============================================================================
PROTOCOLO_VERSION = "GESTALT v0.5.0"

if use_purified_sources:
    fuentes_label = "FUENTES PURIFICADAS (NO usar url_context):"
    tools_instructions = """- google_search para verificar datos noticiosos: máximo 2 búsquedas
- google_search para investigar línea editorial en el PASO 3: máximo 1 búsqueda por fuente"""
    paso1_instruccion = "Lee cada fuente usando exclusivamente el texto limpio entregado."
else:
    fuentes_label = "FUENTES A ANALIZAR:"
    tools_instructions = """- url_context: úsala para leer cada URL entregada como fuente.
- google_search para verificar datos noticiosos: máximo 2 búsquedas
- google_search para investigar línea editorial en el PASO 3: máximo 1 búsqueda por fuente"""
    paso1_instruccion = "Lee cada fuente de forma aislada."

contents_analista = f"""
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

{fuentes_label}
{fuentes}

HERRAMIENTAS DISPONIBLES:
{tools_instructions}

INSTRUCCIONES SECUENCIALES:

PASO 1 — AISLAMIENTO TEMPORAL
{paso1_instruccion} Extrae fechas, horas y secuencias.
PROHIBIDO mezclar datos entre fuentes en este paso.

PASO 2 — CLASIFICACIÓN DE DATOS
- VERIFICADO: Aparece en 2 o más fuentes sin contradicción.
- FUENTE ÚNICA: Dato reportado por un solo medio (nombrar el medio).
- De "rumores_confirmados", incluir SOLO declaraciones que:
    - Contengan cifras específicas no verificables (encuestas, porcentajes)
    - Contradigan hechos verificados
    - Provengan de fuente única
NO incluir declaraciones de rechazo o apoyo político genérico
- CONTRADICCIÓN: Disputa de cifras, tiempos o hechos
  (citar qué medio dice qué).
  

PASO 3 — ANÁLISIS DE SESGO (OBLIGATORIO PARA LAS {len(urls)} FUENTES)
Para CADA una de las {len(urls)} fuentes genera una entrada en "sesgo_por_fuente".
Para identificar el tipo de sesgo puedes usar google_search si necesitas
contexto sobre el medio (línea editorial, historial, ideología conocida).
Si una fuente no presenta sesgo detectable escribe:
  "sesgo_detectado": "ninguno detectado"
  "tipo_sesgo": "ninguno"
  "hechos_omitidos": "ninguno"
No omitir fuentes — una entrada faltante invalida el JSON.

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
      "tipo_sesgo": "descripción libre del tipo: ej. 'sesgo de confirmación hacia la fiscalía', 'encuadre sensacionalista del crimen', 'omisión sistemática de la defensa'",
      "hechos_omitidos": "qué omite esta fuente que otras sí reportan"
    }}
  ],
  "devola_checklist": [
    {{
      "hecho": "el dato a verificar",
      "tipo": "fuente_unica | rumor | contradiccion",
      "url_respaldo": "https://...",
      "fragmento_clave": "máximo 10 palabras",
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
    "fuentes_inaccesibles": {json.dumps(fuentes_inaccesibles, ensure_ascii=False)},
    "urls": {json.dumps(urls, ensure_ascii=False)},
    "busquedas_adicionales": 0,
    "protocolo": "{PROTOCOLO_VERSION}"
  }}
}}
    """
try:
    response = client.models.generate_content(
        model=model_id,
        contents=contents_analista,
        config=GenerateContentConfig(
            tools=tools,
        ),
    )
except Exception as e:
    print(f"[ERROR CRÍTICO POPOLA - ANALISTA] Fallo al invocar Gemini API: {e}", file=sys.stderr)
    sys.exit(1)

if not response.candidates:
    print("[ERROR POPOLA - ANALISTA] Gemini no retornó ningún candidato.", file=sys.stderr)
    sys.exit(1)

# Extraer el bloque JSON de la respuesta del modelo
candidate = response.candidates[0]

# Validación básica de la respuesta antes de intentar parsear el JSON
if candidate.content is None:
    print(f"[ERROR] Respuesta vacía del Analista.", file=sys.stderr)
    print(f"  Finish reason: {candidate.finish_reason}", file=sys.stderr)
    print(f"  Safety ratings: {candidate.safety_ratings}", file=sys.stderr)
    sys.exit(1)

full_response = ""
for part in candidate.content.parts:
    if hasattr(part, "text") and part.text:
        full_response += part.text

# Intentar parsear el bloque JSON de la respuesta
try:
    start = full_response.find("{")
    end = full_response.rfind("}") + 1

    if start == -1 or end == 0:
        raise json.JSONDecodeError("No se encontró JSON en la respuesta del Analista", full_response, 0)

    clean_response = full_response[start:end]
    data = json.loads(clean_response)

except json.JSONDecodeError as e:
    print(f"[ERROR] No se pudo parsear la respuesta del Analista como JSON: {e}", file=sys.stderr)
    print("Respuesta completa para debug:", file=sys.stderr)
    print(full_response, file=sys.stderr)
    sys.exit(1)

# Telemetría real de Google Search Grounding y actualización de metadata
sys.stderr.write("\n[TELEMETRÍA DE RED]\n")
meta = candidate.grounding_metadata
queries_count = 0
if meta:
    if meta.web_search_queries:
        queries_count = len(meta.web_search_queries)
        print(f"  Búsquedas realizadas ({queries_count}): {meta.web_search_queries}", file=sys.stderr)
    if meta.grounding_chunks:
        print(f"  Fuentes leídas ({len(meta.grounding_chunks)}):", file=sys.stderr)
        for chunk in meta.grounding_chunks:
            if chunk.web:
                print(f"    - {chunk.web.title}: {chunk.web.uri}", file=sys.stderr)
else:
    print("  Sin metadata de grounding disponible", file=sys.stderr)

# Sobrescribir busquedas_adicionales con la cantidad real de búsquedas efectuadas
if "metadata" not in data or not isinstance(data["metadata"], dict):
    data["metadata"] = {}
data["metadata"]["busquedas_adicionales"] = queries_count

output_path = "popola_output.json"
try:
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    sys.stderr.write(f"[OK] Output del Analista guardado en {output_path}\n")
except Exception as e:
    sys.stderr.write(f"[ADVERTENCIA] No se pudo escribir {output_path}: {e}\n")


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

prompt_redactor = f"""
PROHIBIDO incluir texto explicativo o comentarios fuera del JSON.
Tu respuesta comienza directamente con {{ y termina con }}.

Eres un redactor periodístico del Protocolo Gestalt.
Tu tarea es redactar una noticia con ritmo narrativo y un titular periodístico claro,
basándote EXCLUSIVAMENTE en los datos entregados por el Agente Analista.
PROHIBIDO agregar hechos, inferencias o datos que no estén en el input.

DATOS DEL ANALISTA:
{hechos}

INSTRUCCIONES DE REDACCIÓN:
- Redacta en orden cronológico estricto siguiendo "linea_de_tiempo_extraida".
- Mínimo 4 párrafos. Cada párrafo cubre un bloque temporal o temático distinto.
- Tono: periodístico directo, fluido y riguroso.
- Prohibido: adjetivos que evalúen moralmente los hechos o a los actores.
- Permitido: conectores temporales, causales y de contraste que den dinamismo al relato.
- Usa solo "hechos_verificados" como base del relato central.
- Los datos de "hechos_fuente_unica" pueden incluirse indicando el medio:
  "Según [Medio], ..."
- Si una misma persona o entidad tiene múltiples declaraciones, AGRÚPALAS en un solo párrafo fluido usando conectores
  (ej: "Asimismo, Marcel advirtió...", "En esa línea, el exministro agregó..."). EVITA repetir mecánicamente "Marcel declaró".
- Las declaraciones deben atribuirse a su autor, finalizando el bloque con la cita del medio [n]
- Las "contradicciones" deben redactarse así:
  "Mientras [Medio A] indica X [n], [Medio B] reporta Y [n]."
- No menciones "sesgo_por_fuente" directamente en la noticia.

REGLA DE CITAS INLINE Y COBERTURA CONTINUA (ABSOLUTA):
Cada afirmación que provenga de una fuente DEBE terminar con [n],
donde n es el índice del array "citas".
PROHIBIDO colocar una cita únicamente en la primera frase de un párrafo y dejar el resto de oraciones factuales sin cita.
Toda oración que aporte un dato debe llevar su respaldo inmediato [n].

EJEMPLO CORRECTO:
"Kast se reunió con Boric el 8 de marzo en La Moneda [1][2].
El encuentro ocurrió tras su regreso de Miami [3].
Mientras La Tercera indica que duró 30 minutos [1],
ADN Radio no reporta duración [2]."

EJEMPLO INCORRECTO (SIN CITAS):
"Kast se reunió con Boric en La Moneda."

EJEMPLO INCORRECTO (COBERTURA INSUFICIENTE EN PÁRRAFO LARGO):
"El 16 de marzo comenzaron las obras en el paso fronterizo [1][2]. Los trabajos abarcan una extensión de 200 metros y se espera que concluyan en mayo. Las autoridades descartaron impacto en el tránsito vecinal."
(ERROR: La segunda y tercera oración contienen hechos factuales pero carecen de citas individuales [n]).

Si "noticia_final" no contiene citas [n] distribuidas a lo largo de todo el texto, la respuesta es INVÁLIDA.

REGLAS DE FORMATO:
- "noticia_final" es un string continuo con saltos de línea entre párrafos (\\n\\n).
- "titular_sugerido" es una oración directa, sin signos de exclamación,
  sin adjetivos valorativos, máximo 15 palabras.
- Sin markdown, sin bullets, sin numeración dentro del string.

REGLA DE DEDUPLICACIÓN (ABSOLUTA):
Cada hecho aparece UNA SOLA VEZ en la noticia.
- Si un hecho está en "hechos_verificados", NO lo repitas al procesar
  "hechos_fuente_unica" ni "rumores_confirmados".
- Los hechos presentes en "contradicciones" NO se narran como verificados.
  Solo aparecen en formato de disputa:
  "Mientras [Medio A] indica X [n], [Medio B] reporta Y [n]."
  Nunca antes, nunca después.

{{
  "noticia_final": "texto con citas [n] obligatorias por cada oración factual",
  "titular_sugerido": "titular directo y aséptico"
}}
"""

try:
    response_redactor = client.models.generate_content(
        model=model_id,
        contents=prompt_redactor,
        config=GenerateContentConfig(
            temperature=redactor_temperature,
        ),
    )
except Exception as e:
    print(f"[ERROR CRÍTICO POPOLA - REDACTOR] Fallo al invocar Gemini API: {e}", file=sys.stderr)
    sys.exit(1)

if not response_redactor.candidates:
    print("[ERROR POPOLA - REDACTOR] Gemini no retornó ningún candidato para redacción.", file=sys.stderr)
    sys.exit(1)

candidate_redactor = response_redactor.candidates[0]

if candidate_redactor.content is None:
    print(f"[ERROR] Agente 2 devolvió respuesta vacía.", file=sys.stderr)
    print(f"  Finish reason: {candidate_redactor.finish_reason}", file=sys.stderr)
    print(f"  Safety ratings: {candidate_redactor.safety_ratings}", file=sys.stderr)
    sys.exit(1)

redactor_raw = ""
for part in candidate_redactor.content.parts:
    if hasattr(part, "text") and part.text:
        redactor_raw += part.text

try:
    start = redactor_raw.find("{")
    end   = redactor_raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise json.JSONDecodeError("Sin JSON en respuesta del Redactor", redactor_raw, 0)
    redactor_data = json.loads(redactor_raw[start:end])

except json.JSONDecodeError as e:
    print(f"[ERROR] No se pudo parsear la respuesta del Agente 2: {e}", file=sys.stderr)
    print("Respuesta raw del Agente 2:", file=sys.stderr)
    print(redactor_raw, file=sys.stderr)
    sys.exit(1)

except Exception as e:
    print(f"[ERROR CRÍTICO] Agente 2 falló con excepción inesperada: {e}", file=sys.stderr)
    sys.exit(1)

# Merge y guardar archivo
data["noticia_final"]    = redactor_data.get("noticia_final", "ERROR")
data["titular_sugerido"] = redactor_data.get("titular_sugerido", "ERROR")

output_path = "popola_output.json"
try:
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    sys.stderr.write(f"[OK] noticia_final con citas guardada en {output_path}\n")
except Exception as e:
    sys.stderr.write(f"[ADVERTENCIA] No se pudo guardar {output_path}: {e}\n")

# Única salida por STDOUT requerida por Express/popolaService
print(json.dumps(data, ensure_ascii=False))