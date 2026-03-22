"use client";

export default function WinModal({ playerName, onClose }: { playerName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="text-7xl mb-4">🎉</div>
        <h2 className="text-3xl font-black text-green-600 mb-2">BINGO!</h2>
        <p className="text-xl text-gray-700 mb-6">
          <span className="font-bold">{playerName}</span> hat gewonnen!
        </p>
        <button
          onClick={onClose}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors"
        >
          Weiter spielen
        </button>
      </div>
    </div>
  );
}
