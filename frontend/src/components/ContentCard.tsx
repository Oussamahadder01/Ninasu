import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Trash2, Edit, Tag, Eye, User, Clock } from 'lucide-react';
import { Content } from '@/types';
import { Button } from './ui/button';
import { renderLatexContent, truncateText } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { VoteButtons } from './VoteButtons';

interface ContentCardProps {
  content: Content;
  onVote: (id: string, type: 'up' | 'down' | 'none') => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onVote,
  onDelete,
  onEdit
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthor = user?.id === content.author.id;

  const handleCardClick = () => {
    navigate(`/exercises/${content.id}`);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const getDifficultyColor = (difficulty: string): string => {
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
    <div className="content-card flex bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden group cursor-pointer" onClick={handleCardClick}>
      {/* Vote buttons */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-b from-red-900 to-red-600">
        <VoteButtons
          initialVotes={(content.upvotes_count || 0) - (content.downvotes_count || 0)}
          onVote={(type) => onVote(content.id, type)}
          vertical={true}
          userVote={content.user_vote}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Header with subject and difficulty */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{content.subject.name}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(content.difficulty)}`}>
            {content.difficulty}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 hover:text-red-500 mb-2">
          {content.title}
        </h2>

        {/* Content preview */}
        <div className="prose max-w-none text-sm text-gray-600 mb-2">
          <div
            dangerouslySetInnerHTML={{
              __html: renderLatexContent(truncateText(content.content, 200))
            }}
          />
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {content.tags.map((tag) => (
              <span
                key={tag.id}
                className="tag inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
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
              {content.view_count} views
            </span>
            <button
              onClick={(e) => handleAction(e, () => navigate(`/exercises/${content.id}#comments`))}
              className="flex items-center gap-1 hover:text-red-500"
            >
              <MessageSquare className="w-4 h-4" />
              {(content.comments || []).length} comments
            </button>
          </div>

          {isAuthor && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleAction(e, () => onEdit?.(content.id))}
                className="text-gray-500 hover:text-red-800"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleAction(e, () => onDelete?.(content.id))}
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
