import React from 'react';
import { PublicationStyle } from '../types';
import { PUBLICATIONS } from '../constants';
import { CheckCircle } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyleId: string;
  onSelect: (style: PublicationStyle) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyleId, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {PUBLICATIONS.map((pub) => {
        const isSelected = selectedStyleId === pub.id;
        return (
          <button
            key={pub.id}
            onClick={() => onSelect(pub)}
            className={`
              relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left
              ${isSelected 
                ? 'border-indigo-600 bg-indigo-50 shadow-md ring-1 ring-indigo-600' 
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className={`
                w-10 h-10 flex items-center justify-center text-white font-serif-heading font-bold text-xl rounded-lg shadow-sm
                ${pub.color}
              `}>
                {pub.logoInitial}
              </div>
              {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600" />}
            </div>
            
            <h3 className="font-semibold text-slate-900 text-sm mb-1">{pub.name}</h3>
            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
              {pub.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};
