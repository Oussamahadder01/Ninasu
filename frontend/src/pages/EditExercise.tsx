import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContentEditor from '../components/ContentEditor';
import { getContentById, updateContent } from '../lib/api';
import { Content } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function EditExercise() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercise, setExercise] = useState<Content | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadExercise(id);
    }
  }, [id]);

  const loadExercise = async (exerciseId: string) => {
    try {
      setLoading(true);
      const data = await getContentById(exerciseId);
      
      // Check if the user is the author
      if (user?.id !== data.author.id) {
        navigate('/exercises');
        return;
      }
      
      setExercise(data);
    } catch (err) {
      console.error('Failed to load exercise:', err);
      setError('Failed to load exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!id) return;

    try {
      const updateData = {
        title: data.title,
        content: data.content,
        type: data.type,
        class_level: data.class_level,
        subject: data.subject,
        difficulty: data.difficulty,
        tags: data.tags,
        solution_content: data.solutions[0]
      };

      await updateContent(id, updateData);
      navigate(`/exercises/${id}`);
    } catch (err) {
      console.error('Failed to update exercise:', err);
      setError('Failed to update exercise. Please try again.');
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

  // Get the first solution if it exists
  const firstSolution = exercise.solutions && exercise.solutions.length > 0 
    ? exercise.solutions[0] 
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Exercise</h1>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md p-6">
        <ContentEditor
          onSubmit={handleSubmit}
          initialValues={{
            title: exercise.title,
            content: exercise.content,
            type: exercise.type,
            class_level: exercise.class_level.id,
            subject: exercise.subject.id,
            difficulty: exercise.difficulty,
            solution: firstSolution?.content || '',
            tags: exercise.tags?.map(tag => tag.id) || [],
          }}
        />
      </div>
    </div>
  );
}