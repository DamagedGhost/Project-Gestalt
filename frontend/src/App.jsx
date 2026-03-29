import useNoteViewModel from './viewmodels/useNoteViewModel'

function App() {
  const { notes } = useNoteViewModel();
  

  return (
    <div>
      {notes.map(note => (
        <div key={note._id}>
          <h2>{note.titular_sugerido}</h2>
          <p>{note.noticia_final}</p>
        </div>
      ))}
    </div>
  )
}

export default App
