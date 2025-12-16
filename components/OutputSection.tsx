import React, { useState, useRef, useEffect } from 'react';
import { GeneratedContent, PublicationStyle } from '../types';
import { Copy, Volume2, Square, Loader2, Download, FileText } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface OutputSectionProps {
  content: GeneratedContent | null;
  style: PublicationStyle;
  isLoading: boolean;
}

// Helpers for Audio Decoding and WAV creation
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodePCM(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function createWavBlob(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const dataLength = pcmData.length;

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // file length - 8
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true); // Subchunk2Size (data length)

  return new Blob([header, pcmData], { type: 'audio/wav' });
}

// Strip markdown for clean text export/TTS
function cleanMarkdown(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
}

export const OutputSection: React.FC<OutputSectionProps> = ({ content, style, isLoading }) => {
  const [isReading, setIsReading] = useState(false);
  const [isAudioProcessing, setIsAudioProcessing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBase64Ref = useRef<string | null>(null);

  // Cleanup audio on unmount or content change
  useEffect(() => {
    audioBase64Ref.current = null; // Clear cache on new content
    return () => {
      stopAudio();
    };
  }, [content]);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsReading(false);
  };

  const fetchAudioData = async () => {
    if (audioBase64Ref.current) return audioBase64Ref.current;
    if (!content) return null;

    const cleanBody = cleanMarkdown(content.body);
    const textToRead = `${content.headline}. \n\n ${cleanBody}`;
    const base64Audio = await generateSpeech(textToRead);
    audioBase64Ref.current = base64Audio;
    return base64Audio;
  };

  const handleReadAloud = async () => {
    if (isReading) {
      stopAudio();
      return;
    }

    if (!content) return;

    setIsAudioProcessing(true);
    try {
      const base64Audio = await fetchAudioData();
      if (!base64Audio) throw new Error("No audio generated");

      // Initialize AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
          sampleRate: 24000 
        });
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBytes = base64ToUint8Array(base64Audio);
      const audioBuffer = await decodePCM(audioBytes, audioContextRef.current);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsReading(false);
      source.start();

      sourceNodeRef.current = source;
      setIsReading(true);

    } catch (err) {
      console.error("Failed to play audio", err);
      alert("Could not generate audio for this content. Please try again.");
    } finally {
      setIsAudioProcessing(false);
    }
  };

  const handleDownloadAudio = async () => {
    if (!content) return;
    
    setIsAudioProcessing(true);
    try {
      const base64Audio = await fetchAudioData();
      if (!base64Audio) throw new Error("No audio generated");

      const audioBytes = base64ToUint8Array(base64Audio);
      const wavBlob = createWavBlob(audioBytes, 24000);
      
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `editorial-ai-${style.id}-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

    } catch (err) {
      console.error("Failed to download audio", err);
      alert("Could not download audio. Please try again.");
    } finally {
      setIsAudioProcessing(false);
    }
  };

  const handleDownloadText = () => {
    if (!content) return;

    const cleanBody = cleanMarkdown(content.body);
    const textContent = `
Headline: ${content.headline}

Key Takeaways:
${content.keyTakeaways.map(k => `- ${k}`).join('\n')}

---

${cleanBody}
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `editorial-ai-${style.id}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();

    window.setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
  };

  const handleCopy = () => {
    if (content) {
      const cleanBody = cleanMarkdown(content.body);
      navigator.clipboard.writeText(`${content.headline}\n\n${cleanBody}`);
    }
  };

  // Render Body with Drop Cap and basic Markdown support
  const renderFormattedBody = (text: string) => {
    // Split by double newlines to isolate paragraphs
    return text.split('\n\n').map((paragraph, index) => {
      if (!paragraph.trim()) return null;

      // Split by bold markers
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);
      const children = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Drop Cap for the first paragraph
      if (index === 0) {
        return (
          <p key={index} className="first-letter:float-left first-letter:text-7xl first-letter:pr-3 first-letter:font-serif-heading first-letter:font-bold first-letter:text-slate-900 first-letter:leading-[0.8] mb-6 text-slate-800 leading-relaxed text-justify">
            {children}
          </p>
        );
      }
      
      return <p key={index} className="mb-6 text-slate-800 leading-relaxed text-justify">{children}</p>;
    });
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
        <div className="space-y-4 w-full max-w-md animate-pulse">
          <div className="h-8 bg-slate-100 rounded-md w-3/4 mx-auto"></div>
          <div className="h-4 bg-slate-100 rounded-md w-full"></div>
          <div className="h-4 bg-slate-100 rounded-md w-5/6 mx-auto"></div>
          <div className="h-4 bg-slate-100 rounded-md w-full"></div>
          <div className="h-32 bg-slate-50 rounded-lg w-full mt-8"></div>
        </div>
        <p className="mt-8 text-slate-400 text-sm font-medium">
          Our editors are reviewing the draft...
        </p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <span className="font-serif-heading text-2xl font-bold text-slate-300">Aa</span>
        </div>
        <p className="font-medium">Ready to write</p>
        <p className="text-sm mt-2">Select a style and submit text to see the transformation.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button 
          onClick={handleReadAloud}
          disabled={isAudioProcessing}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-full border transition-all text-xs font-medium
            ${isReading 
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
              : 'bg-white/80 backdrop-blur border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }
          `}
          title={isReading ? "Stop reading" : "Read aloud"}
        >
          {isAudioProcessing && !audioBase64Ref.current ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isReading ? (
            <>
              <Square size={14} fill="currentColor" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Volume2 size={16} />
              <span>Read Aloud</span>
            </>
          )}
        </button>

        <button 
          onClick={handleDownloadAudio}
          disabled={isAudioProcessing}
          className="p-2 bg-white/80 backdrop-blur border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
          title="Download Audio (WAV)"
        >
          <Download size={16} />
        </button>

        <button 
          onClick={handleDownloadText}
          className="p-2 bg-white/80 backdrop-blur border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors"
          title="Download Text (.txt)"
        >
          <FileText size={16} />
        </button>

        <button 
          onClick={handleCopy}
          className="p-2 bg-white/80 backdrop-blur border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors"
          title="Copy to clipboard"
        >
          <Copy size={16} />
        </button>
      </div>

      {/* Magazine Preview */}
      <div className="flex-grow overflow-y-auto p-8 md:p-12 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          {/* Brand Hint */}
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <span className={`w-3 h-3 rounded-full ${style.color}`}></span>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-400">
              {style.name} Style
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif-heading text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
            {content.headline}
          </h1>

          {/* Key Takeaways (Sidebar-ish) */}
          <div className="bg-slate-50 border-l-4 border-indigo-200 p-6 mb-8 rounded-r-lg">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Key Takeaways</h4>
            <ul className="space-y-2">
              {content.keyTakeaways.map((point, idx) => (
                <li key={idx} className="text-sm text-slate-700 leading-snug flex gap-2">
                  <span className="text-indigo-400">•</span> {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Body */}
          <div className="font-serif-body text-lg">
            {renderFormattedBody(content.body)}
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
             <span className="text-slate-300 text-2xl">***</span>
          </div>
        </div>
      </div>
    </div>
  );
};
