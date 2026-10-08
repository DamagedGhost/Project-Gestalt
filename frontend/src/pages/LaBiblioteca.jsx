import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';

/**
 * Renderiza texto reemplazando citas tipo [1], [2] con enlaces interactivos.
 */
function renderTextWithCitations(text) {
  if (!text) return null;
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/\[(\d+)\]/);
    if (match) {
      const citeNum = match[1];
      return (
        <a
          key={i}
          className="cite-link mono"
          href={`#cite-${citeNum}`}
          title={`Ir a Referencia Fuente [${citeNum}]`}
        >
          [{citeNum}]
        </a>
      );
    }
    return part;
  });
}

/**
 * Limpia citas entre corchetes para resúmenes de tarjetas.
 */
function cleanSnippet(text, maxLength = 180) {
  if (!text) return '';
  const cleaned = text.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + '...';
}

/**
 * Analiza un elemento de la línea de tiempo.
 * Soporta tanto strings como objetos { fecha, evento, fuente }.
 */
function parseTimelineItem(item) {
  if (!item) return null;

  if (typeof item === 'object') {
    return {
      date: item.fecha || item.date || item.tiempo || 'REGISTRO',
      text: item.evento || item.text || item.hecho || item.descripcion || '',
      source: item.fuente || item.source || item.medio || '',
    };
  }

  if (typeof item === 'string') {
    // Formato común: "YYYY-MM-DD [HH:MM] - Evento (Fuente: Medio)"
    const match = item.match(
      /^([^-–—:]+)(?:[-–—:]\s*)(.*?)(?:\s*\((?:Fuente|fuente|Medio|medio):\s*([^)]+)\))?$/
    );
    if (match) {
      return {
        date: match[1].trim(),
        text: match[2].trim(),
        source: match[3] ? match[3].trim() : '',
      };
    }
    return {
      date: 'REGISTRO',
      text: item.trim(),
      source: '',
    };
  }

  return { date: 'REGISTRO', text: String(item), source: '' };
}

/**
 * Normaliza y valida una contradicción/disputa de versiones.
 * Filtra marcadores de posición vacíos del tipo { fuentes: [] }.
 */
function parseContradiction(c, idx) {
  if (!c || typeof c !== 'object') return null;

  const keys = Object.keys(c);
  if (
    keys.length === 1 &&
    keys[0] === 'fuentes' &&
    Array.isArray(c.fuentes) &&
    c.fuentes.length === 0
  ) {
    return null;
  }

  const label = c.punto || c.disputa || c.tema || `DISPUTA #${idx + 1}`;

  let sourceA = c.fuente_a || c.medio_a || '';
  let textA = c.afirmacion_a || c.texto_a || c.version_a || '';
  if (!sourceA && c.version_a) {
    const matchA = c.version_a.match(
      /^(?:lo que dice|según|versión\s+de)?\s*\[?([^:\]]+)\]?:\s*(.*)$/i
    );
    if (matchA) {
      sourceA = matchA[1].trim();
      textA = matchA[2].trim();
    }
  }
  if (!sourceA) sourceA = 'FUENTE / VERSIÓN A';

  let sourceB = c.fuente_b || c.medio_b || '';
  let textB = c.afirmacion_b || c.texto_b || c.version_b || '';
  if (!sourceB && c.version_b) {
    const matchB = c.version_b.match(
      /^(?:lo que dice|según|versión\s+de)?\s*\[?([^:\]]+)\]?:\s*(.*)$/i
    );
    if (matchB) {
      sourceB = matchB[1].trim();
      textB = matchB[2].trim();
    }
  }
  if (!sourceB) sourceB = 'FUENTE / VERSIÓN B';

  if (!textA && !textB && (!c.fuentes || c.fuentes.length === 0)) {
    return null;
  }

  return { label, sourceA, textA, sourceB, textB };
}

