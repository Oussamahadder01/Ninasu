import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Tag, ChevronDown, Lightbulb, Award, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContentById, voteContent, addComment, markContentViewed, deleteContent, voteComment, updateComment, deleteComment, deleteSolution, voteSolution, addSolution } from '@/lib/api';
import { Content, Comment, Solution } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { renderLatexContent } from '@/lib/utils';
import { VoteButtons } from '@/components/VoteButtons';
import { CommentSection } from '@/components/CommentSection';
import MDEditor from '@uiw/react-md-editor';
import katex from 'katex';

import { InlineMath, BlockMath } from "react-katex";


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
interface CodeProps {
  inline?: boolean;
  children?: React.ReactNode;
}

export function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [exercise, setExercise] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [solution, setSolution] = useState('');

  useEffect(() => {
    if (id) {
      loadExercise(id);
      markContentViewed(id).catch(console.error);
    }
  }, [id]);
  const renderLatexInPreview = ({ inline, children }: CodeProps) => {
    if (!children) return null;
    const text = Array.isArray(children) ? children[0] : children;
    if (typeof text !== 'string') return null;

    if (inline) {
      if (text.startsWith('$') && text.endsWith('$')) {
        const math = text.slice(1, -1);
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(math) }} />;
      }
    } else {
      if (text.startsWith('$$') && text.endsWith('$$')) {
        const math = text.slice(2, -2);
        return (
          <div className="text-center my-2">
            <span dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { displayMode: true }) }} />
          </div>
        );
      }
    }
    return inline ? <code>{text}</code> : <pre><code>{text}</code></pre>;
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
        const updatedSolution = await voteSolution(firstSolution.id, type);
        setExercise(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            solutions: prev.solution ? [updatedSolution, ...prev.solution.slice(1)] : [updatedSolution]
          };
        });
      } else {
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
              if (comment.replies) {
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

  const handleVoteComment = async (commentId: string, voteType: 'up' | 'down' | 'none') => {
    if (!isAuthenticated || !exercise) {
      navigate('/login');
      return;
    }

    try {
      const updatedComment = await voteComment(commentId, voteType);
      
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

  const toggleSolutionVisibility = () => {
    setSolutionVisible(!solutionVisible);
  };

  const handleAddSolution = async (solutionContent: string) => {
    if (!isAuthenticated || !exercise || !solutionContent.trim()) {
      return;
    }

    try {
      const newSolution = await addSolution(exercise.id, { content: solutionContent });
      setExercise(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          solutions: prev.solution ? [...prev.solution, newSolution] : [newSolution]
        };
      });
    } catch (err) {
      console.error('Failed to add solution:', err);
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
  const firstSolution = exercise.solution;
  const hasSolution = firstSolution;
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
            <ArrowLeft className="w-9 h-9 cursor-pointer mr-2" onClick={() => navigate('/exercises')} />   
      <h2 className="text-2xl font-bold mb-2">{exercise.title}</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        {/* Content header */}
        
        <div className="flex items-center justify-between mb-4">
            {/* Left: Class Levels & Subject */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{exercise.class_levels.map(level => level.name).join(" | ")}</span>
              <span>•</span>
              <span>{exercise.subject?.name}</span>
            </div>
            
            {/* Right: Difficulty */}
            <span className={`px-4 py-0.5 rounded-full text-sm font-semibold border ${getDifficultyColor(exercise.difficulty)}`}>
              {exercise.difficulty}
            </span>
          </div>

        {/* Tags */}
        {exercise.chapters && exercise.chapters.length > 0 && (
          <div className="flex items-center gap-1 mb-4">
            <Tag className="w-4 h-4 text-gray-600" />
            <div className="flex flex-wrap gap-2">
              {exercise.chapters.map((tag) => (
                <span 
                  key={tag.id} 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="prose max-w-none mb-8">
        {renderMathContent(exercise.content)}

        </div>
        

        {/* Footer */}
        <div className="flex items-center border-t pt-4">
  {/* Boutons de vote à gauche */}
  <div className="flex-1">
    <VoteButtons
      initialVotes={(exercise.upvotes_count || 0) - (exercise.downvotes_count || 0)}
      onVote={(type) => handleVote(type, 'exercise')}
      vertical={false}
      userVote={exercise.user_vote}
    />
  </div>

  {/* Auteur & Date */}
  <div className="text-sm text-gray-600">
    by {exercise.author?.username} • {new Date(exercise.created_at).toLocaleDateString()}
  </div>

  {/* Boutons Edit & Delete à droite */}
  {isAuthor && (
    <div className="flex gap-2 flex-shrink-0 ml-4">
      <Button variant="ghost" onClick={handleEdit} className="text-gray-600 hover:text-gray-900">
        <Edit className="w-4 h-4 mr-2" />
        Edit
      </Button>
      <Button variant="ghost" onClick={handleDelete} className="text-red-600 hover:text-red-700">
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </div>
  )}
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
                  <Lightbulb className={`w-6 h-6 ${showSolution ? 'text-blue-500' : 'text-gray-600'}`} />
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
                  <div className="flex items-center gap-0">
                    <Button 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent solution toggle
                        handleEditSolution();
                      }} 
                      className="text-gray-600 hover:text-blue-600 p-3 m-3"
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent solution toggle
                        handleDeleteSolution();
                      }} 
                      className="text-gray-600 hover:text-red-600 p-0 m-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                  <Button
                variant="ghost"
                onClick={toggleSolutionVisibility}
                className="text-gray-600 hover:text-blue-600"
              >
                <ChevronDown className={`w-8 h-8 transition-transform ${solutionVisible ? "rotate-180" : ""}`} />
              </Button>
                </div>
              </div>
            </div>

            {solutionVisible && (
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
                    <div className="text-sm text-gray-600">
                      Solution by {firstSolution.author.username}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Solution Section */}
      {!hasSolution && isAuthor && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Add Solution</h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <MDEditor
              value={solution}
              onChange={(value) => setSolution(value || '')}
              preview="edit"
              height={200}
              textareaProps={{
                placeholder: 'Write your solution here... Use LaTeX with $...$ for inline math or $$...$$ for display math'
              }}
              previewOptions={{
                components: {
                  code: renderLatexInPreview
                }
              }}
            />
            <Button
              onClick={() => handleAddSolution(solution)}
              className="mt-4 bg-gradient-to-r from-gray-900 to-red-900 text-white shadow-lg"
              disabled={!solution.trim()}
            >
              Add Solution
            </Button>
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
