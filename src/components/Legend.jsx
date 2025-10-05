import React, { useState } from 'react';

/**
 * Map legend component explaining bloom status colors
 * @returns {JSX.Element} Legend component
 */
const Legend = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const legendItems = [
    {
      emoji: '🟢',
      label: 'Peak Bloom',
      description: 'NDVI ≥ 0.6',
      color: '#22c55e'
    },
    {
      emoji: '🟡',
      label: 'Emerging',
      description: 'NDVI 0.4-0.6',
      color: '#eab308'
    },
    {
      emoji: '🔴',
      label: 'No Bloom',
      description: 'NDVI < 0.4',
      color: '#ef4444'
    }
  ];

  // Hide "Emerging" (green) and "Dormant" (gray) rows without affecting other features
  const visibleItems = legendItems.filter(item => item.label !== 'Emerging' && item.label !== 'Dormant')

  return (
    <div className="absolute bottom-4 right-4 z-30">
      {/* Mobile: Collapsed icon */}
      <div className="block md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg flex items-center justify-center hover:bg-white transition-colors duration-200"
          aria-label="Toggle legend"
        >
          <svg 
            className="w-5 h-5 text-gray-700" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
            />
          </svg>
        </button>
        
        {/* Expanded mobile legend */}
        {isExpanded && (
          <div className="absolute bottom-12 right-0 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800">Bloom Status</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close legend"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {visibleItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs">{item.emoji}</span>
                      <span className="text-xs font-medium text-gray-800">{item.label}</span>
                    </div>
                    <div className="text-xs text-gray-600">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden md:block bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Bloom Status</h3>
        <div className="space-y-2">
          {visibleItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-1">
                  <span className="text-xs">{item.emoji}</span>
                  <span className="text-xs font-medium text-gray-800">{item.label}</span>
                </div>
                <div className="text-xs text-gray-600">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile overlay to close legend when clicking outside */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-20 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default Legend;
