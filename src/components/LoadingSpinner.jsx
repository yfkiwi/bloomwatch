import React from 'react';

/**
 * Loading spinner component with optional message
 * @param {Object} props - Component props
 * @param {string} props.message - Optional loading message to display
 * @param {string} props.size - Size of spinner ('sm', 'md', 'lg')
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} LoadingSpinner component
 */
const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'md', 
  className = '' 
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      spinner: 'h-4 w-4',
      text: 'text-sm'
    },
    md: {
      spinner: 'h-8 w-8',
      text: 'text-base'
    },
    lg: {
      spinner: 'h-12 w-12',
      text: 'text-lg'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {/* Spinner */}
      <div className={`${config.spinner} animate-spin`}>
        <svg 
          className="w-full h-full text-bloom-600" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      
      {/* Loading message */}
      {message && (
        <p className={`${config.text} text-gray-600 text-center`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
