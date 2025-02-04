import { useState, HTMLAttributes  } from 'react';
import ContentEditor from '../components/ContentEditor';
import { useNavigate } from 'react-router-dom';
import { createContent } from '../lib/api';
import katex from 'katex';
import MDEditor from '@uiw/react-md-editor';

export const NewContent = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<string>('');
  const [contentType, setContentType] = useState<string | null>(null); // State to track content type

  const handleSubmit = async (data: any) => {
    try {
      setContentType(data.type);  // Track the content type when submitted
      await createContent({
        ...data,
        solution_content: data.type === 'exercise' ? solution : undefined,
      });
      navigate('/exercises');
    } catch (error: any) {
      console.error('Failed to create content:', error);
      setError(error.response?.data?.error || 'Failed to create content. Please try again.');
    }
  };

  type CodeProps = HTMLAttributes<HTMLElement> & {
    inline?: boolean; // Optional because MDEditor may not always pass it
    children?: React.ReactNode;
  };

  const renderLatexInPreview = ({ inline = false, children, ...props }: CodeProps): JSX.Element | null => {
    if (!children) return null;
  
    const text = Array.isArray(children) ? children[0] : children;
    if (typeof text !== 'string') return null;
  
    try {
      if (inline && text.startsWith('$') && text.endsWith('$')) {
        const math = text.slice(1, -1);
        return <span {...props} dangerouslySetInnerHTML={{ __html: katex.renderToString(math) }} />;
      } else if (!inline && text.startsWith('$$') && text.endsWith('$$')) {
        const math = text.slice(2, -2);
        return (
          <div className="text-center my-2" {...props}>
            <span dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { displayMode: true }) }} />
          </div>
        );
      }
    } catch (error) {
      console.error('Failed to render LaTeX:', error);
    }
  
    return inline ? <code {...props}>{text}</code> : <pre {...props}><code>{text}</code></pre>;
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
        {contentType === 'exercise' && (
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Solution</label>
            <MDEditor
              value={solution}
              onChange={(value) => setSolution(value || '')}
              preview="edit"
              height={200}
              textareaProps={{
                placeholder: 'Write your solution here... Use LaTeX with $...$ for inline math or $$...$$ for display math',
              }}
              previewOptions={{
                components: {
                  code: renderLatexInPreview,
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
