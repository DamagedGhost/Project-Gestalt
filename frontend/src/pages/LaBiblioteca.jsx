import { useEffect, useState } from 'react';
import api from '../lib/api';

function LaBiblioteca() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await api.get('/notas', {
          params: { status: 'publicada', limit: 30 },
        });
        if (active) {
          setNotes(response.data.notas);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.error || 'No se pudo cargar la biblioteca.');
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

  if (loading) {
    return (
      <div className="panel subtle">
        <p className="mono">Cargando Biblioteca...</p>
      </div>
    );
  }

  return (
    <section className="biblioteca">
      <header className="dashboard-header">
        <div>
          <h1 className="title">La Biblioteca</h1>
          <p className="subtitle mono">Archivo público verificado.</p>
        </div>
      </header>

      {error && <p className="error mono">{error}</p>}

      {notes.length === 0 ? (
        <div className="panel subtle">
          <p className="mono">No hay notas publicadas aún.</p>
        </div>
      ) : (
        <div className="note-grid">
          {notes.map((note) => (
            <article key={note._id} className="panel note-card">
              <div className="note-meta">
                <span className="tag mono">Publicado</span>
                <span className="mono">
                  {note.fecha_publicacion
                    ? new Date(note.fecha_publicacion).toLocaleDateString()
                    : 'Fecha no disponible'}
                </span>
              </div>
              <h2 className="title">{note.titular_final || note.titular_sugerido}</h2>
              <p className="mono small">
                Verificación: {note.evaluacion_verificacion?.nivel || 'n/a'}
              </p>
              <div className="article-text">
                {(note.noticia_final || '').split('\n\n').map((paragraph, index) => (
                  <p key={`${note._id}-p-${index}`}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default LaBiblioteca;
