import { useState } from 'react';
import ContentEditor from '../components/ContentEditor';
import { useNavigate } from 'react-router-dom';
import { createContent } from '../lib/api';

export const NewContent = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      await createContent(data);
      navigate('/exercises');
    } catch (error: any) {
      console.error('Failed to create content:', error);
      setError(error.response?.data?.error || 'Failed to create content. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Content</h1>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md p-6">
        <ContentEditor onSubmit={handleSubmit} />
      </div>
    </div>
  );
};