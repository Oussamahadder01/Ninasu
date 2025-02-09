import React, { useState, useEffect } from 'react';
import { getClassLevels, getSubjects, getChapters } from '@/lib/api';
import { ClassLevelModel, SubjectModel, ChapterModel, Difficulty } from '@/types';
import { useNavigate } from 'react-router-dom';
import DualPaneEditor from './DualPaneEditor';

interface ContentEditorProps {
  onSubmit: (data: any) => void;
  initialValues?: {
    title: string;
    content: string;
    class_level?: string[];
    subject?: string;
    difficulty?: Difficulty;
    chapters?: string[];
  };
}

const ContentEditor: React.FC<ContentEditorProps> = ({ onSubmit, initialValues = {
  title: '',
  content: '',
  class_level: [],
  subject: '',
  difficulty: 'easy',
  chapters: [],
} }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialValues.title);
  const [content, setContent] = useState(initialValues.content);
  const [classLevels, setClassLevels] = useState<ClassLevelModel[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [chapters, setChapters] = useState<ChapterModel[]>([]);
  const [selectedClassLevels, setSelectedClassLevels] = useState<string[]>(initialValues.class_level || []);
  const [selectedSubject, setSelectedSubject] = useState(initialValues.subject || '');
  const [selectedChapters, setSelectedChapters] = useState<string[]>(initialValues.chapters || []);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialValues.difficulty || 'easy');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<string>('');

  useEffect(() => {
    loadClassLevels();
  }, []);

  useEffect(() => {
    if (selectedClassLevels.length) loadSubjects();
  }, [selectedClassLevels]);

  useEffect(() => {
    if (selectedSubject && selectedClassLevels.length) loadChapters();
  }, [selectedClassLevels, selectedSubject]);

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
      const data = await getSubjects(selectedClassLevels);
      const uniqueSubjects = getUniqueById(data);
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadChapters = async () => {
    try {
      const data = await getChapters([selectedSubject], selectedClassLevels);
      const uniqueChapters = getUniqueById(data);
      setChapters(uniqueChapters);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    }
  };

  const toggleSelection = (id: string, selectedList: string[], setSelectedList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setSelectedList(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubjectSelection = (id: string) => {
    setSelectedSubject(prev => (prev === id ? '' : id));
  };

  const handleSubmit = async () => {
    if (!selectedClassLevels.length || !selectedSubject || !selectedChapters.length) {
      setError('Please select class levels, a subject, and at least one chapter.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit({
        title,
        content,
        class_levels: selectedClassLevels,
        subject: selectedSubject,
        difficulty,
        chapters: selectedChapters,
        solution_content: solution
      });
      console.log('Content submitted successfully');
    } catch (error) {
      console.error('Failed to create content:', error);
      setError('Failed to create content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };


  return (
    <div className="content-editor p-6 bg-white rounded-lg shadow-md">
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-6">
        <label htmlFor="title" className="block text-lg font-medium mb-2">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter the title here..."
        />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Class Levels</h3>
        <div className="flex flex-wrap gap-2">
          {classLevels.map(level => (
            <button
              key={level.id}
              onClick={() => toggleSelection(level.id, selectedClassLevels, setSelectedClassLevels)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedClassLevels.includes(level.id) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {level.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Subject</h3>
        <div className="flex flex-wrap gap-2">
          {subjects.map(subject => (
            <button
              key={subject.id}
              onClick={() => handleSubjectSelection(subject.id)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedSubject === subject.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {subject.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Chapters</h3>
        <div className="flex flex-wrap gap-2">
          {chapters.map(chapter => (
            <button
              key={chapter.id}
              onClick={() => toggleSelection(chapter.id, selectedChapters, setSelectedChapters)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedChapters.includes(chapter.id) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {chapter.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Difficulty</h3>
        <div className="flex flex-wrap gap-2">
          {['easy', 'medium', 'hard'].map(level => (
            <button
              key={level}
              onClick={() => setDifficulty(level as Difficulty)}
              className={`px-3 py-1 rounded-full text-sm ${
                difficulty === level ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Content (LaTeX)</h3>
        {/* DualPaneEditor for LaTeX input and live preview */}
        <DualPaneEditor content={content} setContent={setContent} />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Solution (LaTeX)</h3>
        {/* DualPaneEditor for LaTeX input and live preview */}
        <DualPaneEditor content={solution} setContent={setSolution} />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={handleCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className={`px-6 py-2 bg-blue-500 text-white rounded-lg ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default ContentEditor;
