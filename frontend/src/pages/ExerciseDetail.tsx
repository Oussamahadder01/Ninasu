import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Tag, 
  ChevronDown, 
  Lightbulb, 
  Award, 
  MessageSquare, 
  GitPullRequest, 
  Activity, 
  BookOpen,
  GraduationCap,
  BarChart3,
  Clock,
  User,
  PenSquare,
  Timer,
  Bookmark,
  CheckCircle,
  XCircle,
  ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContentById, voteExercise, addComment, markContentViewed, deleteContent, voteComment, updateComment, deleteComment, deleteSolution, voteSolution, addSolution } from '@/lib/api';
import { Content, Comment, VoteValue, Difficulty } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { VoteButtons } from '@/components/VoteButtons';
import DualPaneEditor from '@/components/editor/DualPaneEditor';
import { InlineMath, BlockMath } from "react-katex";
import { CommentSection } from '@/components/CommentSection';
import TipTapRenderer from '@/components/editor/TipTapRenderer';

const renderMathContent = (text: string) => {
  if (!text) return null;
  
  // Split the text into regular text and math expressions
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      // For block math (centered)
      return (
        <div key={index} className="my-2 text-center">
          <BlockMath math={part.slice(2, -2)} />
        </div>
      );
    } else if (part.startsWith('$') && part.endsWith('$')) {
      // For inline math, allow wrapping by adding spaces
      const mathContent = part.slice(1, -1); // Remove the surrounding `$`
      return (
        <span key={index} className="inline-block whitespace-normal">
          <InlineMath math={mathContent} />
        </span>
      );
    } else {
      // Regular text
      return <span className='latex-style text-xl text-gray-800' key={index}>{part}</span>;
    }
  });
};

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
  const [activeSection, setActiveSection] = useState<'exercise' | 'discussions' | 'proposals' | 'community' | 'activity'>('exercise');
  
  // States for new functionalities
  const [timer, setTimer] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [savedForLater, setSavedForLater] = useState<boolean>(false);
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadExercise(id);
      markContentViewed(id).catch(console.error);
    }
  }, [id]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

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
  
  const getDifficultyIcon = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy':
        return <BarChart3 className="w-4 h-4" />;
      case 'medium':
        return (
          <div className="flex">
            <BarChart3 className="w-4 h-4" />
            <BarChart3 className="w-4 h-4" />
          </div>
        );
      case 'hard':
        return (
          <div className="flex">
            <BarChart3 className="w-4 h-4" />
            <BarChart3 className="w-4 h-4" />
            <BarChart3 className="w-4 h-4" />
          </div>
        );
      default:
        return <BarChart3 className="w-4 h-4" />;
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

  const handleVote = async (value: VoteValue, target: 'exercise' | 'solution' = 'exercise') => {
    if (!isAuthenticated || !id) {
      navigate('/login');
      return;
    }

    try {
      if (target === 'solution' && exercise?.solution) {
        const updatedSolution = await voteSolution(exercise.solution.id, value);
        setExercise(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            solution: updatedSolution
          };
        });
      } else {
        const updatedExercise = await voteExercise(id, value);
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

  const handleVoteComment = async (commentId: string, value: VoteValue) => {
    if (!isAuthenticated || !exercise) {
      navigate('/login');
      return;
    }

    try {
      const updatedComment = await voteComment(commentId, value);
      
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

  const toggleSolutionVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSolutionVisible(!solutionVisible);
  };

  const handleSolutionToggle = () => {
    setShowSolution(!showSolution);
    if (!solutionVisible) {
      setSolutionVisible(true);
    }
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
          solution: newSolution
        };
      });
    } catch (err) {
      console.error('Failed to add solution:', err);
    }
  };

  const handleEditSolution = () => {
    if (exercise?.solution) {
      navigate(`/solutions/${exercise.solution.id}/edit`);
    }
  };

  const handleDeleteSolution = async () => {
    if (!exercise?.solution || !window.confirm('Are you sure you want to delete this solution?')) {
      return;
    }

    try {
      await deleteSolution(exercise.solution.id);
      loadExercise(exercise.id);
    } catch (err) {
      console.error('Failed to delete solution:', err);
    }
  };

  // Functions for new features
  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimer(0);
    setTimerActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSavedForLater = () => {
    setSavedForLater(!savedForLater);
    // Here you would call an API to save/unsave the exercise
  };

  const markAsCompleted = (status: boolean) => {
    setCompleted(status);
    // Here you would call an API to mark the exercise as completed
  };

  const rateDifficulty = (rating: number) => {
    setDifficultyRating(rating);
    // Here you would call an API to rate the difficulty
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4"></div>
          <p className="text-gray-600">Chargement de l'exercice...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error || 'Exercice introuvable'}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={() => navigate('/exercises')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-4" />
              Retour aux exercices
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === exercise.author.id;
  const hasSolution = !!exercise.solution;
  const canEditSolution = exercise.solution && user?.id === exercise.solution.author.id;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button - Now more prominent */}
        <div className="mb-10">
          <Button 
            onClick={() => navigate('/exercises')}
            variant="outline"
            className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux exercices
          </Button>
        </div>
        
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content Area - Now spans cols 1-9 */}
          <div className="col-span-12 lg:col-span-9">
            {/* Exercise Header - Redesigned */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex flex-col gap-4">
                  {/* Title and Actions Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">{exercise.title}</h1>
                    
                    <div className="flex gap-2 shrink-0">
                      {isAuthor && (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={handleEdit} 
                            className="rounded-full text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleDelete} 
                            className="rounded-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Metadata Badges */}
                  <div className="flex flex-wrap gap-3">
                    {/* Subject Badge */}
                    {exercise.subject && (
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{exercise.subject.name}</span>
                      </span>
                    )}
                    
                    {/* Class Level Badge */}
                    {exercise.class_levels && exercise.class_levels.length > 0 && (
                      <span className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{exercise.class_levels[0].name}</span>
                      </span>
                    )}
                    
                    {/* Difficulty Badge */}
                    <span 
                      className={`bg-gradient-to-r ${getDifficultyColor(exercise.difficulty)} px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center gap-2`}
                    >
                      {getDifficultyIcon(exercise.difficulty)}
                      <span>{getDifficultyLabel(exercise.difficulty)}</span>
                    </span>
                    
                    {/* Author Badge */}
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span>{exercise.author?.username}</span>
                    </span>
                    
                    {/* Date Badge */}
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>{new Date(exercise.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                  
                  {/* Chapter Tags */}
                  {exercise.chapters && exercise.chapters.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {exercise.chapters.map((tag) => (
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
              
              {/* Tab Navigation - Now directly under title */}
              <div className="border-t border-gray-200">
                <div className="flex overflow-x-auto">
                  <TabButton 
                    active={activeSection === 'exercise'} 
                    onClick={() => setActiveSection('exercise')}
                    icon={<BookOpen className="w-4 h-4" />}
                    label="Exercice"
                  />
                  
                  <TabButton 
                    active={activeSection === 'discussions'} 
                    onClick={() => setActiveSection('discussions')}
                    icon={<MessageSquare className="w-4 h-4" />}
                    label="Discussions"
                    count={exercise.comments.length}
                  />
                  
                  <TabButton 
                    active={activeSection === 'proposals'} 
                    onClick={() => setActiveSection('proposals')}
                    icon={<GitPullRequest className="w-4 h-4" />}
                    label="Solutions alternatives"
                  />
                  
                  <TabButton 
                    active={activeSection === 'activity'} 
                    onClick={() => setActiveSection('activity')}
                    icon={<Activity className="w-4 h-4" />}
                    label="Activité"
                  />
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeSection === 'exercise' && (
              <>
                {/* Exercise Content */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                  <div className="p-8">
                    <div className="prose max-w-none mb-6">
                    <TipTapRenderer content={exercise.content} />

                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <VoteButtons
                        initialVotes={exercise.vote_count}
                        onVote={(value) => handleVote(value, 'exercise')}
                        vertical={false}
                        userVote={exercise.user_vote}
                      />
                    </div>
                  </div>
                </div>

                {/* Solution Section */}
                {hasSolution ? (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                    <div 
                      className={`transition-all duration-300 ${showSolution ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                      <div 
                        className="px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={handleSolutionToggle}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${showSolution ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                              <Lightbulb className={`w-5 h-5 ${showSolution ? 'text-indigo-600' : 'text-gray-600'}`} />
                            </div>
                            <h3 className="text-xl font-semibold">Solution</h3>
                            {exercise.solution && exercise.solution.vote_count > 0 && (
                              <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                                <Award className="w-3.5 h-3.5" />
                                <span>{exercise.solution.vote_count}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {canEditSolution && (
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSolution();
                                  }} 
                                  className="text-gray-500 hover:text-indigo-600 rounded-full h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSolution();
                                  }} 
                                  className="text-gray-500 hover:text-red-600 rounded-full h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}

                            <Button
                              variant="ghost"
                              onClick={toggleSolutionVisibility}
                              className="text-gray-500 hover:text-indigo-600 h-8 w-8 p-0 rounded-full"
                            >
                              <ChevronDown className={`w-5 h-5 transition-transform ${solutionVisible ? "rotate-180" : ""}`} />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {solutionVisible && exercise.solution && (
                        <div className="px-6 py-5 border-t border-gray-100">
                          <div className="prose max-w-none">
                          <TipTapRenderer content={exercise.solution.content} />

                          </div>
                          <div className="mt-6 flex items-center justify-between">
                            <VoteButtons
                              initialVotes={exercise.solution.vote_count}
                              onVote={(value) => handleVote(value, 'solution')}
                              vertical={false}
                              userVote={exercise.solution.user_vote}
                              size="sm"
                            />
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-gray-500" />
                              <span>Solution par {exercise.solution.author.username}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : isAuthor ? (
                  /* Add Solution Section for Author */
                  <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-indigo-100">
                          <PenSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-semibold">Ajouter une solution</h3>
                      </div>
                      
                      <DualPaneEditor 
                        content={solution} 
                        setContent={setSolution} 
                      />
                      
                      <div className="mt-6 flex justify-end">
                        <Button
                          onClick={() => handleAddSolution(solution)}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md rounded-full px-6"
                          disabled={!solution.trim()}
                        >
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Publier la solution
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {/* Discussions Section */}
            {activeSection === 'discussions' && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                <div className="p-6" id="comments">
                  <CommentSection
                    comments={exercise?.comments || []}
                    onAddComment={handleAddComment}
                    onVoteComment={handleVoteComment}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                  />
                </div>
              </div>
            )}

            {/* Proposals Section Placeholder */}
            {activeSection === 'proposals' && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                <div className="p-6 text-center py-16">
                  <GitPullRequest className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Solutions alternatives</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Cette fonctionnalité sera bientôt disponible. Elle permettra aux utilisateurs de proposer leurs propres solutions à cet exercice.
                  </p>
                </div>
              </div>
            )}
            
            {/* Activity Section Placeholder */}
            {activeSection === 'activity' && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                <div className="p-6 text-center py-16">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Activité</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Le journal d'activité pour cet exercice sera bientôt disponible, montrant les votes, commentaires et autres interactions.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Sidebar - Now spans cols 10-12 with timer at top */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-28">
              {/* Timer Section - Now at the top of the sidebar */}
              <div className="p-4 bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center">
                    <Timer className="w-4 h-4 mr-2" />
                    Chronomètre
                  </h3>
                  <div className="font-mono text-xl">{formatTime(timer)}</div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button 
                    onClick={toggleTimer} 
                    className={`flex-1 text-xs ${timerActive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {timerActive ? 'Pause' : 'Démarrer'}
                  </Button>
                  <Button 
                    onClick={resetTimer} 
                    variant="outline" 
                    className="flex-1 text-xs bg-white text-indigo-700 border-white hover:bg-indigo-100"
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
              
              {/* Other Tools */}
              <div className="divide-y divide-gray-100">
                {/* Save for Later */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bookmark className={`w-5 h-5 ${savedForLater ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                      <span className="font-medium">Enregistrer pour plus tard</span>
                    </div>
                  </div>
                  <Button 
                    onClick={toggleSavedForLater} 
                    variant={savedForLater ? "default" : "outline"} 
                    className={`w-full text-sm ${savedForLater ? 'bg-amber-500 hover:bg-amber-600' : 'border-gray-300'}`}
                  >
                    {savedForLater ? 'Enregistré' : 'Enregistrer'}
                  </Button>
                </div>
                
                {/* Mark as Completed */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium">Marquer comme terminé</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => markAsCompleted(true)} 
                      variant={completed === true ? "default" : "outline"} 
                      className={`flex-1 text-sm ${completed === true ? 'bg-green-500 hover:bg-green-600' : 'border-gray-300'}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Réussi
                    </Button>
                    <Button 
                      onClick={() => markAsCompleted(false)} 
                      variant={completed === false ? "default" : "outline"} 
                      className={`flex-1 text-sm ${completed === false ? 'bg-red-500 hover:bg-red-600' : 'border-gray-300'}`}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      À revoir
                    </Button>
                  </div>
                </div>
                
                {/* Difficulty Rating */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium">Évaluer la difficulté</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button 
                        key={rating}
                        onClick={() => rateDifficulty(rating)}
                        className={`flex-1 p-2 rounded-md transition-colors ${
                          difficultyRating === rating 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Exercise Statistics */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-700 mb-3">Statistiques</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vues</span>
                      <span className="font-medium">{exercise.view_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Votes</span>
                      <span className="font-medium">{exercise.vote_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commentaires</span>
                      <span className="font-medium">{exercise.comments.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Créé le</span>
                      <span className="font-medium">{new Date(exercise.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label, count }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-4 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
        active 
          ? 'border-indigo-600 text-indigo-700 bg-indigo-50' 
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          active ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}