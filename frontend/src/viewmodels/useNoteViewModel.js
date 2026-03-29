import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const URL_SELECT = import.meta.env.VITE_URL_SELECT;

const useNoteViewModel = () => {
    const [notes, setNotes] = useState([]);

    const fetchNotes = useCallback(async () => {
        try {
            const response = await axios.get(URL_SELECT);
            console.log(response.data.notas); // ← ¿qué forma tiene?
            setNotes(response.data.notas);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    }, []);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    return { notes, refreshNotes: fetchNotes };
}

export default useNoteViewModel;