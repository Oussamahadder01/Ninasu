import React from 'react';
import { ClassLevelModel, SubjectModel, ChapterModel, Difficulty } from '@/types';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { 
  BookOpen, 
  GraduationCap, 
  Tag, 
  BarChart3, 
  User, 
  Calendar, 
  Lightbulb,
  Check,
  AlertTriangle
} from 'lucide-react';

import TipTapRenderer from './editor/TipTapRenderer';

interface ContentPreviewProps {
  title: string;
  selectedClassLevels: ClassLevelModel[];
  selectedSubject: SubjectModel;
  selectedChapters: ChapterModel[];
  difficulty: Difficulty;
  content: string;
  solution: string;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  title,
  selectedClassLevels,
  selectedSubject,
  selectedChapters,
  difficulty,
  content,
  solution,
}) => {
  const renderMathContent = (text: string) => {
    if (!text) return null;
    
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        try {
          return (
            <div key={index} className="my-4 text-center">
              <BlockMath math={part.slice(2, -2)} />
            </div>
          );
        } catch (error) {
          return <div key={index} className="text-red-500">Erreur dans l'équation: {part}</div>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        try {
          return <InlineMath key={index} math={part.slice(1, -1)} />;
        } catch (error) {
          return <span key={index} className="text-red-500">Erreur: {part}</span>;
        }
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };
  

  const getDifficultyColor = (level: Difficulty): string => {
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
  
  const getDifficultyLabel = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case 'easy':
        return 'Facile';
      case 'medium':
        return 'Moyen';
      case 'hard':
        return 'Difficile';
      default:
        return difficulty;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header with title and metadata */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          
          <div className="flex flex-wrap gap-3">
            {/* Subject */}
            {selectedSubject && selectedSubject.name && (
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                {selectedSubject.name}
              </span>
            )}
            
            {/* Class Levels */}
            {selectedClassLevels.length > 0 && (
              <span className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5" />
                {selectedClassLevels.map(level => level.name).join(', ')}
              </span>
            )}
            
            {/* Difficulty */}
            <span 
              className={`bg-gradient-to-r ${getDifficultyColor(difficulty)} px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center gap-2`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              {getDifficultyLabel(difficulty)}
            </span>
          </div>
          
          {/* Chapters */}
          {selectedChapters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {selectedChapters.map(chapter => (
                <span 
                  key={chapter.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  <Tag className="w-3 h-3 mr-1.5" />
                  {chapter.name}
                </span>
              ))}
            </div>
          )}
          
          {/* Author and Date (mockup) */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>Vous</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Aujourd'hui</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button className="px-5 py-3 border-b-2 border-indigo-600 text-indigo-700 font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Exercice
          </button>
          {solution && (
            <button className="px-5 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Solution
            </button>
          )}
        </div>
      </div>
      
      {/* Exercise Content */}
      <div className="p-6 bg-white">
        <div className="prose max-w-none">

        </div>
      </div>
      
      {/* Solution Preview (if available) */}
      {solution ? (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-800">Aperçu de la solution</h3>
          </div>
          <div className="prose max-w-none">
          <TipTapRenderer content={solution} />

          </div>
        </div>
      ) : (
        <div className="p-6 bg-amber-50 border-t border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800 mb-1">Solution non fournie</h3>
            <p className="text-sm text-amber-700">
              Vous n'avez pas ajouté de solution à cet exercice. Nous vous recommandons d'en ajouter une pour aider les utilisateurs à vérifier leur travail.
            </p>
          </div>
        </div>
      )}
      
      {/* Final Review Checklist */}
    </div>
  );
};

// Helper component for checklist items
export default ContentPreview;