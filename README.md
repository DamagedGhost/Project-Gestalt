# Project Gestalt

> *"The goal of Project Gestalt was to separate the soul from its vessel — to preserve what mattered, while discarding what corrupted it."*

Un sistema de periodismo verificado impulsado por IA, construido bajo el principio de que la inteligencia artificial es una herramienta de extensión humana, no un reemplazo del juicio humano. Proyecto de titulación — Ingeniería Informática.

---

## Filosofía

El ecosistema informativo moderno está saturado de sesgo editorial, desinformación y narrativas construidas. Este proyecto nace de una pregunta de ingeniería concreta: ¿es posible construir una infraestructura que separe los hechos del ruido?

La respuesta es **Proyecto Gestalt** — inspirado en el *lore* de la saga *NieR*, donde el Proyecto Gestalt buscaba preservar la esencia humana separándola de la corrupción que la rodeaba. Aquí, esa esencia son los hechos. La corrupción es el sesgo.

**Sobre el rol de la IA en este proyecto:**
La inteligencia artificial no escribe periodismo en Gestalt. Extrae, cruza fuentes, clasifica hechos y detecta sesgos — tareas de análisis masivo que serían inviables manualmente. El resultado nunca se publica de forma autónoma. Cada artículo generado por la IA debe pasar por revisión y aprobación humana antes de existir públicamente. Cuando la IA se usa como extensión del criterio humano en lugar de como sustituto, el resultado es una herramienta que amplifica capacidades sin ceder el control. Eso es lo que demuestra este proyecto.

*Glory to mankind.*

---

## Arquitectura — Los Actores

```
URLs de noticias
      │
      ▼
┌─────────────┐     JSON verificado     ┌─────────────┐     Aprobación     ┌──────────────┐
│   POPOLA    │ ──────────────────────► │   DEVOLA    │ ─────────────────► │ LA BIBLIOTECA│
│  (IA Worker)│                         │  (Backend + │                    │  (Frontend   │
│   Python    │                         │   Editor)   │                    │   público)   │
└─────────────┘                         └─────────────┘                    └──────────────┘
```

**Unidad Popola (IA Worker)** — Microservicio Python. Ingiere URLs de múltiples medios, ejecuta el protocolo de verificación cruzada usando Gemini y produce un documento JSON estructurado con hechos verificados, análisis de sesgo por fuente, cronología, y un artículo redactado con citas inline. Nunca publica nada por sí sola.

**Unidad Devola (Backend + Panel Editorial)** — Servidor Node.js/Express. Orquesta el pipeline, persiste los documentos en MongoDB, y expone el panel de revisión donde el editor humano aprueba, rechaza o corrige cada artículo antes de publicarlo. Implementa el patrón *Human-in-the-Loop* como garantía arquitectónica.

**La Biblioteca (Frontend público)** — El destino final. Hub de solo lectura para el público general. Solo contiene artículos que pasaron por Devola. Inspirado en la biblioteca de información de NieR: Automata — un archivo preservado, ordenado, confiable.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| IA / Extracción | Python + Google Gemini API (`gemini-2.0-flash` / `gemini-2.5-pro`) |
| Backend | Node.js + Express |
| Base de datos | MongoDB Atlas |
| Frontend | React (en desarrollo) |
| Deploy | AWS Academy (CI/CD) + Oracle Cloud Free Tier (respaldo) |

---

## Estado actual del proyecto

```
v0.5.0 — Backend + MongoDB operativos
```

| Componente | Estado |
|---|---|
| Popola (pipeline de extracción y redacción) | ✅ Operativo |
| Backend Express + endpoint `/api/analyze` | ✅ Operativo |
| Persistencia en MongoDB Atlas | ✅ Operativo |
| La Biblioteca (frontend público) | 🔄 En desarrollo |
| Panel Devola (editor humano) | 🔄 En desarrollo |
| Deploy en producción | ⏳ Pendiente |

---

