'use client';

interface BingoCellProps {
  word: string;
  marked: boolean;
  winning: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function BingoCell({ word, marked, winning, onClick, disabled }: BingoCellProps) {
  const isFree = word === 'FREE';

  return (
    <button
      onClick={onClick}
      disabled={disabled || isFree}
      className={[
        'relative flex items-center justify-center p-1 sm:p-2',
        'w-full aspect-square rounded-lg border-2 text-center',
        'text-xs sm:text-sm font-medium leading-tight transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        winning
          ? 'border-yellow-400 bg-yellow-300 text-yellow-900 shadow-lg scale-105 focus:ring-yellow-400'
          : marked
          ? 'border-green-500 bg-green-500 text-white shadow-md scale-105 focus:ring-green-500'
          : isFree
          ? 'border-purple-400 bg-purple-100 text-purple-700 cursor-default'
          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 cursor-pointer focus:ring-blue-400',
        disabled && !isFree ? 'opacity-60 cursor-not-allowed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="break-words w-full">{word}</span>
      {marked && !winning && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-30"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        </span>
      )}
    </button>
  );
}
