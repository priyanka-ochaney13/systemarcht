'use client';

import React from 'react';
import { Zap } from 'lucide-react';

export const CustomLoader = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 153, 0, 0.5); }
          50% { box-shadow: 0 0 40px rgba(255, 153, 0, 0.8); }
        }
        
        @keyframes pulse-ring {
          0% { 
            transform: scale(0.5);
            opacity: 1;
          }
          100% { 
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loader-icon {
          animation: float 2s ease-in-out infinite;
        }
        
        .loader-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        .loader-ring {
          animation: pulse-ring 2s ease-out infinite;
        }
        
        .loader-spinner {
          animation: rotate 3s linear infinite;
        }
      `}</style>
      
      <div className="flex flex-col items-center gap-8">
        {/* Outer rotating ring */}
        <div className="relative w-24 h-24">
          {/* Inner floating icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="loader-icon">
              <Zap 
                className="loader-glow" 
                size={48} 
                style={{ color: '#FF9900' }}
              />
            </div>
          </div>
          
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full border-2 border-yellow-200 loader-ring" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-yellow-500 border-r-yellow-500 loader-spinner" />
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-lg">
            SystemArcht
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Loading your architecture playground...
          </p>
          
          {/* Animated dots */}
          <div className="flex justify-center gap-1 mt-3">
            <span 
              className="w-2 h-2 bg-yellow-500 rounded-full"
              style={{
                animation: 'bounce 1.4s infinite',
                animationDelay: '0s'
              }}
            />
            <span 
              className="w-2 h-2 bg-yellow-500 rounded-full"
              style={{
                animation: 'bounce 1.4s infinite',
                animationDelay: '0.2s'
              }}
            />
            <span 
              className="w-2 h-2 bg-yellow-500 rounded-full"
              style={{
                animation: 'bounce 1.4s infinite',
                animationDelay: '0.4s'
              }}
            />
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