## Instalación y ejecución local

### Requisitos previos
- Node.js v18 o superior
- Python 3.10 o superior
- Una cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier M0 es suficiente)
- Una API Key de [Google AI Studio](https://aistudio.google.com/)

---

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/Proyect-gestalt.git
cd Proyect-gestalt
```

---

### 2. Configurar las variables de entorno

Crear un archivo `.env` en la **raíz del proyecto** (mismo nivel que las carpetas `agents/` y `backend/`):

```env
# Google Gemini API
GENAI_API_KEY="AIzaSy..."

# MongoDB Atlas — obtener desde Atlas > Connect > Drivers
DB_URL="mongodb+srv://<usuario>:<password>@cluster-x.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-1"

# Puerto del servidor Node (opcional, por defecto 3000)
PORT=3000
```

> **Importante:** Este archivo está en `.gitignore` intencionalmente. Nunca subir credenciales al repositorio.

---

### 3. Instalar dependencias de Node.js

```bash
cd backend
npm install
```

---

### 4. Instalar dependencias de Python

```bash
cd ../agents
pip install -r requirements.txt
```

Si no existe `requirements.txt`, instalar manualmente:

```bash
pip install google-genai python-dotenv
```

---

### 5. Levantar el servidor

```bash
cd ../backend
npm run dev
```

Si todo está correcto, la consola debe mostrar:

```
[DB] Conectando a MongoDB...
[DB] Conexión exitosa a MongoDB Atlas.
[SERVER] Escuchando en http://localhost:3000
[SERVER] Endpoint disponible: POST /api/analyze
```

---

### 6. Probar el pipeline

Enviar una petición POST a `/api/analyze` con un array de URLs de noticias sobre el mismo tema:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.ejemplo1.cl/noticia",
      "https://www.ejemplo2.cl/noticia",
      "https://www.ejemplo3.cl/noticia"
    ]
  }'
```

La respuesta incluirá el `nota_id` de MongoDB, el status `pendiente_revision`, y el JSON completo generado por Popola.

Alternativamente, usar el archivo `backend/test.html` desde el navegador para una interfaz de prueba visual.

---

## Estructura del repositorio

```
Proyect-gestalt/
│
├── agents/                  # Unidad Popola (Python)
│   ├── popola.py            # Pipeline principal de extracción y redacción
│   └── requirements.txt
│
├── backend/                 # Unidad Devola (Node.js)
│   ├── index.js             # Entry point — Express + conexión DB
│   ├── routes/
│   │   └── analyze.js       # POST /api/analyze
│   ├── services/
│   │   ├── popolaService.js # Spawna el proceso Python
│   │   └── notaService.js   # Operaciones MongoDB
│   ├── models/
│   │   ├── Nota.js          # Schema del documento principal
│   │   ├── Usuario.js       # Schema de editores (Devola)
│   │   └── Compilacion.js   # Schema de análisis cruzados
│   ├── test.html            # Cliente de prueba visual
│   └── package.json
│
├── PREVIEW-CLASSIFIED/      # Borradores y salidas de prueba del frontend
│   └── ...                  # Prototipos visuales, mockups y outputs generados
│                            # durante el desarrollo de La Biblioteca.
│                            # No forman parte del sistema en producción.
│
├── .env                     # ⚠️ NO commitear — credenciales locales
├── .gitignore
├── LICENSE
└── README.md
```

---

## Seguridad

Las credenciales (`GENAI_API_KEY`, `DB_URL`) se manejan exclusivamente mediante variables de entorno y nunca se exponen en el código fuente ni en el historial de Git. El archivo `.env` está explícitamente excluido del control de versiones.

---

## Licencia

MIT License — Copyright (c) 2026 DamagedGhost.

Se concede permiso sin cargo para usar, copiar, modificar y distribuir este software bajo las condiciones de inclusión del aviso de derechos de autor. El software se distribuye "tal cual", sin garantía de ningún tipo.
