// LoadingOverlay.js

import React from 'react';
import '../assets/css/Loader.css';

const LoadingComponent = ({ isLoading, title = '' }) => {
    return (
        <div id="loading-screen" className={`fixed inset-0 opacity-80 bg-gradient-to-br from-white via-blue-50 to-white flex items-center justify-center z-50 ${isLoading ? 'visible' : 'hidden'}`}>
          <div className="lds-grid text-blue-500">
            {[...Array(9)].map((_, index) => (
              <div key={index} className="w-4 h-4 bg-current rounded-full animate-pulse" style={{
                animationDelay: `${(index % 3) * 0.1 + Math.floor(index / 3) * 0.1}s`
              }}></div>
            ))}
          </div>
        </div>
      );
};

export default LoadingComponent;
