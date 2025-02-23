import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Tag, Eye, User, Clock } from 'lucide-react';
import { Content, VoteValue, Difficulty } from '@/types';
import { VoteButtons } from './VoteButtons';
import { InlineMath } from "react-katex";
import { truncateText } from '@/lib/utils';

interface HomeContentCardProps {
  content: Content;
  onVote: (id: string, value: VoteValue) => void;
}

export const HomeContentCard: React.FC<HomeContentCardProps> = ({
  content,
  onVote,
}) => {
  const navigate = useNavigate();

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

  const renderMathContent = (text: string) => {
    const parts = text.split(/(\$.*?\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={index} math={part.slice(1, -1)} />;
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div
      className="home-content-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Header: Subject and Difficulty */}
        <div className="flex items-center justify-between mb-3">
          <span className="bg-gradient-to-l from-red-200 to-gray-400 text-black px-2 py-1 rounded-bl-2xl font-medium text-sm">
            {content.subject.name}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(content.difficulty)}`}>
            {content.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-800 hover:text-red-500 mb-3 line-clamp-2">
          {content.title}
        </h3>

        {/* Content Preview */}
        <div className="prose max-w-none text-sm text-gray-600 mb-4 line-clamp-3">
          {renderMathContent(truncateText(content.content, 150))}
        </div>

        {/* Tags */}
        {content.chapters && content.chapters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.chapters.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag.name}
              </span>
            ))}
            {content.chapters.length > 2 && (
              <span className="text-xs text-gray-500">+{content.chapters.length - 2} more</span>
            )}
          </div>
        )}

        {/* Footer: Author, Date, Views, Comments */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {content.author.username}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(content.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {content.view_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {(content.comments || []).length}
            </span>
          </div>
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
        <VoteButtons
          initialVotes={content.vote_count}
          onVote={(value) => onVote(content.id, value)}
          vertical={false}
          userVote={content.user_vote}
        />
        <button
          className="text-sm text-red-600 hover:text-red-700 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/exercises/${content.id}`);
          }}
        >
          Voir plus
        </button>
      </div>
    </div>
  );
};
