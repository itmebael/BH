import React from 'react';

interface HomeScreenProps {
  onBack: () => void;
}

export default function HomeScreen({ onBack }: HomeScreenProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center relative">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
      >
        ←
      </button>
      
      {/* Welcome Message */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome to BoardingHub!
        </h1>
        <p className="text-gray-600">
          Your ideal boarding house awaits
        </p>
      </div>
      
      {/* Main Content */}
      <div className="space-y-6">
        <div className="bg-blue-50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">
            🏠 Find Your Perfect Home
          </h2>
          <p className="text-blue-600 text-sm">
            Browse through available boarding houses in your area
          </p>
        </div>
        
        <div className="bg-green-50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-3">
            📍 Location Services
          </h2>
          <p className="text-green-600 text-sm">
            Find properties near your school or workplace
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-purple-800 mb-3">
            💬 Contact Landlords
          </h2>
          <p className="text-purple-600 text-sm">
            Get in touch with landlords directly
          </p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-8 space-y-4">
        <button className="w-full bg-blue-600 text-white text-lg font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300">
          Browse Properties
        </button>
        
        <button className="w-full bg-gray-200 text-gray-800 text-lg font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300">
          View Favorites
        </button>
      </div>
    </div>
  );
}
