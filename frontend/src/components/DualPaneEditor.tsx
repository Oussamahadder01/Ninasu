import React from "react";
import Split from "react-split";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

interface DualPaneEditorProps {
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
}

const DualPaneEditor: React.FC<DualPaneEditorProps> = ({ content, setContent }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const renderMathContent = (text: string) => {
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return (
          <div key={index} className="my-2 text-center">
            <BlockMath math={part.slice(2, -2)} />
          </div>
        );
      } else if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={index} math={part.slice(1, -1)} />;
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className="h-[300px] p-4"> {/* Increased height to 600px */}
      <Split className="flex h-full" sizes={[50, 50]} minSize={300}>
        {/* Left Pane: Textarea for LaTeX input */}
        <textarea
          className="w-full h-full p-4 border border-gray-300 rounded-md text-left resize-none" // Added resize-none
          value={content}
          onChange={handleInputChange}
          placeholder="Enter your LaTeX here... Use $...$ for inline and $$...$$ for display math"
        />

        {/* Right Pane: KaTeX Preview */}
        <div className="w-full h-full p-4 bg-gray-100 border border-gray-300 rounded-md overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Preview</h2>
          <div className="prose prose-sm">
            {renderMathContent(content)}
          </div>
        </div>
      </Split>
    </div>
  );
};

export default DualPaneEditor;
