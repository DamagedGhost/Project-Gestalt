import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const PRESET_URLS = [
  'https://www.latercera.com/nacional/noticia/bajas-penas-y-falta-de-especializacion-de-los-fiscales-radiografia-a-la-ley-cholito/',
  'https://www.elciudadano.com/animal/gobierno-de-kast-retiro-de-contraloria-nuevo-reglamento-de-la-ley-cholito/',
  'https://www.24horas.cl/informe-especial/investigacion/los-cimientos-inconclusos-de-la-ley-cholito',
];

function DevolaDashboard() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados para ingestión de nuevas noticias
  const [urlsInput, setUrlsInput] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');

  // Cargar notas pendientes de revisión
  const loadPendingNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/notas', {
        params: { status: 'pendiente_revision', limit: 20 },
      });
      const list = response.data.notas || [];
      const normalized = list.map((nota) => ({
        ...nota,
        titular_final: nota.titular_final || nota.titular_sugerido || '',
        notas_devola: nota.notas_devola || '',
        devola_checklist: nota.devola_checklist || [],
      }));
      setNotes(normalized);
      if (normalized.length > 0) {
        setSelectedNote((prev) => {
          if (!prev) return normalized[0];
          const found = normalized.find((n) => n._id === prev._id);
          return found || normalized[0];
        });
      } else {
        setSelectedNote(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar notas pendientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingNotes();
  }, [loadPendingNotes]);

  // Modificar campos de la nota actualmente seleccionada
  const updateCurrentField = (field, value) => {
    if (!selectedNote) return;
    const updated = { ...selectedNote, [field]: value };
    setSelectedNote(updated);
    setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
  };

  const updateChecklistItem = (index, changes) => {
    if (!selectedNote) return;
    const checklist = [...(selectedNote.devola_checklist || [])];
    checklist[index] = { ...checklist[index], ...changes };
    updateCurrentField('devola_checklist', checklist);
  };

  // Ingestión automatizada (Emil Scraper + Popola IA)
  const handleIngest = async (e) => {
    e.preventDefault();
    const rawUrls = urlsInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && u.startsWith('http'));

    if (rawUrls.length === 0) {
      setError('Por favor, ingresa al menos una URL válida (iniciando con http:// o https://).');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsIngesting(true);
    setIngestStatus('Paso 1/2: Emil purificando fuentes y extrayendo contenido limpio...');

    try {
      // Intentar primero con Emil /ingest
      setIngestStatus('Paso 2/2: Popola IA analizando hechos, contradicciones y sesgos...');
      const res = await api.post('/emil/ingest', { urls: rawUrls });

      setSuccessMsg(`✓ Nota generada con éxito: "${res.data.titular}". Ya está en la bandeja de revisión.`);
      setUrlsInput('');
      await loadPendingNotes();
      if (res.data.nota_id) {
        const newlyCreated = notes.find((n) => n._id === res.data.nota_id);
        if (newlyCreated) setSelectedNote(newlyCreated);
      }
    } catch (err) {
      // Fallback a /api/analyze si Emil tuvo dificultades de scraping de red
      try {
        setIngestStatus('Conectando directamente con análisis Popola...');
        const res2 = await api.post('/analyze', { urls: rawUrls });
        setSuccessMsg(`✓ Nota generada mediante Popola: "${res2.data.titular}". Lista para revisión.`);
        setUrlsInput('');
        await loadPendingNotes();
      } catch (err2) {
        setError(err2.response?.data?.error || err.response?.data?.error || 'Error al ejecutar la ingestión.');
      }
    } finally {
      setIsIngesting(false);
      setIngestStatus('');
    }
  };

  const handleFillPresetUrls = () => {
    setUrlsInput(PRESET_URLS.join('\n'));
  };

  // Guardar cambios sin alterar el estado pendiente
  const handleSaveDraft = async () => {
    if (!selectedNote) return;
    setError('');
    setSuccessMsg('');
    try {
      await api.put(`/notas/${selectedNote._id}`, {
        titular_final: selectedNote.titular_final,
        noticia_final: selectedNote.noticia_final,
        notas_devola: selectedNote.notas_devola,
        devola_checklist: selectedNote.devola_checklist,
        tags: selectedNote.tags,
      });
      setSuccessMsg('✓ Cambios guardados en borrador.');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron guardar los cambios.');
    }
  };

  // Aprobar y publicar directamente en La Biblioteca
  const handleApprove = async () => {
    if (!selectedNote) return;
    setError('');
    setSuccessMsg('');
    try {
      await api.put(`/notas/${selectedNote._id}`, {
        status: 'publicada',
        titular_final: selectedNote.titular_final,
        noticia_final: selectedNote.noticia_final,
        notas_devola: selectedNote.notas_devola,
        devola_checklist: selectedNote.devola_checklist,
      });
      setSuccessMsg(`✓ Nota aprobada y publicada en La Biblioteca.`);
      await loadPendingNotes();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al aprobar la nota.');
    }
  };

  // Rechazar nota
  const handleReject = async () => {
    if (!selectedNote) return;
    setError('');
    setSuccessMsg('');
    try {
      await api.put(`/notas/${selectedNote._id}`, {
        status: 'rechazada',
        notas_devola: selectedNote.notas_devola,
        devola_checklist: selectedNote.devola_checklist,
      });
      setSuccessMsg(`✕ Nota marcada como rechazada.`);
      await loadPendingNotes();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al rechazar la nota.');
    }
  };

  return (
    <div className="devola-dashboard">
      {/* ─── CABECERA DEL DASHBOARD ─────────────────────────────────────────── */}
      <header className="panel" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="panel-label">// CONSOLA EDITORIAL HUMAN-IN-THE-LOOP (HitL)</div>
          <h1 className="title" style={{ fontSize: '26px' }}>Unidad Operativa Devola</h1>
          <p className="mono" style={{ color: 'var(--fg-dim)', fontSize: '12px' }}>
            Operador activo: <strong style={{ color: 'var(--accent)' }}>{user?.nombre || 'Devola'}</strong> ({user?.email}) &nbsp;|&nbsp; Modo: POPOLA_MOCK activo
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="button ghost" onClick={loadPendingNotes} disabled={loading}>
            {loading ? 'Sincronizando...' : '⟳ Actualizar Bandeja'}
          </button>
          <Link to="/" className="button">
            Ver La Biblioteca
          </Link>
        </div>
      </header>

      {/* Alertas de retroalimentación */}
      {error && <div className="error-box mono" style={{ marginBottom: '16px' }}>{error}</div>}
      {successMsg && <div className="success-box mono" style={{ marginBottom: '16px' }}>{successMsg}</div>}

      {/* ─── SECCIÓN 1: INGESTIÓN DE NOTICIAS (EMIL + POPOLA) ──────────────── */}
      <section className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-label">// GENERADOR DE NOTICIAS CON INTELIGENCIA ARTIFICIAL</div>
        <h2 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--fg)' }}>
          Ingestión Multi-Fuente (Agentes Emil + Popola)
        </h2>
        <p className="mono" style={{ color: 'var(--fg-dim)', fontSize: '12px', marginBottom: '16px' }}>
          Pega una o más URLs de medios chilenos o internacionales (una por línea). Emil purificará el contenido y Popola redactará la nota contrastada.
        </p>

        <form onSubmit={handleIngest} className="form">
          <textarea
            rows={3}
            placeholder={`https://www.latercera.com/nacional/noticia/...\nhttps://www.elciudadano.com/...\nhttps://www.24horas.cl/...`}
            value={urlsInput}
            onChange={(e) => setUrlsInput(e.target.value)}
            disabled={isIngesting}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              className="button ghost"
              onClick={handleFillPresetUrls}
              disabled={isIngesting}
              style={{ fontSize: '11px' }}
            >
              Cargar URLs de Prueba (Preset Ley Cholito)
            </button>

            <button type="submit" className="button primary" disabled={isIngesting}>
              {isIngesting ? 'Procesando con Agentes...' : '▶ Iniciar Ingestión (Emil + Popola)'}
            </button>
          </div>

          {isIngesting && (
            <div className="panel subtle mono" style={{ padding: '12px', color: 'var(--accent)', fontSize: '12px' }}>
              <span className="status-dot"></span> {ingestStatus}
            </div>
          )}
        </form>
      </section>

      {/* ─── SECCIÓN 2: BANDEJA EDITORIAL HITL ─────────────────────────────── */}
      <div className="devola-grid">
        {/* Columna Izquierda: Cola de revisión */}
        <div className="panel" style={{ height: 'fit-content' }}>
          <div className="panel-label">// COLA PENDIENTE ({notes.length})</div>

          {notes.length === 0 ? (
            <p className="mono" style={{ fontSize: '12px', color: 'var(--fg-dim)', padding: '12px 0' }}>
              No hay notas pendientes por revisar. Puedes generar una nueva arriba.
            </p>
          ) : (
            notes.map((note) => {
              const isSelected = selectedNote?._id === note._id;
              return (
                <div
                  key={note._id}
                  className={`note-nav-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="note-nav-title">{note.titular_final || note.titular_sugerido}</div>
                  <div className="note-nav-meta">
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    <span className="note-nav-badge">
                      {note.evaluacion_verificacion?.nivel || 'PENDIENTE'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Columna Derecha: Editor Human-in-the-Loop */}
        <div className="panel">
          {!selectedNote ? (
            <div className="panel subtle mono" style={{ textAlign: 'center', padding: '40px' }}>
              <p>// SELECCIONA UNA NOTA DE LA COLA PARA REVISAR</p>
            </div>
          ) : (
            <div>
              <div className="panel-label">// REVISIÓN EDITORIAL HUMANA // ID: {selectedNote._id}</div>

              {/* Titular Editable */}
              <div style={{ marginBottom: '16px' }}>
                <label className="label">
                  <span>Titular Definitivo</span>
                  <input
                    type="text"
                    value={selectedNote.titular_final || ''}
                    onChange={(e) => updateCurrentField('titular_final', e.target.value)}
                  />
                </label>
              </div>

              {/* Cuerpo del Artículo Editable */}
              <div style={{ marginBottom: '20px' }}>
                <label className="label">
                  <span>Cuerpo de la Noticia Redactada</span>
                  <textarea
                    rows={10}
                    value={selectedNote.noticia_final || ''}
                    onChange={(e) => updateCurrentField('noticia_final', e.target.value)}
                  />
                </label>
              </div>

              {/* Checklist HitL */}
              <div style={{ marginBottom: '20px' }}>
                <div className="panel-label">// DEVOLA CHECKLIST: VERIFICACIÓN DE HECHOS</div>
                {(!selectedNote.devola_checklist || selectedNote.devola_checklist.length === 0) ? (
                  <p className="mono" style={{ fontSize: '11px', color: 'var(--fg-dim)' }}>
                    Sin ítems de checklist generados para esta nota.
                  </p>
                ) : (
                  selectedNote.devola_checklist.map((item, idx) => (
                    <div key={idx} className="hitl-checklist-item">
                      <div className="hitl-checklist-header">
                        <span className="mono" style={{ fontSize: '12px', color: 'var(--fg)' }}>
                          {item.hecho}
                        </span>
                        {item.url_respaldo && (
                          <a
                            href={item.url_respaldo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link mono"
                            style={{ fontSize: '10px' }}
                          >
                            [Ver Fuente]
                          </a>
                        )}
                      </div>
                      <div className="hitl-checklist-controls">
                        <select
                          value={item.estado || 'pendiente'}
                          onChange={(e) => updateChecklistItem(idx, { estado: e.target.value })}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="rechazado">Rechazado</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Nota editorial del operador..."
                          value={item.nota_devola || ''}
                          onChange={(e) => updateChecklistItem(idx, { nota_devola: e.target.value })}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Observaciones generales Devola */}
              <div style={{ marginBottom: '24px' }}>
                <label className="label">
                  <span>Observaciones Generales de la Operadora</span>
                  <textarea
                    rows={2}
                    placeholder="Comentarios sobre sesgos, matices o validación externa..."
                    value={selectedNote.notas_devola || ''}
                    onChange={(e) => updateCurrentField('notas_devola', e.target.value)}
                  />
                </label>
              </div>

              {/* Botones de Acción Editorial */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button type="button" className="button" onClick={handleSaveDraft}>
                  Guardar Borrador
                </button>
                <button type="button" className="button danger" onClick={handleReject}>
                  ✕ Rechazar
                </button>
                <button type="button" className="button primary" onClick={handleApprove} style={{ marginLeft: 'auto' }}>
                  ✓ Aprobar y Publicar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DevolaDashboard;
