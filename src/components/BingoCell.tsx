"use client";

interface Props {
  word: string;
  marked: boolean;
  winning: boolean;
  onClick: () => void;
}

export default function BingoCell({ word, marked, winning, onClick }: Props) {
  const isFree = word === "FREE";
  return (
    <button
      onClick={onClick}
      disabled={isFree}
      className={[
        "flex items-center justify-center p-1 sm:p-2 w-full aspect-square rounded-lg border-2",
        "text-xs sm:text-sm font-medium leading-tight text-center transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-offset-1",
        winning
          ? "border-yellow-400 bg-yellow-300 text-yellow-900 scale-105 shadow-lg focus:ring-yellow-400"
          : marked
          ? "border-green-500 bg-green-500 text-white scale-105 shadow-md focus:ring-green-500"
          : isFree
          ? "border-purple-400 bg-purple-100 text-purple-700 cursor-default"
          : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 cursor-pointer focus:ring-blue-400",
      ].join(" ")}
    >
      <span className="break-words w-full">{word}</span>
    </button>
  );
}
