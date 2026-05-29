import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../lib/api';

function DevolaDashboard() {
  const { user } = useOutletContext();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/notas', {
        params: { status: 'pendiente_revision', limit: 20 },
      });
      const normalized = response.data.notas.map((nota) => ({
        ...nota,
        titular_final: nota.titular_final || nota.titular_sugerido,
        notas_devola: nota.notas_devola || '',
      }));
      setNotes(normalized);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las notas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) {
        setLoading(true);
        setError('');
      }
      try {
        const response = await api.get('/notas', {
          params: { status: 'pendiente_revision', limit: 20 },
        });
        const normalized = response.data.notas.map((nota) => ({
          ...nota,
          titular_final: nota.titular_final || nota.titular_sugerido,
          notas_devola: nota.notas_devola || '',
        }));
        if (active) {
          setNotes(normalized);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.error || 'No se pudieron cargar las notas.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const updateNoteField = (id, field, value) => {
    setNotes((prev) =>
      prev.map((note) => (note._id === id ? { ...note, [field]: value } : note))
    );
  };

  const updateChecklistItem = (noteId, index, changes) => {
    setNotes((prev) =>
      prev.map((note) => {
        if (note._id !== noteId) return note;
        const checklist = [...(note.devola_checklist || [])];
        checklist[index] = { ...checklist[index], ...changes };
        return { ...note, devola_checklist: checklist };
      })
    );
  };

  const handleSave = async (note) => {
    try {
      await api.put(`/notas/${note._id}`, {
        titular_final: note.titular_final,
        noticia_final: note.noticia_final,
        notas_devola: note.notas_devola,
        devola_checklist: note.devola_checklist,
        tags: note.tags,
      });
      refreshNotes();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la nota.');
    }
  };

  const handleApprove = async (note) => {
    try {
      await api.put(`/notas/${note._id}`, {
        status: 'publicada',
        titular_final: note.titular_final,
        noticia_final: note.noticia_final,
        notas_devola: note.notas_devola,
        devola_checklist: note.devola_checklist,
      });
      refreshNotes();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo aprobar la nota.');
    }
  };

  const handleReject = async (note) => {
    try {
      await api.put(`/notas/${note._id}`, {
        status: 'rechazada',
        notas_devola: note.notas_devola,
        devola_checklist: note.devola_checklist,
      });
      refreshNotes();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo rechazar la nota.');
    }
  };

  if (loading) {
    return (
      <div className="panel subtle">
        <p className="mono">Cargando notas pendientes...</p>
      </div>
    );
  }

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="title">Unidad Devola</h1>
          <p className="subtitle mono">Operadora: {user?.nombre}</p>
        </div>
        <button className="button ghost" onClick={refreshNotes}>
          Sincronizar
        </button>
      </header>

      {error && <p className="error mono">{error}</p>}

      {notes.length === 0 ? (
        <div className="panel subtle">
          <p className="mono">No hay notas pendientes por revisión.</p>
        </div>
      ) : (
        <div className="note-grid">
          {notes.map((note) => (
            <article key={note._id} className="panel note-card">
              <div className="note-meta">
                <span className="tag mono">Pendiente</span>
                <span className="mono">
                  Nivel verificación: {note.evaluacion_verificacion?.nivel || 'n/a'}
                </span>
              </div>

              <input
                className="title-input"
                value={note.titular_final || ''}
                onChange={(event) =>
                  updateNoteField(note._id, 'titular_final', event.target.value)
                }
              />

              <textarea
                className="body-input"
                rows={8}
                value={note.noticia_final || ''}
                onChange={(event) =>
                  updateNoteField(note._id, 'noticia_final', event.target.value)
                }
              />

              <div className="section">
                <h3 className="section-title mono">Devola Checklist</h3>
                {(note.devola_checklist || []).map((item, index) => (
                  <div key={`${note._id}-${index}`} className="checklist-item">
                    <div>
                      <p className="mono">{item.hecho}</p>
                      {item.url_respaldo && (
                        <a
                          href={item.url_respaldo}
                          target="_blank"
                          rel="noreferrer"
                          className="link"
                        >
                          Fuente
                        </a>
                      )}
                    </div>
                    <div className="checklist-controls">
                      <select
                        value={item.estado || 'pendiente'}
                        onChange={(event) =>
                          updateChecklistItem(note._id, index, {
                            estado: event.target.value,
                          })
                        }
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Nota Devola"
                        value={item.nota_devola || ''}
                        onChange={(event) =>
                          updateChecklistItem(note._id, index, {
                            nota_devola: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <label className="label">
                Observaciones Devola
                <textarea
                  className="body-input"
                  rows={3}
                  value={note.notas_devola || ''}
                  onChange={(event) =>
                    updateNoteField(note._id, 'notas_devola', event.target.value)
                  }
                />
              </label>

              <div className="button-row">
                <button className="button" onClick={() => handleSave(note)}>
                  Guardar cambios
                </button>
                <button className="button danger" onClick={() => handleReject(note)}>
                  Rechazar
                </button>
                <button className="button primary" onClick={() => handleApprove(note)}>
                  Aprobar y publicar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default DevolaDashboard;
