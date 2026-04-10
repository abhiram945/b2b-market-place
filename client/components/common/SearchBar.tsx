import React from 'react';
import { Search } from '../icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  showClear?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  className = '',
  disabled = false,
  showClear = false,
}) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex-1 min-w-[250px] ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="block w-full h-10 pl-10 pr-40 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 outline-none focus:border-brand-red transition-all"
      />
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="absolute inset-y-1.5 right-[82px] px-3 border border-gray-200 bg-white text-[9px] font-black uppercase tracking-widest rounded text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-default cursor-pointer"
        >
          clear
        </button>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="absolute inset-y-1.5 right-1.5 px-3 bg-black hover:bg-brand-red text-white text-[9px] font-black uppercase tracking-widest rounded transition-all active:scale-95 disabled:opacity-50 disabled:cursor-default cursor-pointer"
      >
        search
      </button>
    </form>
  );
};

export default SearchBar;
