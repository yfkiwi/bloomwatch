import React from 'react';

/**
 * Empty state component for displaying when no data is available
 * @param {Object} props - Component props
 * @param {string} props.icon - Emoji or icon to display
 * @param {string} props.title - Main title text
 * @param {string} props.message - Descriptive message
 * @param {React.ReactNode} props.children - Optional additional content (buttons, etc.)
 * @param {string} props.className - Additional CSS classes for container
 * @returns {JSX.Element} EmptyState component
 */
const EmptyState = ({ 
  icon = '📭', 
  title = 'No data available', 
  message = 'There is nothing to display at the moment.',
  children,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-6 ${className}`}>
      {/* Icon */}
      <div className="text-6xl mb-4 opacity-60">
        {icon}
      </div>
      
      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      
      {/* Message */}
      <p className="text-gray-600 leading-relaxed max-w-md">
        {message}
      </p>
      
      {/* Additional content */}
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
