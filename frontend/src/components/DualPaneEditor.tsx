import React, { useState, useRef, useEffect } from "react";
import Split from "react-split";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

interface DualPaneEditorProps {
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
}

const DualPaneEditor: React.FC<DualPaneEditorProps> = ({ content, setContent }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewHeight, setPreviewHeight] = useState("auto");

  useEffect(() => {
    if (previewRef.current) {
      setPreviewHeight(`${previewRef.current.scrollHeight}px`);
    }
  }, [content]); // Update when content changes

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
    <div className="p-4">
      <div className="gap-4 bg-black/20 rounded-lg p-4">
        <Split className="flex" sizes={[50, 50]} minSize={300}>
          {/* Left Pane: Textarea for LaTeX input */}
          <textarea
            className="w-full  px-4 py-3 bg-white/10 text-xl border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-all resize-none font-mono"
            value={content}
            onChange={handleInputChange}
            placeholder="Enter your LaTeX here... Use $...$ for inline and $$...$$ for display math"
          />

          {/* Right Pane: KaTeX Preview */}
          <div
            className="w-full px-4 py-3 bg-white/10 text-xl border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-all font-mono"
            ref={previewRef}
            style={{ height: previewHeight, overflow: "hidden" }}
          >
            <h2 className="text-xl font-semibold mb-2">Preview</h2>
            <div className="prose prose-lg">{renderMathContent(content)}</div>
          </div>
        </Split>
      </div>
    </div>
  );
};

export default DualPaneEditor;
