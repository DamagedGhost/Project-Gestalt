# SYSTEM ARCHITECTURE v1 — Project Gestalt

## Flujo de datos end-to-end

1. **Emil (Scraper/Ingestión)** recibe un array de URLs y extrae título + texto limpio por fuente.
2. **Popola (Analista/Redactor)** consume las fuentes purificadas, genera JSON verificado, detecta sesgos, contradicciones y redacta una noticia con citas inline.
3. **Devola (Human-in-the-Loop)** revisa la nota, valida checklist, aprueba o rechaza.
4. **La Biblioteca (Publicación)** expone solo notas con estado `publicada`.

```
URLs → Emil (scrape limpio) → Popola (IA) → MongoDB (Nota) → Devola (HitL) → La Biblioteca
```

## Endpoints API

### Auth (Unidad Devola)

**POST `/api/auth/login`**

Request:
```json
{ "email": "editor@gestalt.cl", "password": "******" }
```

Response:
```json
{
  "message": "Login exitoso.",
  "user": { "id": "64f...", "email": "editor@gestalt.cl", "nombre": "Devola", "rol": "devola" }
}
```

> Emite JWT en cookie **HttpOnly** `gestalt_token`.

**POST `/api/auth/logout`**

Response:
```json
{ "message": "Sesión cerrada." }
```

**GET `/api/auth/me`** (protegido por cookie)

Response:
```json
{
  "user": { "id": "64f...", "email": "editor@gestalt.cl", "nombre": "Devola", "rol": "devola" }
}
```

### Emil (Scraper/Ingestión)

**POST `/api/emil/ingest`** (protegido por cookie)

Request:
```json
{
  "urls": [
    "https://www.latercera.com/...",
    "https://www.biobiochile.cl/..."
  ]
}
```

Response:
```json
{
  "message": "Ingestión completada y guardada.",
  "nota_id": "64f...",
  "status": "pendiente_revision",
  "titular": "Titular sugerido",
  "fuentes_analizadas": 2,
  "fuentes_inaccesibles": [],
  "resultado": { "titular_sugerido": "...", "noticia_final": "...", "...": "..." }
}
```

### Notas (CRUD)

**GET `/api/notas`**

Query params opcionales: `status`, `limit`, `skip`, `search`, `tag`

Response:
```json
{ "notas": [ { "_id": "64f...", "titular_sugerido": "...", "status": "publicada" } ] }
```

**GET `/api/notas/:id`**

Response:
```json
{ "nota": { "_id": "64f...", "titular_sugerido": "...", "noticia_final": "..." } }
```

**POST `/api/notas`**

Request mínimo:
```json
{ "titular_sugerido": "Titulo", "noticia_final": "Texto", "status": "pendiente_revision" }
```

Response:
```json
{ "nota": { "_id": "64f...", "titular_sugerido": "Titulo", "status": "pendiente_revision" } }
```

**PUT `/api/notas/:id`** (protegido por cookie)

Campos permitidos:
```json
{
  "titular_final": "Titular editado",
  "noticia_final": "Texto corregido",
  "notas_devola": "Observaciones",
  "status": "publicada",
  "devola_checklist": [
    { "hecho": "...", "estado": "confirmado", "nota_devola": "OK" }
  ]
}
```

Response:
```json
{ "nota": { "_id": "64f...", "status": "publicada", "fecha_publicacion": "2026-05-29T..." } }
```

**DELETE `/api/notas/:id`** (protegido por cookie)

Response:
```json
{ "message": "Nota eliminada." }
```

## React — Árbol de componentes

```
App
├── Header/Nav
└── Routes
    ├── "/" → LaBiblioteca
    ├── "/login" → Login
    └── "/devola" → RequireAuth → DevolaDashboard
```

## Ejecución local (full stack)

1. **Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Popola (Python)**
   ```bash
   cd agents
   pip install -r requirements.txt
   ```

## Variables de entorno nuevas

Backend (`.env` en la raíz):
```env
JWT_SECRET="cambia-esto-en-prod"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="http://localhost:5173"
AUTH_COOKIE_NAME="gestalt_token"
```

Frontend (`frontend/.env` opcional):
```env
VITE_API_BASE_URL="http://localhost:3000/api"
```
