import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Mathematics from '@tiptap-pro/extension-mathematics';
import 'katex/dist/katex.min.css';

interface TipTapRendererProps {
  content: string;
  className?: string;
  maxHeight?: string;
  compact?: boolean;
}

const TipTapRenderer: React.FC<TipTapRendererProps> = ({ 
  content, 
  className = '',
  maxHeight,
  compact = true
}) => {
  // Initialize read-only TipTap editor for content rendering
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      // Configure Image extension with proper options
      Image.configure({
        HTMLAttributes: {
          class: 'content-image',
          loading: 'lazy',

        },
        allowBase64: true,
      }),
      
      Mathematics.configure({
        // Use standard LaTeX syntax ($ for inline, $ for block)
        regex: /\$([^\$]+)\$|\$\$([^\$]+)\$\$/gi,
        // Configure KaTeX options if needed
        katexOptions: {
          throwOnError: false,
          strict: false
        },
        // Only render in non-code blocks
        shouldRender: (state, pos, node) => {
          const $pos = state.doc.resolve(pos);
          return node.type.name === 'text' && $pos.parent.type.name !== 'codeBlock';
        }
      })
    ],
    content: content,
    editable: false, // Make it read-only
  });

  // Style based on props
  const containerStyle: React.CSSProperties = {
    ...(maxHeight ? { maxHeight, overflow: 'wrap' } : {}),
  };

  // Add class based on compact mode
  const containerClass = `tiptap-readonly-editor latex-style text-xl ${compact ? 'tiptap-compact' : ''} ${className}`;

  return (
    <div style={containerStyle} className={containerClass}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapRenderer;