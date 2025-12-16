import React from 'react';
import { InputMode } from '../types';
import { FileText, Link as LinkIcon, Sparkles } from 'lucide-react';

interface InputSectionProps {
  mode: InputMode;
  setMode: (mode: InputMode) => void;
  input: string;
  setInput: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  mode,
  setMode,
  input,
  setInput,
  onSubmit,
  isLoading,
  disabled
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setMode(InputMode.TEXT)}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
            mode === InputMode.TEXT
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-slate-50'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={16} />
          Paste Transcript / Text
        </button>
        <button
          onClick={() => setMode(InputMode.URL)}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
            mode === InputMode.URL
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-slate-50'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LinkIcon size={16} />
          YouTube / Article URL
        </button>
      </div>

      {/* Input Area */}
      <div className="p-6 flex-grow flex flex-col">
        {mode === InputMode.TEXT ? (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste the raw transcript or draft text here..."
            className="w-full h-64 md:h-full p-4 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 resize-none text-slate-700 placeholder-slate-400 text-sm leading-relaxed"
            spellCheck={false}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-slate-700">Video or Article Link</label>
            <input
              type="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full p-4 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder-slate-400"
            />
            <div className="p-4 bg-blue-50 text-blue-700 text-xs rounded-lg leading-relaxed">
              <strong>Note:</strong> We will use Google Search grounding to find the content of this link. 
              Results depend on the video's public availability and metadata.
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onSubmit}
            disabled={disabled || !input.trim()}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-white transition-all shadow-md
              ${disabled || !input.trim()
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-95'
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Editorializing...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Transform Content</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
