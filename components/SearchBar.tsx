import React from 'react';
import { QRIcon } from './Icons';
import { Product } from '../types';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onIconClick: () => void;
  disabled: boolean;
  suggestions: Product[];
  onSuggestionClick: (product: Product) => void;
  showNoResults: boolean;
  isMobile?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  onSearchChange, 
  onIconClick, 
  disabled, 
  suggestions, 
  onSuggestionClick,
  showNoResults,
  isMobile
}) => {

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold text-slate-800">Tìm kiếm sản phẩm</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Nhập mã hoặc tên sản phẩm..."
            value={searchQuery}
            onChange={onSearchChange}
            disabled={disabled}
            autoComplete="off"
            className="w-full pl-12 pr-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
             <button
              type="button"
              onClick={onIconClick}
              disabled={disabled}
              title="Quét mã vạch/mã QR"
              className="p-1 rounded-full hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <QRIcon className="h-5 w-5 text-slate-400" />
            </button>
          </div>
          {(suggestions.length > 0 || showNoResults) && (
             <ul className={`absolute z-20 w-full ${isMobile ? 'bottom-full mb-1' : 'mt-1'} bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
                {suggestions.map((suggestion) => (
                    <li
                        key={suggestion.msp}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="px-4 py-2 cursor-pointer hover:bg-indigo-50 transition-colors"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onSuggestionClick(suggestion)}
                    >
                        <p className="font-semibold text-slate-800 truncate" title={suggestion.sanPham}>{suggestion.sanPham}</p>
                        <p className="text-sm text-slate-500">MSP: {suggestion.msp}</p>
                    </li>
                ))}
                {showNoResults && (
                    <li className="px-4 py-2 text-slate-500">Không tìm thấy sản phẩm.</li>
                )}
             </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;