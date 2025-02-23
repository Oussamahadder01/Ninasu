import React, { useState, useEffect } from 'react';
import { getClassLevels, getSubjects, getChapters } from '@/lib/api';
import { ClassLevelModel, SubjectModel, ChapterModel, Difficulty } from '@/types';
import { useNavigate } from 'react-router-dom';
import DualPaneEditor from './DualPaneEditor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeading,
  faLayerGroup,
  faBook,
  faBookOpen,
  faChartBar,
  faEdit,
  faLightbulb,
  faArrowRight,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import ContentPreview from './ContentPreview';

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
  const [solution, setSolution] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Step management

  // Load class levels, subjects, and chapters
  useEffect(() => {
    loadClassLevels();
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [selectedClassLevels]);

  useEffect(() => {
    loadChapters();
  }, [selectedSubject, selectedClassLevels]);

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
        solution_content: solution,
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

  const nextStep = () => {
    if (currentStep === 1 && (!title || !selectedClassLevels.length || !selectedSubject || !selectedChapters.length)) {
      setError('Please fill out all fields before proceeding.');
      return;
    }
    if (currentStep === 2 && !content.trim()) {
      setError('Content is required before proceeding.');
      return;
    }
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="max-w-full mx-auto bg-gradient-to-r from-gray-900 to-red-900 py-10 backdrop-blur-lg rounded-xl p-8 space-y-10">
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Step 1: Title, Categories, and Difficulty */}
      <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`${currentStep === stepNum ? "bg-black/20 border-gray-500/30" : "bg-gray-800/50 border-gray-700"} text-lg border rounded-lg p-4 relative`}
              >
                <div
                  className={`absolute -top-2 -left-2 w-6 h-6 rounded-full ${currentStep === stepNum ? "bg-red-800" : "bg-gray-700"} text-lg text-white flex items-center justify-center text-sm`}
                >
                  {stepNum}
                </div>
                <h3
                  className={`${currentStep === stepNum ? "text-white" : "text-gray-400"} font-medium`}
                >
                  {
                    ["Informations", "Contenu", "Métadonnées", "Publication"][
                      stepNum - 1
                    ]
                  }
                </h3>
                <p className="text-base text-gray-500">
                  {
                    [
                      "Détails de base",
                      "Exercice & Solution",
                      "Tags & Catégories",
                      "Révision finale",
                    ][stepNum - 1]
                  }
                </p>
              </div>
            ))}
          </div>

          
      {currentStep === 1 && (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">

          <div>
          <div className="h-full gap-4 bg-black/20 rounded-lg p-4">

            <label className="block text-white text-lg font-medium mb-2">
              <FontAwesomeIcon icon={faHeading} className="mr-2" />
              Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 text-lg bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-all"
              placeholder="Exercise title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          </div>

          


          
          {/* Class Levels and Subjects in one row */}
      <div className="flex space-x-4">
        {/* Class Levels Section */}
        <div className="flex-1">
          <div className="h-full gap-4 bg-black/20 rounded-lg p-4">
            <label className="block text-white text-lg font-medium mb-2">
              <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
              Class Levels
            </label>
            <div className="flex flex-wrap gap-2">
              {classLevels.map((level) => (
                <button
                  key={level.id}
                  className={`px-3 py-1 text-base rounded-full border transition-all ${
                    selectedClassLevels.includes(level.id)
                      ? "bg-white text-base text-gray-900 border-white"
                      : "bg-white/10 text-white text-base border-white/20 hover:bg-white/20"
                  }`}
                  onClick={() => toggleSelection(level.id, selectedClassLevels, setSelectedClassLevels)}
                >
                  {level.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subjects Section */}
        <div className="flex-1">
          <div className="w-full gap-4 bg-black/20 rounded-lg p-4">
          
            <label className="block text-white text-lg font-medium mb-2">
              
              <FontAwesomeIcon icon={faBook} className="mr-2" />
              Subject
            </label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  className={`px-3 py-1 text-base rounded-full border transition-all ${
                    selectedSubject === subject.id
                      ? "bg-white text-gray-900 border-white"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  }`}
                  onClick={() => handleSubjectSelection(subject.id)}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Section (below Class Levels and Subjects) */}
      <div>
        <div className="w-full gap-4 bg-black/20 rounded-lg p-4">
          <label className="block text-white text-lg font-medium mb-2">
            <FontAwesomeIcon icon={faBookOpen} className="mr-2" />
            Chapters
          </label>
          <div className="flex flex-wrap gap-2">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                className={`px-3 py-1 text-base rounded-full border transition-all ${
                  selectedChapters.includes(chapter.id)
                    ? "bg-white text-gray-900 border-white"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                }`}
                onClick={() => toggleSelection(chapter.id, selectedChapters, setSelectedChapters)}
              >
                {chapter.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Difficulty Section */}
    <div>
      <div className="w-full gap-4 bg-black/20 rounded-lg p-4">
        <div className="space-y-6">
          <label className="block text-white text-lg font-medium mb-2">
            <FontAwesomeIcon icon={faChartBar} className="mr-2" />
            Difficulty
          </label>
          <div className="space-y-2">
            {['easy', 'medium', 'hard'].map((level) => (
              <button
                key={level}
                className={`w-full py-2 px-4 rounded-lg transition-all text-left ${
                  difficulty === level
                    ? level === 'easy'
                      ? 'bg-green-600/70 text-green-200 text-base border border-green-600/70 hover:bg-green-600/70'
                      : level === 'medium'
                      ? 'bg-yellow-600/70 text-yellow-200 text-base border border-yellow-600/50 hover:bg-yellow-600/50'
                      : 'bg-red-600/70 text-red-200 border text-base border-red-600/50 hover:bg-red-600/50'
                    : level === 'easy'
                    ? 'bg-green-500/10 text-green-400 border  text-base border-green-500/20 hover:bg-green-500/20'
                    : level === 'medium'
                    ? 'bg-yellow-500/10 text-yellow-400 text-base border border-yellow-500/20 hover:bg-yellow-500/20'
                    : 'bg-red-500/10 text-red-400 border text-base border-red-500/20 hover:bg-red-500/20'
                }`}
                onClick={() => setDifficulty(level as Difficulty)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Next Button */}
    <div className="flex justify-end col-span-3">
      <button
        onClick={nextStep}
        className="px-6 py-3 bg-gradient-to-r from-gray-500 to-red-700 text-white rounded-lg hover:from-red-600 hover:to-red-800 transition-colors"
      >
        Next <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
      </button>
    </div>
  </div>
)}
          

      {/* Step 2: Content Writing */}
      {currentStep === 2 && (
        <div className="form-section space-y-6">

          <div>
            <label className="block text-lg text-white font-medium mb-2">
              <FontAwesomeIcon icon={faEdit} className="mr-2" />
              Content (LaTeX supported)
            </label>
            <DualPaneEditor content={content} setContent={setContent} />
          </div>

          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Back
            </button>
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg hover:from-red-600 hover:to-red-800 transition-colors"
            >
              Next <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Solution Writing (Optional) */}
      {currentStep === 3 && (
        <div className="form-section space-y-6">

          <div>
            <label className="block text-lg text-white font-medium mb-2">
              <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
              Solution (LaTeX supported)
            </label>
            <DualPaneEditor content={solution} setContent={setSolution} />
          </div>

          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Back
            </button>
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg hover:from-red-600 hover:to-red-800 transition-colors"
            >
              Next <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Final Step: Review and Submit */}
      {currentStep === 4 && (
  <div className="form-section space-y-6">
    <ContentPreview
      title={title}
      selectedClassLevels={classLevels.filter(level => selectedClassLevels.includes(level.id))}
      selectedSubject={subjects.find(subject => subject.id === selectedSubject) || {} as SubjectModel}
      selectedChapters={chapters.filter(chapter => selectedChapters.includes(chapter.id))}
      difficulty={difficulty}
      content={content}
      solution={solution}
    />

    <div className="flex justify-between">
      <button
        onClick={prevStep}
        className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Retour
      </button>
      <button
        onClick={handleSubmit}
        className={`px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg ${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-red-600 hover:to-red-800'
        } transition-colors`}
        disabled={isLoading}
      >
        {isLoading ? 'Submitting...' : 'Publier'}
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default ContentEditor;