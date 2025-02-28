import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Trash2, Edit, Tag, Eye, User, Clock, GraduationCap, BarChart3 } from 'lucide-react';
import { Content, Difficulty, VoteValue } from '@/types';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { VoteButtons } from './VoteButtons';
import TipTapRenderer from '@/components/editor/TipTapRenderer'; // Import our new component

import '@/lib/styles.css';

interface ContentCardProps {
  content: Content;
  onVote: (id: string, value: VoteValue) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onVote,
  onDelete,
  onEdit,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthor = user?.id === content.author.id;

  const handleCardClick = () => {
    // Check if any text is selected
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // User is selecting text, do not navigate
      return;
    }
    // Navigate to the exercise page
    navigate(`/exercises/${content.id}`);
  };
  
  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case 'easy':
        return 'from-emerald-600 to-green-600 text-white';
      case 'medium':
        return 'from-amber-600 to-yellow-600 text-white';
      case 'hard':
        return 'from-red-600 to-pink-600 text-white';
      default:
        return 'from-gray-600 to-gray-500 text-white';
    }
  };
  
  const getDifficultyIcon = (difficulty: Difficulty) => {
    switch (difficulty) {
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
    <div
      className="content-card bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 group overflow-hidden cursor-pointer break-words border border-gray-200 hover:border-indigo-200 transform hover:-translate-y-1"
      onClick={handleCardClick}
    >
      <div className="flex flex-col h-full">
        {/* Header with title and difficulty - now with better mobile layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 gap-2">
          {/* Title - full width on mobile */}
          <h2 className="text-xl font-bold text-gray-800 line-clamp-2 group-hover:text-indigo-700 transition-colors">
            {content.title}
          </h2>

          {/* Difficulty - will appear below title on mobile */}
          <span className={`bg-gradient-to-r ${getDifficultyColor(content.difficulty)} px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center space-x-1 self-start sm:self-auto`}>
            {getDifficultyIcon(content.difficulty)}
            <span>{getDifficultyLabel(content.difficulty)}</span>
          </span>
        </div>
        
        {/* Tags for chapters, class levels, and subject - improved wrapping */}
        <div className="p-3 px-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {/* Subject Badge */}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
              {content.subject.name}
            </span>
            
            {/* Class Level Badge */}
            {content.class_levels && (
              <div className="flex flex-wrap gap-2">
                {content.class_levels.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 hover:bg-indigo-50 hover:border-indigo-300 transition-colors duration-200"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{tag.name}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Chapter Tags */}
            {content.chapters && content.chapters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {content.chapters.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    <Tag className="w-3 h-3 mr-1.5" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Content area - with compact sizing */}
        <div className="p-3 sm:p-5">
          {/* Content Preview with TipTap renderer instead of regex */}
          <div className="prose max-w-none text-l text-gray-900 break-words">
            <TipTapRenderer content={content.content} />
          </div>
        </div>
        
        {/* Footer with metadata and actions - responsive but keeps original desktop layout */}
        <div className="bg-gray-50 px-3 sm:px-5 py-3 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            {/* Left side: Votes and metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-500 mb-3 sm:mb-0">
              {/* Votes - wrapped in a div to maintain natural width */}
              <div className="self-start inline-flex">
                <VoteButtons
                  initialVotes={content.vote_count}
                  onVote={(value) => onVote(content.id, value)}
                  vertical={false}
                  userVote={content.user_vote}
                  size="sm"
                />
              </div>
              
              {/* Metadata - wrap for mobile, flex row for desktop */}
              <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 mt-2 sm:mt-0">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="truncate">{content.author.username}</span>
                </span>
                
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{new Date(content.created_at).toLocaleDateString()}</span>
                </span>
                
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{content.view_count}</span>
                </span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/exercises/${content.id}#comments`);
                  }}
                  className="flex items-center gap-1.5 hover:text-indigo-700 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{(content.comments || []).length}</span>
                </button>
              </div>
            </div>
            
            {/* Right side: Author actions - preserve desktop hover behavior */}
            {isAuthor && (
              <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(content.id);
                  }}
                  className="text-gray-500 hover:text-indigo-700 px-2 sm:px-3"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  <span>Edit</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(content.id);
                  }}
                  className="text-gray-500 hover:text-red-600 px-2 sm:px-3"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Delete</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};