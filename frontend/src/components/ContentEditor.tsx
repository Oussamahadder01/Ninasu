import React, { useState, useEffect } from 'react';
import { getClassLevels, getSubjects, getChapters } from '@/lib/api';
import { ClassLevelModel, SubjectModel, ChapterModel, Difficulty } from '@/types';
import { useNavigate } from 'react-router-dom';
import DualPaneEditor from './editor/DualPaneEditor';
import ContentPreview from './ContentPreview';
import { 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  FileText, 
  Lightbulb, 
  ChevronRight, 
  ChevronLeft,
  Info,
  FileEdit,
  Tag,
  CheckCircle,
  Layout,
  Check,
  Menu
} from 'lucide-react';




interface ContentEditorProps {
  onSubmit: (data: any) => void;
  initialValues?: {
    title: string;
    content: string;
    class_level?: string[];
    subject?: string;
    difficulty?: Difficulty;
    chapters?: string[];
    solution_content?: string;
  };
}

const ContentEditor: React.FC<ContentEditorProps> = ({ onSubmit, initialValues = {
  title: '',
  content: '',
  class_level: [],
  subject: '',
  difficulty: 'easy',
  chapters: [],
  solution_content : ''
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
  const [solution, setSolution] = useState(initialValues.solution_content || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Step management
  const [showStepDetails, setShowStepDetails] = useState(true);
  const [showStepMenu, setShowStepMenu] = useState(false);

  // Responsive handling - hide step details on small screens
  useEffect(() => {
    const handleResize = () => {
      setShowStepDetails(window.innerWidth >= 640);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (!selectedSubject) {
      setChapters([]);
      return;
    }
    
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
      setError('Veuillez sélectionner des niveaux de classe, une matière et au moins un chapitre.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Le titre et le contenu sont obligatoires.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setError('Échec de la création du contenu. Veuillez réessayer.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const nextStep = () => {
    if (currentStep === 1 && (!title || !selectedClassLevels.length || !selectedSubject || !selectedChapters.length)) {
      setError('Veuillez remplir tous les champs avant de continuer.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentStep === 2 && !content.trim()) {
      setError('Le contenu est requis avant de continuer.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError(null);
    setCurrentStep(prev => prev + 1);
    setShowStepMenu(false);
    // Scroll to top when changing steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setShowStepMenu(false);
    // Scroll to top when changing steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToStep = (step: number) => {
    setCurrentStep(step);
    setShowStepMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case 'easy':
        return 'from-emerald-600 to-green-600';
      case 'medium':
        return 'from-amber-600 to-yellow-600';
      case 'hard':
        return 'from-red-600 to-pink-600';
      default:
        return 'from-gray-600 to-gray-500';
    }
  };

  const getDifficultyLabel = (level: string): string => {
    switch (level) {
      case 'easy':
        return 'Facile';
      case 'medium':
        return 'Moyen';
      case 'hard':
        return 'Difficile';
      default:
        return level;
    }
  };

  const getDifficultyIcon = (level: string) => {
    switch (level) {
      case 'easy':
        return <BarChart3 className="w-4 h-4" />;
      case 'medium':
        return (
          <div className="flex">
            <BarChart3 className="w-4 h-4" />
          </div>
        );
      case 'hard':
        return (
          <div className="flex">
            <BarChart3 className="w-4 h-4" />
          </div>
        );
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const steps = [
    { id: 1, title: "Informations", description: "Détails de base", icon: <Info className="w-5 h-5" /> },
    { id: 2, title: "Contenu", description: "Exercice", icon: <FileEdit className="w-5 h-5" /> },
    { id: 3, title: "Solution", description: "Correction détaillée", icon: <Lightbulb className="w-5 h-5" /> },
    { id: 4, title: "Publication", description: "Révision finale", icon: <CheckCircle className="w-5 h-5" /> }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto pt-4 sm:pt-8 lg:pt-16 pb-6 sm:pb-10 px-3 sm:px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 px-4 sm:px-6 py-3 sm:py-4 text-white">
          <h1 className="text-xl sm:text-2xl font-bold">Créer un exercice</h1>
          <p className="text-indigo-100 text-sm">Partagez votre savoir avec la communauté</p>
        </div>

        {/* Mobile Step Indicator */}
        <div className="sm:hidden p-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 1 ? 'bg-indigo-600 text-white' : 
                currentStep > 1 ? 'bg-indigo-500 text-white' : 
                'bg-gray-200 text-gray-500'
              }`}>
                {steps[currentStep - 1].icon}
              </div>
              <div>
                <p className="font-medium text-sm">{steps[currentStep - 1].title}</p>
                <p className="text-xs text-gray-500">{steps[currentStep - 1].description}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowStepMenu(!showStepMenu)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              aria-label="Menu des étapes"
              title="Menu des étapes"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          
          {/* Mobile Step Menu */}
          {showStepMenu && (
            <div className="mt-3 bg-white rounded-lg shadow-lg border border-gray-200">
              {steps.map((step) => (
                <button
                  key={step.id}
                  className={`w-full flex items-center space-x-3 p-3 text-left ${
                    currentStep === step.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                  } ${currentStep > step.id ? 'opacity-100' : (step.id > (currentStep + 1) ? 'opacity-50' : 'opacity-100')}`}
                  onClick={() => step.id <= (currentStep + 1) ? jumpToStep(step.id) : null}
                  disabled={step.id > (currentStep + 1)}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    currentStep === step.id ? 'bg-indigo-600 text-white' : 
                    currentStep > step.id ? 'bg-indigo-500 text-white' : 
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Progress Steps */}
        <div className="hidden sm:block px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 overflow-x-auto">
          <div className="flex justify-between min-w-max sm:min-w-0">
            {steps.map((step, index) => (
              <div key={step.id} className="relative flex-1 px-1 sm:px-0">
                {/* Connector line */}
                {index > 0 && (
                  <div 
                    className={`absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 ${
                      currentStep > index ? 'bg-indigo-500' : 'bg-gray-200'
                    }`} 
                    style={{ left: '-50%', right: '50%' }}
                  ></div>
                )}
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => step.id <= (currentStep + 1) ? jumpToStep(step.id) : null}
                    disabled={step.id > (currentStep + 1)}
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full mb-1 sm:mb-2 transition-colors ${
                      currentStep === step.id 
                        ? 'bg-indigo-600 text-white' 
                        : currentStep > step.id 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    } ${step.id > (currentStep + 1) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {currentStep > step.id ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : step.icon}
                  </button>
                  {showStepDetails && (
                    <div className="text-center">
                      <p className={`font-medium text-xs sm:text-sm ${currentStep === step.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-3 sm:mx-6 my-3 sm:my-4 bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 text-red-700 text-sm">
            <p>{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="p-3 sm:p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Title Input */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <label className="block text-gray-800 text-base sm:text-lg font-medium mb-2 flex items-center">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-2" />
                  Titre de l'exercice
                </label>
                <input
                  type="text"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Entrez le titre de l'exercice"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Class Levels and Subjects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Class Levels Section */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <label className="block text-gray-800 text-base sm:text-lg font-medium mb-2 flex items-center">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-2" />
                    Niveaux de classe
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {classLevels.map((level) => (
                      <div key={level.id} className="min-w-fit">
                        <button
                          type="button"
                          className={`min-h-[34px] px-3 py-1.5 text-sm rounded-full transition-all ${
                            selectedClassLevels.includes(level.id)
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                          }`}
                          onClick={() => toggleSelection(level.id, selectedClassLevels, setSelectedClassLevels)}
                        >
                          {level.name}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subjects Section */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <label className="block text-gray-800 text-base sm:text-lg font-medium mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-2" />
                    Matière
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="min-w-fit">
                        <button
                          type="button"
                          className={`min-h-[34px] px-3 py-1.5 text-sm rounded-full transition-all ${
                            selectedSubject === subject.id
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                          }`}
                          onClick={() => handleSubjectSelection(subject.id)}
                        >
                          {subject.name}
                        </button>
                      </div>
                    ))}
                    {subjects.length === 0 && (
                      <p className="text-xs sm:text-sm text-gray-500 italic">Veuillez d'abord sélectionner un niveau de classe</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Chapters and Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Chapters Section */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <label className="block text-gray-800 text-base sm:text-lg font-medium mb-2 flex items-center">
                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-2" />
                    Chapitres
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {chapters.map((chapter) => (
                      <div key={chapter.id} className="min-w-fit">
                        <button
                          type="button"
                          className={`min-h-[34px] px-3 py-1.5 text-sm rounded-full transition-all ${
                            selectedChapters.includes(chapter.id)
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                          }`}
                          onClick={() => toggleSelection(chapter.id, selectedChapters, setSelectedChapters)}
                        >
                          {chapter.name}
                        </button>
                      </div>
                    ))}
                    {chapters.length === 0 && (
                      <p className="text-xs sm:text-sm text-gray-500 italic">Veuillez d'abord sélectionner une matière</p>
                    )}
                  </div>
                </div>

                {/* Difficulty Section */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <label className="block text-gray-800 text-base sm:text-lg font-medium mb-2 flex items-center">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-2" />
                    Difficulté
                  </label>
                  <div className="space-y-2">
                    {['easy', 'medium', 'hard'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={`w-full py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg flex items-center justify-between transition-all ${
                          difficulty === level
                            ? `bg-gradient-to-r ${getDifficultyColor(level)} text-white`
                            : `bg-white text-gray-700 border border-gray-300 hover:bg-gray-100`
                        }`}
                        onClick={() => setDifficulty(level as Difficulty)}
                      >
                        <div className="flex items-center">
                          {getDifficultyIcon(level)}
                          <span className="ml-2 text-sm sm:text-base">{getDifficultyLabel(level)}</span>
                        </div>
                        {difficulty === level && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Content Writing */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                <label className="block text-gray-800 text-base sm:text-lg font-medium mb-2 flex items-center">
                  <FileEdit className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-2" />
                  Contenu de l'exercice (LaTeX supporté)
                </label>
                <p className="text-xs sm:text-sm text-gray-500 mb-2">
                  Utilisez $...$ pour les équations en ligne et $$...$$ pour les formules mathématiques.
                </p>
                <DualPaneEditor content={content} setContent={setContent} />
              </div>
            </div>
          )}

          {/* Step 3: Solution Writing */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                <label className="block text-gray-800 text-base sm:text-lg font-medium mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-2" />
                  Solution de l'exercice (LaTeX supporté)
                </label>
                <p className="text-xs sm:text-sm text-gray-500 mb-2">
                  La solution est optionnelle mais fortement recommandée. Elle aide les étudiants à vérifier leur travail.
                </p>
                <DualPaneEditor content={solution} setContent={setSolution} />
              </div>
            </div>
          )}

          {/* Step 4: Preview and Submit */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-2" />
                  Aperçu final
                </h2>
                <ContentPreview
                  title={title}
                  selectedClassLevels={classLevels.filter(level => selectedClassLevels.includes(level.id))}
                  selectedSubject={subjects.find(subject => subject.id === selectedSubject) || {} as SubjectModel}
                  selectedChapters={chapters.filter(chapter => selectedChapters.includes(chapter.id))}
                  difficulty={difficulty}
                  content={content}
                  solution={solution}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 sm:mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-200 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> 
                Précédent
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-200 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> 
                Annuler
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
              >
                Suivant 
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`flex items-center px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Publication...' : 'Publier l\'exercice'}
                <Check className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;