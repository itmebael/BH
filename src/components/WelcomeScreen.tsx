import React from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="glass-strong rounded-3xl p-8 text-center relative overflow-hidden">
      {/* Glassmorphism shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-primary-100/50 to-primary-200/50 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/25 to-white/35 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-200/20 to-transparent pointer-events-none"></div>
      
      {/* Rental Building Illustration */}
      <div className="mb-8 flex justify-center relative z-10">
        <div className="glass rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl p-4">
          <img src="/building.png" alt="Building" className="max-w-full max-h-32 object-contain" />
        </div>
      </div>
      
      {/* Title */}
      <h1 className="text-4xl font-bold text-gray-900 mb-4 relative z-10 drop-shadow-lg">
        BoardingHub.
      </h1>
      
      {/* Subtitle */}
      <p className="text-xl text-gray-700 mb-8 relative z-10 drop-shadow-md">
        Find your perfect boarding house.
      </p>
      
      {/* Start Button */}
      <button
        onClick={onStart}
        className="w-full glass-button text-gray-900 text-2xl font-bold py-4 px-6 rounded-2xl relative z-10 hover:scale-105 active:scale-95"
      >
        Start
      </button>
    </div>
  );
}
