import React from 'react';

interface RoleSelectionScreenProps {
  onRoleSelect: (userType: 'client' | 'owner' | 'admin') => void;
  onBack: () => void;
}

export default function RoleSelectionScreen({ onRoleSelect, onBack }: RoleSelectionScreenProps) {
  return (
    <div className="glass-strong rounded-3xl p-8 text-center relative overflow-hidden">
      {/* Glassmorphism shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-primary-100/50 to-primary-200/50 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/25 to-white/35 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-200/20 to-transparent pointer-events-none"></div>
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-white/80 hover:text-white glass-button rounded-full w-10 h-10 flex items-center justify-center z-10"
      >
        ←
      </button>
      
      {/* Header */}
      <div className="mb-8 relative z-10">
        <h2 className="text-2xl text-gray-700 mb-2 drop-shadow-md">
          Welcome to
        </h2>
        <h1 className="text-4xl font-bold text-gray-900 drop-shadow-lg">
          BoardingHub
        </h1>
      </div>
      
      {/* Illustration */}
      <div className="mb-8 flex justify-center relative z-10">
        <div className="w-32 h-32 glass rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
          <img src="/building.png" alt="Person" className="w-full h-full object-cover" />
        </div>
      </div>
      
      {/* Subtitle */}
      <p className="text-lg text-gray-700 mb-8 relative z-10 drop-shadow-md">
        Discover your ideal boarding house.
      </p>
      
      {/* Role Selection Buttons (Admin restored) */}
      <div className="space-y-4 relative z-10">
        <button
          onClick={() => onRoleSelect('client')}
          className="w-full glass-button text-gray-900 text-lg font-semibold py-4 px-6 rounded-2xl hover:scale-105 active:scale-95"
        >
          Tenant
        </button>

        <button
          onClick={() => onRoleSelect('owner')}
          className="w-full glass-button text-gray-900 text-lg font-semibold py-4 px-6 rounded-2xl hover:scale-105 active:scale-95"
        >
          Landlord
        </button>

        <button
          onClick={() => onRoleSelect('admin')}
          className="w-full glass-button text-gray-900 text-lg font-semibold py-4 px-6 rounded-2xl hover:scale-105 active:scale-95"
        >
          Admin
        </button>
      </div>
    </div>
  );
}
