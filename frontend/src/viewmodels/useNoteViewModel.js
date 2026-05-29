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
        let active = true;
        const load = async () => {
            try {
                const response = await axios.get(URL_SELECT);
                if (active) {
                    setNotes(response.data.notas);
                }
            } catch (error) {
                if (active) {
                    console.error('Error fetching notes:', error);
                }
            }
        };
        load();
        return () => {
            active = false;
        };
    }, []);

    return { notes, refreshNotes: fetchNotes };
}

export default useNoteViewModel;
