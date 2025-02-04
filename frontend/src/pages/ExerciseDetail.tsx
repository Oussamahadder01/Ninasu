import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Tag, ChevronDown, Lightbulb, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContentById, voteContent, addComment, markContentViewed, deleteContent, voteComment, updateComment, deleteComment, deleteSolution, voteSolution } from '@/lib/api';
import { Content, Comment, Solution } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { renderLatexContent } from '@/lib/utils';
import { VoteButtons } from '@/components/VoteButtons';
import { CommentSection } from '@/components/CommentSection';

export function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [exercise, setExercise] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    if (id) {
      loadExercise(id);
      markContentViewed(id).catch(console.error);
    }
  }, [id]);

  const loadExercise = async (exerciseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getContentById(exerciseId);
      setExercise(data);
    } catch (err) {
      console.error('Failed to load exercise:', err);
      setError('Failed to load exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 'up' | 'down' | 'none', target: 'exercise' | 'solution' = 'exercise') => {
    if (!isAuthenticated || !id) {
      navigate('/login');
      return;
    }

    try {
      if (target === 'solution' && firstSolution) {
        // Use the new voteSolution function for solution votes
        const updatedSolution = await voteSolution(firstSolution.id, type);
        // Update the exercise state with the new solution data
        setExercise(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            solutions: prev.solutions ? [updatedSolution, ...prev.solutions.slice(1)] : [updatedSolution]
          };
        });
      } else {
        // Use the existing voteContent function for exercise votes
        const updatedExercise = await voteContent(id, type);
        setExercise(updatedExercise);
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleAddComment = async (content: string, parentId?: string) => {
    if (!id || !exercise) return;

    try {
      const newComment = await addComment(id, content, parentId);
      
      setExercise(prev => {
        if (!prev) return prev;

        let updatedComments = [...prev.comments];
        
        if (parentId) {
          const updateCommentsTree = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment]
                };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateCommentsTree(comment.replies)
                };
              }
              return comment;
            });
          };
          
          updatedComments = updateCommentsTree(updatedComments);
        } else {
          updatedComments.push(newComment);
        }

        return {
          ...prev,
          comments: updatedComments
        };
      });
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleVoteComment = async (commentId: string, type: 'up' | 'down' | 'none') => {
    if (!isAuthenticated || !exercise) {
      navigate('/login');
      return;
    }

    try {
      const updatedComment = await voteComment(commentId, type);
      
      const updateCommentInTree = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return updatedComment;
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateCommentInTree(comment.replies)
            };
          }
          return comment;
        });
      };

      setExercise(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: updateCommentInTree(prev.comments || [])
        };
      });
    } catch (err) {
      console.error('Failed to vote on comment:', err);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    if (!exercise) return;

    try {
      const updatedComment = await updateComment(commentId, content);
      
      const updateCommentInTree = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return updatedComment;
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateCommentInTree(comment.replies)
            };
          }
          return comment;
        });
      };

      setExercise(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: updateCommentInTree(prev.comments || [])
        };
      });
    } catch (err) {
      console.error('Failed to edit comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!exercise) return;

    try {
      await deleteComment(commentId);
      
      const removeCommentFromTree = (comments: Comment[]): Comment[] => {
        return comments.filter(comment => {
          if (comment.id === commentId) {
            return false;
          }
          if (comment.replies) {
            comment.replies = removeCommentFromTree(comment.replies);
          }
          return true;
        });
      };

      setExercise(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: removeCommentFromTree(prev.comments || [])
        };
      });
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleDelete = async () => {
    if (!exercise || !window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      await deleteContent(exercise.id);
      navigate('/exercises');
    } catch (err) {
      console.error('Failed to delete content:', err);
    }
  };

  const handleEdit = () => {
    if (exercise) {
      navigate(`/edit/${exercise.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
          {error || 'Exercise not found'}
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === exercise.author.id;
  const firstSolution: Solution | undefined = exercise.solutions?.[0];
  const hasSolution = exercise.type === 'exercise' && firstSolution;
  const canEditSolution = firstSolution && user?.id === firstSolution.author.id;

  const handleEditSolution = () => {
    if (firstSolution) {
      navigate(`/solutions/${firstSolution.id}/edit`);
    }
  };

  const handleDeleteSolution = async () => {
    if (!firstSolution || !window.confirm('Are you sure you want to delete this solution?')) {
      return;
    }

    try {
      await deleteSolution(firstSolution.id);
      loadExercise(exercise.id);
    } catch (err) {
      console.error('Failed to delete solution:', err);
    }
  };
  

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate("/exercises/")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Content header */}
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold truncate max-w-[600px]" title={exercise.title}>
            {exercise.title}
          </h1>
          {isAuthor && (
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="ghost" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="ghost" onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
        
        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="capitalize">{exercise.type}</span>
          <span>•</span>
          <span>{exercise.class_level?.name}</span>
          <span>•</span>
          <span>{exercise.subject?.name}</span>
          <span>•</span>
          <span className="capitalize">{exercise.difficulty}</span>
        </div>

        {/* Tags */}
        {exercise.tags && exercise.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <Tag className="w-4 h-4 text-gray-500" />
            <div className="flex flex-wrap gap-2">
              {exercise.tags.map((tag) => (
                <span 
                  key={tag.id} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="prose max-w-none mb-8">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: renderLatexContent(exercise.content) 
            }} 
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4">
          <VoteButtons
            initialVotes={(exercise.upvotes_count || 0) - (exercise.downvotes_count || 0)}
            onVote={(type) => handleVote(type, 'exercise')}
            vertical={false}
            userVote={exercise.user_vote}
          />
          <div className="text-sm text-gray-600">
            by {exercise.author?.username} • {new Date(exercise.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Solution Section */}
      {hasSolution && (
        <div className="mt-8">
          <div 
            className={`bg-white rounded-lg shadow-md transition-all duration-300 ${showSolution ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setShowSolution(!showSolution)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setShowSolution(!showSolution);
              }
            }}
          >
            <div className="px-8 py-6 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lightbulb className={`w-6 h-6 ${showSolution ? 'text-blue-500' : 'text-gray-400'}`} />
                  <h3 className="text-xl font-semibold">Solution</h3>
                  {firstSolution.upvotes_count > 0 && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {firstSolution.upvotes_count - (firstSolution.downvotes_count || 0)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {canEditSolution && (
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent solution toggle
                          handleEditSolution();
                        }} 
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent solution toggle
                          handleDeleteSolution();
                        }} 
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showSolution ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>

            {showSolution && (
              <div className="px-8 pb-6" onClick={(e) => e.stopPropagation()}>
                <div className="border-t pt-6">
                  <div className="prose max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: renderLatexContent(firstSolution.content) 
                      }} 
                    />
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <VoteButtons
                      initialVotes={(firstSolution.upvotes_count || 0) - (firstSolution.downvotes_count || 0)}
                      onVote={(type) => handleVote(type, 'solution')}
                      vertical={false}
                      userVote={firstSolution.user_vote}
                    />
                    <div className="text-sm text-gray-500">
                      Solution by {firstSolution.author.username}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments section */}
      <div className="mt-8" id="comments">
        <CommentSection
          comments={exercise?.comments || []}
          onAddComment={handleAddComment}
          onVoteComment={handleVoteComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
        />
      </div>
    </div>
  );
}