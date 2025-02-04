import React, { useState, useEffect } from 'react';
import { VoteButtons } from './VoteButtons';
import { Button } from './ui/button';
import { MessageSquare, X, Edit2, Trash2, AtSign } from 'lucide-react';
import { Comment, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// Interface définissant les props du composant CommentSection
interface CommentSectionProps {
  comments: Comment[];                                                    // Liste des commentaires
  onAddComment: (content: string, parentId?: string) => Promise<void>;   // Fonction pour ajouter un commentaire
  onVoteComment: (commentId: string, type: 'up' | 'down' | 'none') => Promise<void>;  // Fonction pour voter
  onEditComment: (commentId: string, content: string) => Promise<void>;   // Fonction pour éditer
  onDeleteComment: (commentId: string) => Promise<void>;                  // Fonction pour supprimer
}

export function CommentSection({ 
  comments, 
  onAddComment, 
  onVoteComment,
  onEditComment,
  onDeleteComment 
}: CommentSectionProps) {
  // État global et authentification
  const { isAuthenticated, user } = useAuth();
  
  // États locaux pour gérer les différentes fonctionnalités
  const [newComment, setNewComment] = useState('');           // Contenu du nouveau commentaire
  const [replyingTo, setReplyingTo] = useState<string | null>(null);  // ID du commentaire auquel on répond
  const [replyContent, setReplyContent] = useState('');      // Contenu de la réponse
  const [editingComment, setEditingComment] = useState<string | null>(null);  // ID du commentaire en cours d'édition
  const [editContent, setEditContent] = useState('');        // Contenu en cours d'édition
  const [submitting, setSubmitting] = useState(false);       // État de soumission
  
  // États pour le système de mentions (@)
  const [showMentions, setShowMentions] = useState(false);   // Afficher/masquer la liste des mentions
  const [mentionFilter, setMentionFilter] = useState('');    // Filtre de recherche des mentions
  const [cursorPosition, setCursorPosition] = useState<{ top: number; left: number } | null>(null);  // Position du curseur
  const [users, setUsers] = useState<User[]>([]);            // Liste des utilisateurs mentionnables

  // Initialise la réponse avec @username quand on commence à répondre
  const handleStartReply = (commentId: string, authorUsername: string) => {
    setReplyingTo(commentId);
    setReplyContent(`@${authorUsername} `);
  };

  // Gère l'insertion d'une mention dans le texte
  const handleMention = (username: string, textareaRef: HTMLTextAreaElement) => {
    const currentContent = textareaRef.value;
    const cursorPos = textareaRef.selectionStart;
    const textBeforeCursor = currentContent.substring(0, cursorPos);
    const textAfterCursor = currentContent.substring(cursorPos);
    
    // Trouve la dernière position du @ avant le curseur
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    if (lastAtPos >= 0) {
      const newContent = textBeforeCursor.substring(0, lastAtPos) + 
                        `@${username} ` + 
                        textAfterCursor;
      
      // Met à jour le contenu approprié selon le contexte
      if (replyingTo !== null) {
        setReplyContent(newContent);
      } else if (editingComment !== null) {
        setEditContent(newContent);
      } else {
        setNewComment(newContent);
      }
    }
    
    setShowMentions(false);
    textareaRef.focus();
  };

  // Gère les changements dans la zone de texte et détecte les mentions
  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    setter: (value: string) => void
  ) => {
    const { value, selectionStart } = e.target;
    setter(value);

    const textBeforeCursor = value.substring(0, selectionStart);
    const matches = textBeforeCursor.match(/@(\w*)$/);
    
    if (matches) {
      // Calcule la position relative à la zone de texte
      const rect = e.target.getBoundingClientRect();
      const position = getCaretCoordinates(e.target, selectionStart);
      
      // Calcule la position absolue par rapport à la zone de texte
      setCursorPosition({
        top: rect.top + position.top - e.target.scrollTop,
        left: rect.left + position.left - e.target.scrollLeft
      });
      
      setMentionFilter(matches[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Extrait la liste des utilisateurs uniques des commentaires pour les mentions
  useEffect(() => {
    const extractUsers = (comments: Comment[]): User[] => {
      // Utilise un Map pour stocker les utilisateurs uniques par ID
      const userMap = new Map<string, User>();
      
      const addUser = (user: User) => {
        if (!userMap.has(user.id)) {
          userMap.set(user.id, user);
        }
      };
      
      // Parcourt récursivement les commentaires et leurs réponses
      const processComments = (comments: Comment[]) => {
        comments.forEach(comment => {
          addUser(comment.author);
          if (comment.replies) {
            processComments(comment.replies);
          }
        });
      };
      
      processComments(comments);
      
      // Convertit le Map en tableau d'utilisateurs
      return Array.from(userMap.values());
    };

    setUsers(extractUsers(comments));
  }, [comments]);

  // Gestion des soumissions de commentaires
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await onAddComment(newComment);
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  // Gestion des soumissions de réponses
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      await onAddComment(replyContent, parentId);
      setReplyContent('');
      setReplyingTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Gestion de l'édition des commentaires
  const handleEditSubmit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      await onEditComment(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
    } finally {
      setSubmitting(false);
    }
  };

  // Initialisation de l'édition d'un commentaire
  const handleStartEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  // Annulation de l'édition
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  // Gestion de la suppression des commentaires
  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        setSubmitting(true);
        await onDeleteComment(commentId);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Rendu de la liste des mentions
  const renderMentionsList = () => {
    if (!showMentions || !cursorPosition) return null;

    const filteredUsers = users.filter(u => 
      u.username.toLowerCase().includes(mentionFilter.toLowerCase())
    );

    return (
      <div 
        className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto"
        style={{
          position: 'fixed', // Change à fixed pour position absolue par rapport à la fenêtre
          top: cursorPosition.top + window.scrollY + 20, // Ajoute le scroll vertical
          left: cursorPosition.left + window.scrollX // Ajoute le scroll horizontal
        }}
      >
        {filteredUsers.map(user => (
          <button
            key={user.id}
            type="button"
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
            onMouseDown={(e) => {
              e.preventDefault();
              const textarea = document.querySelector('textarea:focus');
              if (textarea) {
                handleMention(user.username, textarea as HTMLTextAreaElement);
              }
            }}
          >
            <AtSign className="w-4 h-4 text-gray-500" />
            {user.username}
          </button>
        ))}
      </div>
    );
  };

  // Rendu du contenu d'un commentaire
  const renderCommentContent = (comment: Comment) => (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* En-tête du commentaire */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{comment.author.username}</div>
        <div className="text-sm text-gray-600">
          {new Date(comment.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Contenu du commentaire (mode édition ou affichage) */}
      {editingComment === comment.id ? (
        <div className="mb-4">
          <textarea
            value={editContent}
            onChange={(e) => handleTextareaChange(e, setEditContent)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleEditSubmit(comment.id)}
              disabled={submitting || !editContent.trim()}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-gray-800 mb-4">{comment.content}</div>
      )}
      
      {/* Boutons d'action */}
      <div className="flex gap-2">
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStartReply(comment.id, comment.author.username)}
            className="text-gray-600 hover:text-blue-600"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Reply
          </Button>
        )}

        {user?.id === comment.author.id && editingComment !== comment.id && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStartEdit(comment)}
              className="text-gray-600 hover:text-blue-600"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(comment.id)}
              className="text-gray-600 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );

  // Rendu du formulaire de réponse
  const renderReplyForm = (parentId: string, parentAuthor: string) => (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-600">
          Replying to {parentAuthor}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReplyingTo(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <textarea
        value={replyContent}
        onChange={(e) => handleTextareaChange(e, setReplyContent)}
        placeholder="Write your reply..."
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <Button
          onClick={() => handleSubmitReply(parentId)}
          disabled={submitting || !replyContent.trim()}
        >
          {submitting ? 'Posting...' : 'Post Reply'}
        </Button>
      </div>
    </div>
  );

  // Rendu récursif des commentaires et leurs réponses
  const renderComment = (comment: Comment, depth = 0) => {
    const maxDepth = 3;  // Profondeur maximale d'imbrication
    const currentDepth = Math.min(depth, maxDepth);
    const marginLeft = currentDepth * 1;  // Indentation réduite pour les réponses

    return (
      <div 
        key={comment.id} 
        className="mb-4"
        style={{ 
          marginLeft: `${marginLeft}rem`,
          borderLeft: depth > 0 ? '2px solid #e5e7eb' : 'none',  // Ligne verticale pour les réponses
          paddingLeft: depth > 0 ? '0.75rem' : '0'
        }}
      >
        <div className="flex gap-4">
          {/* Boutons de vote */}
          <div className="flex-shrink-0">
            <VoteButtons
              initialVotes={(comment.upvotes_count || 0) - (comment.downvotes_count || 0)}
              onVote={(type) => onVoteComment(comment.id, type)}
              vertical={false}
              userVote={comment.user_vote}
            />
          </div>

          {/* Contenu du commentaire et ses réponses */}
          <div className="flex-1">
            {renderCommentContent(comment)}
            {replyingTo === comment.id && renderReplyForm(comment.id, comment.author.username)}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Rendu principal du composant
  return (
    <div className="relative">
      <h2 className="text-2xl font-bold mb-6">Comments</h2>

      {/* Formulaire de nouveau commentaire */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => handleTextareaChange(e, setNewComment)}
            placeholder="Write a comment..."
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
          <Button 
            type="submit" 
            className="mt-2"
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      ) : (
        <div className="bg-gray-50 border rounded-lg p-4 mb-8 text-center">
          Please <a href="/login" className="text-blue-600 hover:underline">log in</a> to comment
        </div>
      )}

      {/* Liste des commentaires */}
      <div className="space-y-6">
        {comments.filter(comment => !comment.parent).map(comment => renderComment(comment))}

        {comments.length === 0 && (
          <div className="text-center text-gray-600 py-8">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>

      {/* Liste des mentions suggérées */}
      {renderMentionsList()}
    </div>
  );
}

// Fonction utilitaire pour calculer la position du curseur dans un textarea
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  // Crée un div fantôme pour calculer la position exacte du curseur
  const div = document.createElement('div');
  const style = div.style;
  const computed = window.getComputedStyle(element);

  // Copie les styles du textarea
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';
  
  // Liste des propriétés à copier
  const properties = [
    'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
    'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
    'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing'
  ];

  // Copie toutes les propriétés de style
  properties.forEach(prop => {
    // @ts-ignore
    style[prop] = computed[prop];
  });

  // Insère le texte jusqu'à la position du curseur
  div.textContent = element.value.substring(0, position);
  
  // Ajoute un span pour marquer la position
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);
  
  // Calcule les coordonnées
  document.body.appendChild(div);
  const coordinates = {
    top: span.offsetTop,
    left: span.offsetLeft
  };
  document.body.removeChild(div);
  
  return coordinates;
}