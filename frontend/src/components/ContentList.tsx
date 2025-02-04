import React from 'react';
import { Content } from '@/types';
import { ContentCard } from './ContentCard';

interface ContentListProps {
  contents: Content[];
  onVote: (id: string, type: 'up' | 'down' | 'none') => Promise<void>;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const ContentList: React.FC<ContentListProps> = ({ 
  contents, 
  onVote,
  onDelete,
  onEdit
}) => {
  return (
    <div className="space-y-4">
      {contents.map((content) => (
        <ContentCard 
          key={content.id} 
          content={content} 
          onVote={onVote}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}