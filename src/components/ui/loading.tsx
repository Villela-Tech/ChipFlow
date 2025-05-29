import React from 'react';

interface LoadingProps {
  message?: string;
  submessage?: string;
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = "Carregando kanban...",
  submessage = "Preparando seu espaço de trabalho"
}) => {
  return (
    <div className="flex items-center justify-center h-full min-h-[600px] bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-6"></div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{message}</h3>
        <p className="text-gray-500">{submessage}</p>
      </div>
    </div>
  );
}; 