function LaBiblioteca() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const noteIdParam = searchParams.get('id');

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [activeTag, setActiveTag] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recientes'); // 'recientes' | 'veracidad' | 'controversias'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar notas desde el backend
  useEffect(() => {
    let active = true;
    const fetchNotes = async () => {
      try {
        const response = await api.get('/notas', {
          params: { status: 'publicada', limit: 40 },
        });
        if (active) {
          const list = response.data.notas || [];
          setNotes(list);

          // Si viene un ID en la URL, seleccionar esa nota
          if (noteIdParam) {
            const found = list.find((n) => n._id === noteIdParam);
            if (found) {
              setSelectedNote(found);
            }
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error || 'Error al conectar con La Biblioteca.'
          );
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
  }, [noteIdParam]);

  // Selección de nota y sincronización con URL
  const handleSelectNote = (note) => {
    setSelectedNote(note);
    if (note) {
      setSearchParams({ id: note._id });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSearchParams({});
    }
  };

  // Extraer tags únicos
  const availableTags = useMemo(() => {
    const tagsSet = new Set(['TODOS']);
    notes.forEach((n) => {
      (n.tags || []).forEach((t) => tagsSet.add(t.toUpperCase()));
    });
    return Array.from(tagsSet);
  }, [notes]);

  // Filtrado y ordenamiento tipo Blog
  const processedNotes = useMemo(() => {
    let list = [...notes];

    // Filtro por Tag
    if (activeTag !== 'TODOS') {
      list = list.filter((n) =>
        (n.tags || []).some((t) => t.toUpperCase() === activeTag)
      );
    }

    // Filtro por Búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((n) => {
        const title = (n.titular_final || n.titular_sugerido || '').toLowerCase();
        const body = (n.noticia_final || '').toLowerCase();
        return title.includes(q) || body.includes(q);
      });
    }

    // Ordenamiento
    if (sortBy === 'recientes') {
      list.sort((a, b) => {
        const dateA = new Date(a.fecha_publicacion || a.createdAt || 0);
        const dateB = new Date(b.fecha_publicacion || b.createdAt || 0);
        return dateB - dateA;
      });
    } else if (sortBy === 'veracidad') {
      const rank = { alto: 3, medio: 2, bajo: 1 };
      list.sort((a, b) => {
        const nivelA = (a.evaluacion_verificacion?.nivel || 'medio').toLowerCase();
        const nivelB = (b.evaluacion_verificacion?.nivel || 'medio').toLowerCase();
        return (rank[nivelB] || 0) - (rank[nivelA] || 0);
      });
    } else if (sortBy === 'controversias') {
      list.sort((a, b) => {
        const countA = (a.contradicciones?.length || 0) + (a.rumores_confirmados?.length || 0);
        const countB = (b.contradicciones?.length || 0) + (b.rumores_confirmados?.length || 0);
        return countB - countA;
      });
    }

    return list;
  }, [notes, activeTag, searchQuery, sortBy]);

  // Porcentaje de verificación de la nota seleccionada
  const verifPercentage = useMemo(() => {
    if (!selectedNote) return 0;
    const nivel = selectedNote.evaluacion_verificacion?.nivel?.toLowerCase();
    if (nivel === 'alto') return 90;
    if (nivel === 'medio') return 60;
    if (nivel === 'bajo') return 30;
    return 50;
  }, [selectedNote]);

  // Métricas de la red para el panel derecho en vista Blog
  const globalMetrics = useMemo(() => {
    const total = notes.length;
    const alto = notes.filter(
      (n) => n.evaluacion_verificacion?.nivel?.toLowerCase() === 'alto'
    ).length;
    const totalFuentes = notes.reduce(
      (acc, n) => acc + (n.metadata?.fuentes_analizadas || n.citas?.length || 0),
      0
    );
    return { total, alto, totalFuentes };
  }, [notes]);

  // Procesar contradicciones válidas de la nota seleccionada
  const validContradictions = useMemo(() => {
    if (!selectedNote || !selectedNote.contradicciones) return [];
    return selectedNote.contradicciones
      .map((c, i) => parseContradiction(c, i))
      .filter(Boolean);
  }, [selectedNote]);

  // Procesar items de línea de tiempo válidos
  const validTimeline = useMemo(() => {
    if (!selectedNote || !selectedNote.linea_de_tiempo_extraida) return [];
    return selectedNote.linea_de_tiempo_extraida
      .map((item) => parseTimelineItem(item))
      .filter((item) => item && (item.text || item.date));
  }, [selectedNote]);

  if (loading) {
    return (
      <div
        className="main-layout"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <div className="panel subtle mono" style={{ padding: '50px', textAlign: 'center' }}>
          <p style={{ letterSpacing: '2px', color: 'var(--accent)' }}>
            // PROTOCOLO GESTALT: CONECTANDO CON NODO CENTRAL...
          </p>
          <p style={{ color: 'var(--fg-dim)', fontSize: '12px', marginTop: '10px' }}>
            Recuperando registros periodísticos verificados de La Biblioteca...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-layout">
      {/* ─── PANEL IZQUIERDO: ARCHIVO, FILTROS Y NAVEGACIÓN ──────────────────── */}
      <aside className="panel-left">
        <div className="panel-section">
          <div className="panel-label">Filtros de Tema</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`filter-tag ${activeTag === tag ? 'active' : ''}`}
                onClick={() => {
                  setActiveTag(tag);
                  if (selectedNote) handleSelectNote(null);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Si hay una nota seleccionada, mostrar atajos del artículo */}
        {selectedNote ? (
          <div className="panel-section fade-in">
            <div className="panel-label">Nivel de Verificación</div>
            <div className="verif-bar">
              <div className="verif-label">
                <span>
                  Nivel:{' '}
                  {(selectedNote.evaluacion_verificacion?.nivel || 'N/A').toUpperCase()}
                </span>
                <span>{verifPercentage}%</span>
              </div>
              <div className="verif-track">
                <div
                  className="verif-fill"
                  style={{ width: `${verifPercentage}%` }}
                ></div>
              </div>
            </div>

            <button
              type="button"
              className="btn-back-archive"
              style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}
              onClick={() => handleSelectNote(null)}
            >
              ← Volver al Índice
            </button>
          </div>
        ) : (
          <div className="panel-section">
            <div className="panel-label">Archivo Rápido ({processedNotes.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {processedNotes.slice(0, 8).map((note) => {
                const title = note.titular_final || note.titular_sugerido;
                const nivel = (note.evaluacion_verificacion?.nivel || 'MEDIO').toUpperCase();
                return (
                  <div
                    key={note._id}
                    className="note-nav-item"
                    onClick={() => handleSelectNote(note)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="note-nav-title">{title}</div>
                    <div className="note-nav-meta">
                      <span>{nivel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* ─── CONTENIDO CENTRAL: BLOG FEED O ARTÍCULO VERIFICADO ──────────────── */}
      <main className="content">
        {error && (
          <div className="error-box mono" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {!selectedNote ? (
          /* ==================================================================== */
          /* MODO BLOG: LISTADO DE ARTÍCULOS CON BUSCADOR Y ORDENAMIENTO          */
          /* ==================================================================== */
          <div className="fade-in">
            {/* Controles de Búsqueda y Ordenamiento */}
            <div className="blog-controls">
              <div className="blog-search-row">
                <span className="blog-search-prefix">// BUSCAR:</span>
                <input
                  type="text"
                  className="blog-search-input"
                  placeholder="Filtrar por titular, palabra clave o entidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="sort-tab"
                    onClick={() => setSearchQuery('')}
                  >
                    LIMPIAR
                  </button>
                )}
              </div>

              <div className="blog-sort-row">
                <span className="blog-sort-label">Ordenar archivo:</span>
                <div className="blog-sort-tabs">
                  <button
                    type="button"
                    className={`sort-tab ${sortBy === 'recientes' ? 'active' : ''}`}
                    onClick={() => setSortBy('recientes')}
                  >
                    ⏱ Más Recientes
                  </button>
                  <button
                    type="button"
                    className={`sort-tab ${sortBy === 'veracidad' ? 'active' : ''}`}
                    onClick={() => setSortBy('veracidad')}
                  >
                    🛡 Mayor Veracidad
                  </button>
                  <button
                    type="button"
                    className={`sort-tab ${sortBy === 'controversias' ? 'active' : ''}`}
                    onClick={() => setSortBy('controversias')}
                  >
                    ⚡ Con Disputas
                  </button>
                </div>
              </div>
            </div>

            {/* Listado de Tarjetas */}
            {processedNotes.length === 0 ? (
              <div
                className="panel subtle mono"
                style={{ textAlign: 'center', padding: '60px 20px' }}
              >
                <p>// NINGÚN REGISTRO COINCIDE CON LA BÚSQUEDA</p>
                <p
                  style={{
                    color: 'var(--fg-dim)',
                    fontSize: '13px',
                    marginTop: '12px',
                  }}
                >
                  Intenta cambiar las palabras de búsqueda o el filtro de etiquetas.
                </p>
                {user && (
                  <Link
                    to="/devola"
                    className="button primary"
                    style={{ marginTop: '20px' }}
                  >
                    Ingresar a Unidad Devola
                  </Link>
                )}
              </div>
            ) : (
              <div className="blog-grid">
                {processedNotes.map((note) => {
                  const title = note.titular_final || note.titular_sugerido;
                  const dateStr = note.fecha_publicacion
                    ? new Date(note.fecha_publicacion).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Reciente';

                  const nivel = (
                    note.evaluacion_verificacion?.nivel || 'medio'
                  ).toLowerCase();
                  const verifClass =
                    nivel === 'alto'
                      ? 'badge-verif alto'
                      : nivel === 'bajo'
                      ? 'badge-verif bajo'
                      : 'badge-verif medio';

                  const verifiedFactsCount = note.hechos_verificados?.length || 0;
                  const sourcesCount =
                    note.metadata?.fuentes_analizadas || note.citas?.length || 0;
                  const contradictionsCount = (note.contradicciones || []).filter(
                    (c) => parseContradiction(c, 0) !== null
                  ).length;

                  return (
                    <article
                      key={note._id}
                      className="blog-card"
                      onClick={() => handleSelectNote(note)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSelectNote(note);
                      }}
                    >
                      <div className="blog-card-meta">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={verifClass}>
                            VERIF: {nivel.toUpperCase()}
                          </span>
                          <span className="article-badge">
                            {note.tags?.[0] || 'GESTALT'}
                          </span>
                        </div>
                        <span
                          className="mono"
                          style={{ color: 'var(--fg-dim)', fontSize: '11px' }}
                        >
                          {dateStr}
                        </span>
                      </div>

                      <h2 className="blog-card-title">{title}</h2>

                      <p className="blog-card-snippet">
                        {cleanSnippet(note.noticia_final, 220)}
                      </p>

                      <div className="blog-card-metrics">
                        <span className="metric-pill">
                          ✓ {verifiedFactsCount} hechos verificados
                        </span>
                        <span className="metric-pill">
                          📄 {sourcesCount} fuentes analizadas
                        </span>
                        {contradictionsCount > 0 && (
                          <span className="metric-pill alert">
                            ⚠️ {contradictionsCount} disputa(s) de versiones
                          </span>
                        )}
                      </div>

                      <div className="blog-card-footer mono">
                        <span style={{ color: 'var(--fg-dim)' }}>
                          ID: #{note._id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          style={{
                            color: 'var(--accent)',
                            fontWeight: 600,
                            letterSpacing: '1px',
                          }}
                        >
                          [ LEER INFORME COMPLETO → ]
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ==================================================================== */
          /* MODO ARTÍCULO: INFORME PERIODÍSTICO VERIFICADO COMPLETO               */
          /* ==================================================================== */
          <article className="fade-in">
            {/* Botón superior para volver al blog */}
            <div className="back-btn-banner">
              <button
                type="button"
                className="btn-back-archive"
                onClick={() => handleSelectNote(null)}
              >
                ← Volver al Índice de Registros
              </button>
              <span
                className="mono"
                style={{ fontSize: '11px', color: 'var(--fg-dim)' }}
              >
                GESTALT://noticia-{selectedNote._id.slice(-6).toUpperCase()}
              </span>
            </div>

            {/* Metadatos superiores */}
            <div className="article-meta">
              <span className="article-badge">
                {selectedNote.tags?.[0] || 'VERIFICADO'}
              </span>
              <span className="article-date">
                {selectedNote.fecha_publicacion
                  ? new Date(selectedNote.fecha_publicacion).toLocaleString('es-CL')
                  : 'PROTOCOLO GESTALT'}
              </span>
              <span className="article-proto">
                VERIFICACIÓN:{' '}
                {(
                  selectedNote.evaluacion_verificacion?.nivel || 'MEDIO'
                ).toUpperCase()}
              </span>
            </div>

            {/* Titular */}
            <h1 className="headline">
              {selectedNote.titular_final || selectedNote.titular_sugerido}
            </h1>

            {/* Subtítulo: Si tiene traducción japonesa específica se muestra, si no un indicador de sistema limpio */}
            {selectedNote.headline_jp ? (
              <div className="headline-jp">{selectedNote.headline_jp}</div>
            ) : (
              <div
                className="mono"
                style={{
                  fontSize: '11px',
                  color: 'var(--fg-dim)',
                  marginBottom: '16px',
                  letterSpacing: '1px',
                }}
              >
                // ARCHIVO OFICIAL DESCLASIFICADO • PROYECTO GESTALT
              </div>
            )}

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
                [POPOLA]
                <br />
                ANÁLISIS
              </div>
              <div className="alert-text">
                Verificación:{' '}
                <strong>
                  {(
                    selectedNote.evaluacion_verificacion?.nivel || 'EN REVISIÓN'
                  ).toUpperCase()}
                </strong>{' '}
                —{' '}
                {selectedNote.evaluacion_verificacion?.justificacion ||
                  'Análisis multi-fuente depurado por Popola IA y auditado bajo protocolo editorial.'}
              </div>
            </div>

            {/* Cuerpo del artículo con citas interactivas */}
            <div className="article-body">
              {(selectedNote.noticia_final || '').split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{renderTextWithCitations(paragraph)}</p>
              ))}
            </div>

            {/* ─── SECCIÓN: DISPUTA DE VERSIONES / CONTRADICCIONES ─── */}
            {validContradictions.length > 0 && (
              <>
                <div className="section-divider">
                  <div className="section-divider-label">
                    Disputa de versiones y discrepancias ({validContradictions.length})
                  </div>
                  <div className="section-divider-line"></div>
                </div>

                {validContradictions.map((contra, idx) => (
                  <div key={idx} className="contradiction-box">
                    <div className="contradiction-label">
                      DISPUTA DE VERSIONES // {contra.label}
                    </div>
                    <div className="contradiction-versions">
                      <div className="contradiction-version">
                        <div className="contradiction-source">
                          // FUENTE A: {contra.sourceA}
                        </div>
                        <div className="contradiction-text">{contra.textA}</div>
                      </div>
                      <div className="contradiction-version">
                        <div className="contradiction-source">
                          // FUENTE B: {contra.sourceB}
                        </div>
                        <div className="contradiction-text">{contra.textB}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ─── SECCIÓN: LÍNEA DE TIEMPO EXTRAÍDA ─── */}
            {validTimeline.length > 0 && (
              <>
                <div className="section-divider">
                  <div className="section-divider-label">
                    Línea de tiempo cronológica ({validTimeline.length})
                  </div>
                  <div className="section-divider-line"></div>
                </div>

                <div className="timeline">
                  {validTimeline.map((item, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-date">{item.date}</div>
                      <div className="timeline-text">{item.text}</div>
                      {item.source && (
                        <div className="timeline-src">// Fuente: {item.source}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ─── SECCIÓN: FUENTES VERIFICADAS Y CITAS ─── */}
            {selectedNote.citas && selectedNote.citas.length > 0 && (
              <>
                <div className="section-divider">
                  <div className="section-divider-label">
                    Fuentes periodísticas y referencias ({selectedNote.citas.length})
                  </div>
                  <div className="section-divider-line"></div>
                </div>

                <div className="sources-list">
                  {selectedNote.citas.map((cita) => (
                    <div
                      key={cita.indice}
                      id={`cite-${cita.indice}`}
                      className="source-item"
                    >
                      <div className="source-index">{cita.indice}</div>
                      <div className="source-info" style={{ flex: 1 }}>
                        <div className="source-medium">
                          {cita.medio || 'MEDIO PERIODÍSTICO'}
                        </div>
                        <div className="source-fragment">
                          {cita.fragmento_relevante || cita.fragmento || cita.texto}
                        </div>
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
          <div
            className="panel-section"
            style={{ padding: '0 0 16px', borderBottom: '1px solid var(--border)' }}
          >
            <div className="panel-label">Acceso Operador</div>
            <Link to="/devola" className="button primary" style={{ width: '100%' }}>
              Abrir en Devola HitL
            </Link>
          </div>
        )}

        {!selectedNote ? (
          /* Métricas Globales del Nodo */
          <div className="fade-in">
            <div className="panel-label" style={{ marginTop: '8px' }}>
              Estado del Archivo
            </div>
            <div className="meta-row">
              <div className="meta-key">Nodos Activos</div>
              <div className="meta-val" style={{ color: 'var(--green)' }}>
                EN LÍNEA
              </div>
            </div>
            <div className="meta-row">
              <div className="meta-key">Registros Totales</div>
              <div className="meta-val">{globalMetrics.total}</div>
            </div>
            <div className="meta-row">
              <div className="meta-key">Alta Veracidad</div>
              <div className="meta-val" style={{ color: 'var(--green)' }}>
                {globalMetrics.alto}
              </div>
            </div>
            <div className="meta-row">
              <div className="meta-key">Fuentes Procesadas</div>
              <div className="meta-val">{globalMetrics.totalFuentes}</div>
            </div>
          </div>
        ) : (
          /* Métricas Específicas de la Nota Seleccionada */
          <div className="fade-in">
            <div className="panel-label" style={{ marginTop: '8px' }}>
              Evaluación Popola
            </div>
            <div className="eval-box">
              <div className="eval-level">
                <div className="eval-level-label">Nivel</div>
                <div className="eval-level-value">
                  {(
                    selectedNote?.evaluacion_verificacion?.nivel || 'N/A'
                  ).toUpperCase()}
                </div>
              </div>
              <div className="eval-justification">
                {selectedNote?.evaluacion_verificacion?.justificacion ||
                  'Sin evaluación detallada para este registro.'}
              </div>
            </div>

            <div className="panel-label" style={{ marginTop: '16px' }}>
              Métricas de Hechos
            </div>
            <div className="meta-row">
              <div className="meta-key">Hechos Verificados</div>
              <div className="meta-val">
                {selectedNote?.hechos_verificados?.length || 0}
              </div>
            </div>
            <div className="meta-row">
              <div className="meta-key">Fuente Única</div>
              <div className="meta-val">
                {selectedNote?.hechos_fuente_unica?.length || 0}
              </div>
            </div>
            <div className="meta-row">
              <div className="meta-key">Rumores Confirmados</div>
              <div className="meta-val">
                {selectedNote?.rumores_confirmados?.length || 0}
              </div>
            </div>
            <div className="meta-row">
              <div className="meta-key">Fuentes Analizadas</div>
              <div className="meta-val">
                {selectedNote?.metadata?.fuentes_analizadas ||
                  selectedNote?.citas?.length ||
                  0}
              </div>
            </div>

            {/* Sesgo Editorial por Fuente */}
            {selectedNote?.sesgo_por_fuente &&
              selectedNote.sesgo_por_fuente.length > 0 && (
                <>
                  <div className="panel-label" style={{ marginTop: '20px' }}>
                    Sesgo Editorial por Fuente
                  </div>
                  {selectedNote.sesgo_por_fuente.map((sesgo, idx) => {
                    const mediumName = sesgo.fuente || sesgo.medio || `FUENTE #${idx + 1}`;
                    const biasDetected =
                      sesgo.sesgo_detectado ||
                      sesgo.enfoque_predominante ||
                      'Sin sesgo detectable.';
                    const omissions =
                      sesgo.hechos_omitidos || sesgo.omisiones_relevantes;

                    return (
                      <div
                        key={idx}
                        style={{
                          marginBottom: '12px',
                          fontSize: '11px',
                          borderBottom: '1px solid var(--border)',
                          paddingBottom: '8px',
                        }}
                      >
                        <div
                          style={{
                            color: 'var(--accent)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            marginBottom: '2px',
                          }}
                        >
                          {mediumName}
                        </div>
                        {sesgo.tipo_sesgo && sesgo.tipo_sesgo !== 'ninguno' && (
                          <div
                            style={{
                              color: 'var(--yellow)',
                              marginBottom: '2px',
                              fontSize: '10px',
                            }}
                          >
                            [{sesgo.tipo_sesgo}]
                          </div>
                        )}
                        <div style={{ color: 'var(--fg-dim)', marginBottom: '2px' }}>
                          <strong style={{ color: 'var(--fg)' }}>Enfoque:</strong>{' '}
                          {biasDetected}
                        </div>
                        {omissions && omissions !== 'ninguno' && (
                          <div style={{ color: 'var(--fg-dim)' }}>
                            <strong style={{ color: 'var(--fg)' }}>Omisiones:</strong>{' '}
                            {omissions}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
          </div>
        )}

        <div className="panel-label" style={{ marginTop: '20px' }}>
          Protocolo
        </div>
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
