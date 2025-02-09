import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getClassLevels, getSubjects, getChapters } from '@/lib/api';
import { ClassLevelModel, SubjectModel, ChapterModel, Difficulty } from '@/types';

interface FiltersProps {
  onFilterChange: (filters: {
    classLevels: string[];
    subjects: string[];
    chapters: string[];
    difficulties: Difficulty[];
  }) => void;
}

type FilterCategories = {
  classLevels: string[];
  subjects: string[];
  chapters: string[];
  difficulties: Difficulty[];
};

export const Filters: React.FC<FiltersProps> = ({ onFilterChange }) => {
  const [classLevels, setClassLevels] = useState<ClassLevelModel[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [chapters, setChapters] = useState<ChapterModel[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<FilterCategories>({
    classLevels: [],
    subjects: [],
    chapters: [],
    difficulties: [],
  });

  useEffect(() => {
    loadClassLevels();
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [selectedFilters.classLevels]);

  useEffect(() => {
    loadChapters();
  }, [selectedFilters.subjects, selectedFilters.classLevels]);

  useEffect(() => {
    onFilterChange(selectedFilters);
  }, [selectedFilters]);

  const loadClassLevels = async () => {
    try {
      const data = await getClassLevels();
      setClassLevels(data);
    } catch (error) {
      console.error('Failed to load class levels:', error);
    }
  };

  const getUniqueById = <T extends { id: string }>(array: T[]): T[] => {
      return Array.from(new Map(array.map(item => [item.id, item])).values());
    };
  
    const loadSubjects = async () => {
      try {
        const data = await getSubjects(selectedFilters.classLevels);
        const uniqueSubjects = getUniqueById(data);
        setSubjects(uniqueSubjects);
      } catch (error) {
        console.error('Failed to load subjects:', error);
      }
    };
  
    const loadChapters = async () => {
      try {
        const data = await getChapters(selectedFilters.subjects, selectedFilters.classLevels);
        const uniqueChapters = getUniqueById(data);
        setChapters(uniqueChapters);
      } catch (error) {
        console.error('Failed to load chapters:', error);
      }
    };
  



  const toggleFilter = (category: keyof FilterCategories, value: string | Difficulty) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      if (category === 'difficulties') {
        if (newFilters.difficulties.includes(value as Difficulty)) {
          newFilters.difficulties = newFilters.difficulties.filter(v => v !== value);
        } else {
          newFilters.difficulties = [...newFilters.difficulties, value as Difficulty];
        }
      } else {
        if (newFilters[category].includes(value as string)) {
          newFilters[category] = newFilters[category].filter(v => v !== value);
        } else {
          newFilters[category] = [...newFilters[category], value as string];
        }
      }
      return newFilters;
    });
  };

  const getFilterName = (category: keyof FilterCategories, id: string) => {
    const source = { classLevels, subjects, chapters };
    if (category in source) {
      const items = source[category as keyof typeof source];
      const found = items.find(item => item.id === id);
      return found ? found.name : id;
    }
    return id.charAt(0).toUpperCase() + id.slice(1);
  };

  const renderFilterCategory = (
    title: string,
    category: keyof FilterCategories,
    items: { id: string; name: string }[] | Difficulty[]
  ) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => {
          const itemId = typeof item === 'string' ? item : item.id;
          const itemName = typeof item === 'string' ? item : item.name;
          return (
            <button
              key={`${category}-${itemId}-${index}`} // Ensure unique keys
              onClick={() => toggleFilter(category, itemId)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedFilters[category].includes(itemId as any)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {itemName}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Filters</h2>
      {renderFilterCategory('Class Levels', 'classLevels', classLevels)}
      {renderFilterCategory('Subjects', 'subjects', subjects)}
      {renderFilterCategory('Chapters', 'chapters', chapters)}
      {renderFilterCategory('Difficulty', 'difficulties', ['easy', 'medium', 'hard'] as Difficulty[])}

      {Object.entries(selectedFilters).some(([_, values]) => values.length > 0) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedFilters).map(([category, values]) =>
              values.map(value => (
                <button
                  key={`${category}-${value}`}
                  onClick={() => toggleFilter(category as keyof FilterCategories, value)}
                  className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center"
                >
                  {getFilterName(category as keyof FilterCategories, value)}
                  <X className="w-4 h-4 ml-1" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
