import { ChapterModel, ClassLevelModel, SubjectModel } from '@/types';
import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

// Function to render math content
const renderMathContent = (text: string) => {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      // Display math (centered)
      return (
        <div key={index} className="my-2 text-center">
          <BlockMath math={part.slice(2, -2)} />
        </div>
      );
    } else if (part.startsWith('$') && part.endsWith('$')) {
      // Inline math (left-aligned)
      return <InlineMath key={index} math={part.slice(1, -1)} />;
    } else {
      // Regular text
      return <span key={index}>{part}</span>;
    }
  });
};

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-600/70 text-green-200 border-green-600/70';
    case 'medium':
      return 'bg-orange-600/70 text-orange-200 border-orange-600/50';
    case 'hard':
      return 'bg-red-600/70 text-red-200 border-red-600/50';
    default:
      return 'bg-gray-600/70 text-gray-200 border-gray-600/50';
  }
};

interface ContentPreviewProps {
  title: string;
  selectedClassLevels: ClassLevelModel[];
  selectedSubject: SubjectModel;
  selectedChapters: ChapterModel[];
  difficulty: string;
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
  return (
    <div className="bg-black/20 border border-gray-700 rounded-lg p-6 space-y-6">
      {/* Header: Subject and Difficulty */}
      <div className="flex items-center justify-between">
        <span className="bg-gradient-to-l from-red-200 to-gray-400 text-black px-2 py-1 rounded-bl-2xl font-medium">
          {selectedSubject.name}
        </span>
        <span className={`px-4 py-0.5 rounded-full text-sm font-semibold border ${getDifficultyColor(difficulty)}`}>
          {difficulty}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-white">{title}</h2>

      {/* Class Levels */}
      <div>
        <label className="block text-gray-400 font-medium mb-1">Class Levels</label>
        <p className="text-white">{selectedClassLevels.map((class_level, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-200 border border-gray-600"
              >
                {class_level.name}
              </span> ) )}
              </p>
      </div>

      {/* Chapters */}
      {selectedChapters.length > 0 && (
        <div>
          <label className="block text-gray-400 font-medium mb-1">Chapters</label>
          <div className="flex flex-wrap gap-2">
            {selectedChapters.map((chapter, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-200 border border-gray-600"
              >
                {chapter.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="w-full gap-4 bg-black/20 rounded-lg p-4">

        <label className="block text-gray-400 font-medium mb-1">Content</label>
        <div className="prose max-w-none text-white">
          {renderMathContent(content)}
        </div>
      </div>

      {/* Solution */}
      {solution && (
              <div className="w-full gap-4 bg-black/20 rounded-lg p-4">

          <label className="block text-gray-400 font-medium mb-1">Solution</label>
          <div className="prose max-w-none text-white">
            {renderMathContent(solution)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPreview;