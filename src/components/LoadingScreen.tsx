import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      <img 
        src="/logologin.png"
        alt="Logo"
        className="w-32 h-auto mb-8 animate-pulse"
      />
      <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin"></div>
      <p className="mt-6 text-white text-lg">Carregando...</p>
    </div>
  );
};

export default LoadingScreen;