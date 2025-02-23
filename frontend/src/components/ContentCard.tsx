import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Trash2, Edit, Tag, Eye, User, Clock } from 'lucide-react';
import { Content, Difficulty, VoteValue } from '@/types';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { VoteButtons } from './VoteButtons';
import { InlineMath, BlockMath } from "react-katex";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {

  faChartBar,

} from '@fortawesome/free-solid-svg-icons';

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

  const handleCardClick = () => navigate(`/exercises/${content.id}`);

  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      className="content-card flex bg-white rounded-3xl shadow hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Vote Buttons */}


      {/* Content */}
<div className="flex-1 p-4">
  <div className="flex items-center justify-between">
    {/* Subject Badge */}
    <span className="bg-gradient-to-r from-red-800 to-red-600 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
      {content.subject.name}
    </span>

    {/* Difficulty and Chart Icon */}
    <div className="flex items-center gap-2"> {/* Nested flex container */}
    <FontAwesomeIcon icon={faChartBar} className={`${getDifficultyColor(content.difficulty)}`} />

      <label className={`px-7 py-0.5 rounded-full text-sm font-semibold border ${getDifficultyColor(content.difficulty)}`}>
        {content.difficulty}
      </label>
    </div>
  </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800 hover:text-red-500 mb-3 line-clamp-2 p-2">
          {content.title}
        </h2>

        {/* Content Preview */}
        <div className="prose max-w-none text-l text-gray-900 mb-2">
        {renderMathContent(content.content)}

        </div>


        {/* Tags */}
        
        {content.chapters && content.chapters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.chapters.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer: Author, Date, Views, Comments */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
          <VoteButtons
          initialVotes={content.vote_count}
          onVote={(value) => onVote(content.id, value)}
          vertical = {false}
          userVote={content.user_vote}
        />
            <span className="flex items-center gap-1">
              
              <User className="w-4 h-4" />
              {content.author.username}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(content.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {content.view_count} 
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/exercises/${content.id}#comments`);
              }}
              className="flex items-center gap-1 hover:text-red-500"
            >
              <MessageSquare className="w-4 h-4" />
              {(content.comments || []).length} 
            </button>
          </div>

          {/* Edit/Delete for Author */}
          {isAuthor && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(content.id);
                }}
                className="text-gray-500 hover:text-red-800"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(content.id);
                }}
                className="text-gray-500 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
