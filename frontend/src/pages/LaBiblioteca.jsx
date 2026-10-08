import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';

function renderTextWithCitations(text) {
  if (!text) return null;
  // Divide el texto por las citas estilo [1], [2], etc.
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/\[(\d+)\]/);
    if (match) {
      const citeNum = match[1];
      return (
        <a key={i} className="cite-link mono" href={`#cite-${citeNum}`} title={`Ir a Fuente [${citeNum}]`}>
          [{citeNum}]
        </a>
      );
    }
    return part;
  });
}

function LaBiblioteca() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [activeTag, setActiveTag] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchNotes = async () => {
      try {
        const response = await api.get('/notas', {
          params: { status: 'publicada', limit: 30 },
        });
        if (active) {
          const list = response.data.notas || [];
          setNotes(list);
          if (list.length > 0) {
            setSelectedNote(list[0]);
          }
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.error || 'Error al conectar con La Biblioteca.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchNotes();
    return () => {
      active = false;
    };
  }, []);

  // Extraer etiquetas únicas para el filtro
  const availableTags = useMemo(() => {
    const tagsSet = new Set(['TODOS']);
    notes.forEach((n) => {
      (n.tags || []).forEach((t) => tagsSet.add(t.toUpperCase()));
    });
    return Array.from(tagsSet);
  }, [notes]);

  // Filtrar notas por etiqueta seleccionada
  const filteredNotes = useMemo(() => {
    if (activeTag === 'TODOS') return notes;
    return notes.filter((n) =>
      (n.tags || []).some((t) => t.toUpperCase() === activeTag)
    );
  }, [notes, activeTag]);

  // Calcular porcentaje de verificación
  const verifPercentage = useMemo(() => {
    if (!selectedNote) return 0;
    const nivel = selectedNote.evaluacion_verificacion?.nivel?.toUpperCase();
    if (nivel === 'ALTO') return 88;
    if (nivel === 'MEDIO') return 64;
    if (nivel === 'BAJO') return 32;
    return 50;
  }, [selectedNote]);

  if (loading) {
    return (
      <div className="main-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="panel subtle mono" style={{ padding: '40px', textAlign: 'center' }}>
          <p>// CONECTANDO CON NODO GESTALT...</p>
          <p style={{ color: 'var(--fg-dim)', fontSize: '12px', marginTop: '8px' }}>
            Recuperando archivo verificado de La Biblioteca...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-layout">
      {/* ─── PANEL IZQUIERDO: ÍNDICE Y FILTROS ───────────────────────────────── */}
      <aside className="panel-left">
        <div className="panel-section">
          <div className="panel-label">Archivo de Noticias</div>
          {filteredNotes.length === 0 ? (
            <p className="mono" style={{ fontSize: '11px', color: 'var(--fg-dim)' }}>
              No hay notas disponibles en esta categoría.
            </p>
          ) : (
            filteredNotes.map((note) => {
              const isActive = selectedNote?._id === note._id;
              const title = note.titular_final || note.titular_sugerido;
              const dateStr = note.fecha_publicacion
                ? new Date(note.fecha_publicacion).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                  })
                : 'Reciente';

              return (
                <div
                  key={note._id}
                  className={`note-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="note-nav-title">{title}</div>
                  <div className="note-nav-meta">
                    <span>{dateStr}</span>
                    <span className="note-nav-badge">
                      {note.evaluacion_verificacion?.nivel || 'VERIF'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="panel-section">
          <div className="panel-label">Índice Verificación</div>
          <div className="verif-bar">
            <div className="verif-label">
              <span>Nivel: {selectedNote?.evaluacion_verificacion?.nivel || 'N/A'}</span>
              <span>{verifPercentage}%</span>
            </div>
            <div className="verif-track">
              <div className="verif-fill" style={{ width: `${verifPercentage}%` }}></div>
            </div>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-label">Filtros de Tema</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`filter-tag ${activeTag === tag ? 'active' : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── CONTENIDO CENTRAL: NOTICIA VERIFICADA ─────────────────────────── */}
      <main className="content">
        {error && <div className="error-box mono" style={{ marginBottom: '20px' }}>{error}</div>}

        {!selectedNote ? (
          <div className="panel subtle mono" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p>// NO SE ENCONTRARON ARTÍCULOS PUBLICADOS</p>
            <p style={{ color: 'var(--fg-dim)', fontSize: '13px', marginTop: '12px' }}>
              Puedes ingresar a la Unidad Devola para generar o aprobar nuevas notas periodísticas.
            </p>
            <Link to="/devola" className="button primary" style={{ marginTop: '20px' }}>
              Ir a Unidad Devola
            </Link>
          </div>
        ) : (
          <article>
            {/* Metadatos superiores */}
            <div className="article-meta">
              <span className="article-badge">{selectedNote.tags?.[0] || 'VERIFICADO'}</span>
              <span className="article-date">
                {selectedNote.fecha_publicacion
                  ? new Date(selectedNote.fecha_publicacion).toLocaleString('es-CL')
                  : 'PROTOCOLO GESTALT'}
              </span>
              <span className="article-proto">
                GESTALT://noticia-{selectedNote._id.slice(-6).toUpperCase()}
              </span>
            </div>

            {/* Titular */}
            <h1 className="headline">{selectedNote.titular_final || selectedNote.titular_sugerido}</h1>
            <div className="headline-jp">
              {selectedNote.headline_jp || 'プロジェクト・ゲシュタルト // 検証済みジャーナリズム'}
            </div>

            {/* Tags */}
            <div className="tags-row">
              {(selectedNote.tags || []).map((tag, i) => (
                <span key={i} className="tag">
                  {tag}
                </span>
              ))}
            </div>

            {/* Alert Box Popola */}
            <div className="alert-box">
              <div className="alert-icon">
                [POPOLA]<br />ANÁLISIS
              </div>
              <div className="alert-text">
                Verificación: <strong>{selectedNote.evaluacion_verificacion?.nivel || 'EN REVISIÓN'}</strong> —{' '}
                {selectedNote.evaluacion_verificacion?.justificacion ||
                  'Análisis automatizado multi-fuente por Popola IA verificado por protocolo.'}
              </div>
            </div>

            {/* Cuerpo del artículo con citas interactivas */}
            <div className="article-body">
              {(selectedNote.noticia_final || '').split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{renderTextWithCitations(paragraph)}</p>
              ))}
            </div>

            {/* Contradicciones detectadas */}
            {selectedNote.contradicciones && selectedNote.contradicciones.length > 0 && (
              <>
                <div className="section-divider">
                  <div className="section-divider-label">Contradicciones detectadas</div>
                  <div className="section-divider-line"></div>
                </div>

                {selectedNote.contradicciones.map((contra, idx) => (
                  <div key={idx} className="contradiction-box">
                    <div className="contradiction-label">
                      DISPUTA DE VERSIONES // {contra.disputa || `DISPUTA #${idx + 1}`}
                    </div>
                    <div className="contradiction-versions">
                      <div className="contradiction-version">
                        <div className="contradiction-source">// FUENTE A: {contra.fuente_a || 'Versión A'}</div>
                        <div className="contradiction-text">{contra.afirmacion_a || contra.texto_a}</div>
                      </div>
                      <div className="contradiction-version">
                        <div className="contradiction-source">// FUENTE B: {contra.fuente_b || 'Versión B'}</div>
                        <div className="contradiction-text">{contra.afirmacion_b || contra.texto_b}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Línea de tiempo */}
            {selectedNote.linea_de_tiempo_extraida && selectedNote.linea_de_tiempo_extraida.length > 0 && (
              <>
                <div className="section-divider">
                  <div className="section-divider-label">Línea de tiempo</div>
                  <div className="section-divider-line"></div>
                </div>

                <div className="timeline">
                  {selectedNote.linea_de_tiempo_extraida.map((item, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-date">{item.fecha}</div>
                      <div className="timeline-text">{item.evento}</div>
                      {item.fuente && <div className="timeline-src">// {item.fuente}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Fuentes verificadas */}
            {selectedNote.citas && selectedNote.citas.length > 0 && (
              <>
                <div className="section-divider">
                  <div className="section-divider-label">Fuentes verificadas</div>
                  <div className="section-divider-line"></div>
                </div>

                <div className="sources-list">
                  {selectedNote.citas.map((cita) => (
                    <div key={cita.indice} id={`cite-${cita.indice}`} className="source-item">
                      <div className="source-index">{cita.indice}</div>
                      <div className="source-info" style={{ flex: 1 }}>
                        <div className="source-medium">{cita.medio || 'MEDIO PERIODÍSTICO'}</div>
                        <div className="source-fragment">{cita.fragmento || cita.texto}</div>
                        {cita.url && (
                          <a
                            className="source-url"
                            href={cita.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {cita.url}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </article>
        )}
      </main>

      {/* ─── PANEL DERECHO: MÉTRICAS Y EVALUACIÓN ─────────────────────────── */}
      <aside className="panel-right">
        {user && (
          <div className="panel-section" style={{ padding: '0 0 16px', borderBottom: '1px solid var(--border)' }}>
            <div className="panel-label">Acceso Operador</div>
            <Link to="/devola" className="button primary" style={{ width: '100%' }}>
              Abrir en Devola HitL
            </Link>
          </div>
        )}

        <div className="panel-label" style={{ marginTop: '8px' }}>Evaluación Popola</div>
        <div className="eval-box">
          <div className="eval-level">
            <div className="eval-level-label">Nivel</div>
            <div className="eval-level-value">
              {selectedNote?.evaluacion_verificacion?.nivel || 'N/A'}
            </div>
          </div>
          <div className="eval-justification">
            {selectedNote?.evaluacion_verificacion?.justificacion ||
              'Sin evaluación disponible para este registro.'}
          </div>
        </div>

        <div className="panel-label" style={{ marginTop: '16px' }}>Métricas de Hechos</div>
        <div className="meta-row">
          <div className="meta-key">Hechos Verificados</div>
          <div className="meta-val">{selectedNote?.hechos_verificados?.length || 0}</div>
        </div>
        <div className="meta-row">
          <div className="meta-key">Fuente Única</div>
          <div className="meta-val">{selectedNote?.hechos_fuente_unica?.length || 0}</div>
        </div>
        <div className="meta-row">
          <div className="meta-key">Rumores Confirmados</div>
          <div className="meta-val">{selectedNote?.rumores_confirmados?.length || 0}</div>
        </div>
        <div className="meta-row">
          <div className="meta-key">Fuentes Analizadas</div>
          <div className="meta-val">
            {selectedNote?.metadata?.fuentes_analizadas || selectedNote?.citas?.length || 0}
          </div>
        </div>

        {selectedNote?.sesgo_por_fuente && selectedNote.sesgo_por_fuente.length > 0 && (
          <>
            <div className="panel-label" style={{ marginTop: '20px' }}>Sesgo Editorial</div>
            {selectedNote.sesgo_por_fuente.map((sesgo, idx) => (
              <div key={idx} style={{ marginBottom: '12px', fontSize: '11px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <div style={{ color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                  {sesgo.medio}
                </div>
                <div style={{ color: 'var(--fg-dim)', marginBottom: '2px' }}>
                  <strong style={{ color: 'var(--fg)' }}>Enfoque:</strong> {sesgo.enfoque_predominante}
                </div>
                {sesgo.omisiones_relevantes && (
                  <div style={{ color: 'var(--fg-dim)' }}>
                    <strong style={{ color: 'var(--fg)' }}>Omisiones:</strong> {sesgo.omisiones_relevantes}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        <div className="panel-label" style={{ marginTop: '20px' }}>Protocolo</div>
        <div className="meta-row">
          <div className="meta-key">Versión</div>
          <div className="meta-val">GESTALT v0.5.0</div>
        </div>
        <div className="meta-row">
          <div className="meta-key">Pipeline</div>
          <div className="meta-val">Emil → Popola → Devola</div>
        </div>
      </aside>
    </div>
  );
}

export default LaBiblioteca;
