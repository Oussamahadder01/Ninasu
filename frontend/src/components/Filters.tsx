import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Difficulty } from '@/types';
import { getClassLevels, getSubjects, getChapters } from '@/lib/api';
import {ClassLevelModel , SubjectModel, ChapterModel} from '@/types/index'
import { X } from 'lucide-react';

interface FiltersProps {
  onFilterChange: (filters: {
    classLevel?: string;
    subject?: string;
    tags?: string[];
    difficulty?: string;
  }) => void;
}

export const Filters: React.FC<FiltersProps> = ({ onFilterChange }) => {
  const [classLevel, setClassLevel] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();

  const [classLevels, setClassLevels] = useState<ClassLevelModel[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [chapters, setChapters] = useState<ChapterModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadClassLevels();
  }, []);

  useEffect(() => {
    if (!classLevel) {
      loadSubjects();  // Charge tous les subjects si aucun classLevel n'est sélectionné
    }
  }, [classLevel]);

  useEffect(() => {
    if (classLevel && subject) {
      loadChapters(subject, classLevel);
    } else {
      setChapters([]);
      setSelectedTags([]);
    }
  }, [classLevel, subject]);

  const loadClassLevels = async () => {
    try {
      setIsLoading(true);
      const data = await getClassLevels();
      setClassLevels(data);
    } catch (error) {
      console.error('Failed to load class levels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjects = async (classLevelId?: string) => {  // Le paramètre devient optionnel
    try {
      setIsLoading(true);
      const data = await getSubjects(classLevelId);  // On peut appeler getSubjects sans argument
      setSubjects(data);
      setSubject('');
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChapters = async (subjectId: string, classLevelId: string) => {
    try {
      setIsLoading(true);
      const data = await getChapters(subjectId, classLevelId);
      setChapters(data);
      setSelectedTags([]);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = () => {
    setIsLoading(true);
    onFilterChange({
      classLevel: classLevel || undefined,
      subject: subject || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      difficulty,
    });
    setIsLoading(false);
  };

  const clearFilters = () => {
    setClassLevel('');
    setSubject('');
    setSelectedTags([]);
    setDifficulty(undefined);
    onFilterChange({});
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4 sticky top-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters} 
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700"
        >
          Clear all
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Class Level</label>
          <select
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All</option>
            {classLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All</option>
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.name}
              </option>
            ))}
          </select>
        </div>

        {chapters.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topics</label>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <label
                  key={chapter.id}
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(chapter.id)}
                    onChange={() => toggleTag(chapter.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{chapter.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Difficulty</label>
          <select
            value={difficulty || ''}
            onChange={(e) => setDifficulty(e.target.value as Difficulty || undefined)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Selected filters summary */}
        {(classLevel || subject || selectedTags.length > 0 || difficulty) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Active filters:</h4>
            <div className="flex flex-wrap gap-2">
            {classLevel && classLevels.find(l => l.id === classLevel) && (
            <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
              {classLevels.find(l => l.id === classLevel)?.name}
              <button
                onClick={() => setClassLevel('')}
                className="ml-2 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
              {subject && subjects.find(s => s.id === subject) && (
              <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                {subjects.find(s => s.id === subject)?.name}
                <button
                  onClick={() => setSubject('')}
                  className="ml-2 hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
              {selectedTags.map(tagId => {
                const chapter = chapters.find(c => c.id === tagId);
                return chapter ? (
                  <div key={tagId} className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                    {chapter.name}
                    <button
                      onClick={() => toggleTag(tagId)}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : null;
              })}
              {difficulty && (
                <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                  {difficulty}
                  <button
                    onClick={() => setDifficulty(undefined)}
                    className="ml-2 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <Button 
          onClick={handleFilterChange} 
          className="mt-4 bg-gradient-to-r from-gray-900 to-red-900 text-white shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? 'Applying...' : 'Apply Filters'}
        </Button>
      </div>
    </div>
  );
};
