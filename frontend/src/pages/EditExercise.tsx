import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContentEditor from '../components/ContentEditor';
import { getContentById, updateContent } from '../lib/api';
import { Content, Difficulty } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import 'katex/dist/katex.min.css';

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
      await updateContent(id, data);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <ArrowLeft className="w-9 h-9 cursor-pointer mr-2" onClick={() => navigate('/exercises')} />   
        <h1 className="text-3xl font-bold mb-2">Edit Exercise</h1>
      </div>

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
            class_level: exercise.class_levels?.map(level => level.id) || [],
            subject: exercise.subject?.id || '',
            difficulty: exercise.difficulty as Difficulty,
            chapters: exercise.chapters?.map(chapter => chapter.id) || [],
          }}
        />
      </div>
    </div>
  );
}
