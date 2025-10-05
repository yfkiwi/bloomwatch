import { useState, useEffect } from 'react'
import { isPredictionDate, getCutoffDate, getTodayDate } from '../services/dataService'

function TimeSlider({ currentDate, onChange, showFullHistory, onToggleHistory }) {
  const TODAY = new Date()
  const PREDICTION_END = new Date('2025-08-31')
  
  // Timeline range calculator
  const getTimelineRange = () => {
    if (showFullHistory) {
      return {
        start: new Date('2017-01-01'),
        end: new Date('2026-6-31')
      };
    }
    return {
      start: new Date('2024-01-01'),
      end: new Date('2026-6-31')
    };
  };

  const range = getTimelineRange()
  const selectedDate = new Date(currentDate)
  
  // Helper functions
  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    
    if (newDate >= range.start && newDate <= range.end) {
      onChange(newDate.toISOString().split('T')[0]);
    }
  };

  const getProgressPercent = () => {
    const total = range.end - range.start;
    const current = selectedDate - range.start;
    return (current / total) * 100;
  };

  const getTodayPosition = () => {
    const total = range.end - range.start;
    const current = TODAY - range.start;
    return Math.max(0, Math.min(100, (current / total) * 100));
  };

  const toggleHistoricalView = () => {
    onToggleHistory(!showFullHistory);
    if (!showFullHistory) {
      // Expanding to full history - jump to 2017 superbloom
      onChange('2017-03-12');
    } else {
      // Collapsing to recent - reset to today
      onChange(TODAY.toISOString().split('T')[0]);
    }
  };

  const isHistorical = !isPredictionDate(currentDate);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'date') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          changeDate(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          changeDate(1);
          break;
        case 'Home':
          e.preventDefault();
          onChange(range.start.toISOString().split('T')[0]);
          break;
        case 'End':
          e.preventDefault();
          onChange(range.end.toISOString().split('T')[0]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentDate, onChange, range]);

  return (
    <div className="fixed bottom-4 left-4 z-[9999] pointer-events-auto">
      <div className="bg-white/70 backdrop-blur-sm border border-gray-200/30 rounded-2xl p-4 shadow-lg max-w-sm">
        <div className="space-y-3">
          
          {/* Date Display */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">📅</span>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => onChange(e.target.value)}
              min={range.start.toISOString().split('T')[0]}
              max={range.end.toISOString().split('T')[0]}
              className="text-sm font-medium bg-transparent border-none cursor-pointer hover:bg-gray-50/50 rounded px-2 py-1 transition-colors"
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-colors"
              title="Previous Day (←)"
            >
              <span className="text-sm">◀</span>
            </button>
            
            <button
              onClick={() => changeDate(1)}
              className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-colors"
              title="Next Day (→)"
            >
              <span className="text-sm">▶</span>
            </button>
          </div>

          {/* Compact Timeline Slider */}
          <div className="relative">
            <input
              type="range"
              min={range.start.getTime()}
              max={range.end.getTime()}
              value={selectedDate.getTime()}
              onChange={(e) => onChange(new Date(parseInt(e.target.value)).toISOString().split('T')[0])}
              step={86400000}
              className="w-full h-2 bg-gray-200/50 rounded-lg appearance-none cursor-pointer timeline-slider"
              style={{
                background: `linear-gradient(to right, 
                  #f8b5d1 0%, 
                  #f8b5d1 ${getProgressPercent()}%, 
                  #e5e7eb ${getProgressPercent()}%, 
                  #e5e7eb 100%)`
              }}
            />
            
            {/* Today Marker */}
            <div 
              className="absolute top-0 h-3 w-0.5 bg-orange-400 rounded-full"
              style={{ left: `${getTodayPosition()}%` }}
              title="Today"
            />
            
            {/* Timeline Labels */}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{range.start.getFullYear()}</span>
              <span className="text-orange-500 font-medium">Now</span>
              <span>{range.end.getFullYear()}</span>
            </div>
          </div>

          {/* Data type indicator */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium mx-auto w-fit ${
            isHistorical 
              ? 'bg-green-100/80 text-green-700' 
              : 'bg-orange-100/80 text-orange-700'
          }`}>
            {isHistorical ? '📊 Historical' : '🔮 Forecast'}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1 justify-center">
            <button 
              onClick={() => onChange('2017-03-12')}
              className="px-2 py-1 bg-pink-100/80 text-pink-700 rounded-full text-xs hover:bg-pink-200/80 transition"
            >
              🌸 2017
            </button>
            <button 
              onClick={() => onChange(TODAY.toISOString().split('T')[0])}
              className="px-2 py-1 bg-gray-100/80 text-gray-700 rounded-full text-xs hover:bg-gray-200/80 transition"
            >
              📅 Today
            </button>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={toggleHistoricalView}
            className="w-full py-1.5 text-xs border border-dashed border-gray-300/50 rounded-lg text-gray-600 hover:border-pink-300/50 hover:text-pink-600 transition"
          >
            {showFullHistory ? '📅 Recent (2024-2025)' : '📊 Full History (2017-2025)'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimeSlider