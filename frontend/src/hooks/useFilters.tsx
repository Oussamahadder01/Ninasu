import { useState, useEffect } from 'react';
import axios from 'axios';

interface FilterData {
  classLevels: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  chapters: { id: string; name: string }[];
}

export const useFilters = () => {
  const [filterData, setFilterData] = useState<FilterData>({
    classLevels: [],
    subjects: [],
    chapters: [],
  });

  const [classLevel, setClassLevel] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [chapter, setChapter] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');

  useEffect(() => {
    const fetchClassLevels = async () => {
      try {
        const response = await axios.get('/api/class-levels/');
        setFilterData(prev => ({ ...prev, classLevels: response.data }));
      } catch (error) {
        console.error('Failed to fetch class levels:', error);
      }
    };

    fetchClassLevels();
  }, []);

  useEffect(() => {
    if (classLevel) {
      const fetchSubjects = async () => {
        try {
          const response = await axios.get(`/api/subjects/?class_level=${classLevel}`);
          setFilterData(prev => ({ ...prev, subjects: response.data }));
        } catch (error) {
          console.error('Failed to fetch subjects:', error);
        }
      };

      fetchSubjects();
    } else {
      setFilterData(prev => ({ ...prev, subjects: [] }));
      setSubject('');
    }
  }, [classLevel]);

  useEffect(() => {
    if (classLevel && subject) {
      const fetchChapters = async () => {
        try {
          const response = await axios.get(`/api/chapters/?subject=${subject}&class_level=${classLevel}`);
          setFilterData(prev => ({ ...prev, chapters: response.data }));
        } catch (error) {
          console.error('Failed to fetch chapters:', error);
        }
      };

      fetchChapters();
    } else {
      setFilterData(prev => ({ ...prev, chapters: [] }));
      setChapter('');
    }
  }, [classLevel, subject]);

  const applyFilters = async () => {
    try {
      const params: { [key: string]: string } = {};
      if (classLevel) params['class_level'] = classLevel;
      if (subject) params['subject'] = subject;
      if (chapter) params['chapter'] = chapter;
      if (difficulty) params['difficulty'] = difficulty;

      const response = await axios.get('/api/exercises/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to apply filters:', error);
      return [];
    }
  };

  return {
    filterData,
    classLevel,
    setClassLevel,
    subject,
    setSubject,
    chapter,
    setChapter,
    difficulty,
    setDifficulty,
    applyFilters,
  };
};
