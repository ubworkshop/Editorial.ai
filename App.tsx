import React, { useState } from 'react';
import { PUBLICATIONS } from './constants';
import { GeneratedContent, InputMode, PublicationStyle } from './types';
import { StyleSelector } from './components/StyleSelector';
import { InputSection } from './components/InputSection';
import { OutputSection } from './components/OutputSection';
import { transformContent } from './services/geminiService';
import { PenTool } from 'lucide-react';

const App = () => {
  const [selectedStyle, setSelectedStyle] = useState<PublicationStyle>(PUBLICATIONS[0]);
  const [mode, setMode] = useState<InputMode>(InputMode.TEXT);
  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await transformContent(inputText, mode, selectedStyle.promptModifier);
      setOutput(result);
    } catch (err) {
      setError("We encountered an issue transforming your content. Please try again or check your input.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <PenTool size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Editorial.ai</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">Beta</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Text */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif-heading">
            Turn rough drafts into masterpiece journalism.
          </h1>
          <p className="text-slate-500 text-lg">
            Select a world-class editorial voice, paste your content or link, and let AI rewrite it with prestige and precision.
          </p>
        </div>

        {/* Style Selector */}
        <StyleSelector 
          selectedStyleId={selectedStyle.id}
          onSelect={setSelectedStyle}
        />

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[600px]">
          
          {/* Left: Input */}
          <div className="h-[500px] lg:h-full">
            <InputSection 
              mode={mode}
              setMode={setMode}
              input={inputText}
              setInput={setInputText}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              disabled={isLoading}
            />
          </div>

          {/* Right: Output */}
          <div className="h-[600px] lg:h-full">
            <OutputSection 
              content={output}
              style={selectedStyle}
              isLoading={isLoading}
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
