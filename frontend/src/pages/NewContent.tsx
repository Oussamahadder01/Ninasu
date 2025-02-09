import { useState  } from 'react';
import ContentEditor from '../components/ContentEditor';
import { useNavigate } from 'react-router-dom';
import { createContent } from '../lib/api';
import { ArrowLeft } from 'lucide-react'; // Classical arrow icon


export const NewContent = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [solution, _] = useState<string>('');

  const handleSubmit = async (data: any) => {
    try {
      await createContent({
        ...data,
        solution_content: solution,
      });
      navigate('/exercises');
    } catch (error: any) {
      console.error('Failed to create content:', error);
      setError(error.response?.data?.error || 'Failed to create content. Please try again.');
    }
  };


  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
            <ArrowLeft className="w-9 h-9 cursor-pointer mr-2" onClick={() => navigate('/exercises')} />   
      <h2 className="text-3xl font-bold mb-2">Create New Content</h2>
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
            title: '',
            content: '',
            class_level: [],
            subject: '',
            difficulty: 'easy', // or any default value
            chapters: [],
          }} 
        />
      {/* Class Level Selection (Multiple Toggle Buttons) */}
        
      </div>
    </div>
  );
};
