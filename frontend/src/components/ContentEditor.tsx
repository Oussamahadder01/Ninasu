import React, { useEffect, useState, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Button } from './ui/button';
import { ContentType, Difficulty } from '@/types';
import { getClassLevels, getSubjects, getChapters, uploadImage } from '@/lib/api';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Upload } from 'lucide-react';

interface ContentEditorProps {
  onSubmit: (data: {
    title: string;
    content: string;
    type: ContentType;
    class_level: string;
    subject: string;
    difficulty: Difficulty;
    solution?: string;
    tags: string[];
  }) => void;
  initialValues?: {
    title: string;
    content: string;
    type: ContentType;
    class_level: string;
    subject: string;
    difficulty: Difficulty;
    solution?: string;
    tags: string[];
  };
}

interface CodeProps {
  inline?: boolean;
  children?: React.ReactNode;
}

const ContentEditor: React.FC<ContentEditorProps> = ({ onSubmit, initialValues }) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [content, setContent] = useState(initialValues?.content || '');
  const [type, setType] = useState<ContentType>(initialValues?.type || 'exercise');
  const [classLevel, setClassLevel] = useState(initialValues?.class_level || '');
  const [subject, setSubject] = useState(initialValues?.subject || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialValues?.difficulty || 'medium');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialValues?.tags || []);
  const [solution, setSolution] = useState(initialValues?.solution || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClassLevels();
  }, []);

  useEffect(() => {
    if (classLevel) {
      loadSubjects(classLevel);
    } else {
      setSubjects([]);
      setSubject('');
    }
  }, [classLevel]);

  useEffect(() => {
    if (classLevel && subject) {
      loadChapters(subject, classLevel);
    } else {
      setChapters([]);
      setSelectedTags([]);
    }
  }, [classLevel, subject]);

  const loadClassLevels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getClassLevels();
      setClassLevels(data);
      
      // If we have initialValues but no classLevel set, set it from the first available option
      if (initialValues && !classLevel && data.length > 0) {
        setClassLevel(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load class levels:', error);
      setError('Failed to load class levels. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjects = async (classLevelId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSubjects(classLevelId);
      setSubjects(data);
      
      // If we have initialValues but no subject set, set it from the first available option
      if (initialValues && !subject && data.length > 0) {
        setSubject(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChapters = async (subjectId: string, classLevelId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getChapters(subjectId, classLevelId);
      setChapters(data);
    } catch (error) {
      console.error('Failed to load chapters:', error);
      setError('Failed to load chapters. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const imageUrl = await uploadImage(file);
      const imageMarkdown = `![${file.name}](${imageUrl})`;
      setContent((prev) => prev + '\n' + imageMarkdown);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classLevel || !subject || !selectedTags.length) {
      setError('Please select all required fields and at least one tag');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit({
        title,
        content,
        type,
        class_level: classLevel,
        subject,
        difficulty,
        solution: type === 'exercise' ? solution : undefined,
        tags: selectedTags,
      });
    } catch (error) {
      console.error('Failed to create content:', error);
      setError('Failed to create content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
        <MDEditor
          value={content}
          onChange={(value) => setContent(value || '')}
          preview="edit"
          height={400}
          textareaProps={{
            placeholder: 'Write your content here... Use LaTeX with $...$ for inline math or $$...$$ for display math'
          }}
          previewOptions={{
            components: {
              code: renderLatexInPreview
            }
          }}
        />
      </div>

      {type === 'exercise' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Solution</label>
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
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ContentType)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="exercise">Exercise</option>
            <option value="course">Course</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Class Level</label>
          <select
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            disabled={loading}
          >
            <option value="">Select a class level</option>
            {classLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={!classLevel || loading}
            required
          >
            <option value="">Select a subject</option>
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags (at least one required)</label>
        <div className="flex flex-wrap gap-2">
          {chapters.map((chap) => (
            <Button
              key={chap.id}
              type="button"
              variant={selectedTags.includes(chap.id) ? 'primary' : 'secondary'}
              onClick={() => {
                setSelectedTags(prev => 
                  prev.includes(chap.id) 
                    ? prev.filter(id => id !== chap.id)
                    : [...prev, chap.id]
                );
              }}
            >
              {chap.name}
            </Button>
          ))}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={loading || !classLevel || !subject || !selectedTags.length || !title || !content}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Publishing...
          </div>
        ) : (
          'Publish Content'
        )}
      </Button>
    </form>
  );
};

export default ContentEditor;
