import { useState, useEffect } from 'react'
import { isPredictionDate, getCutoffDate, getTodayDate } from '../services/dataService'

function TimeSlider({ currentDate, onChange }) {
  const startDate = new Date('2017-01-01')
  const endDate = new Date('2025-12-31') // Extended to include full 2025 predictions
  const cutoffDate = new Date(getCutoffDate())
  const todayDate = new Date(getTodayDate())
  
  // Convert date to days since start
  const dateToValue = (date) => {
    const d = new Date(date)
    return Math.floor((d - startDate) / (1000 * 60 * 60 * 24))
  }
  
  // Convert days to date string
  const valueToDate = (value) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + parseInt(value))
    return d.toISOString().split('T')[0]
  }
  
  const maxValue = dateToValue(endDate)
  const currentValue = dateToValue(currentDate)
  const cutoffValue = dateToValue(cutoffDate)
  const todayValue = dateToValue(todayDate)

  const handleChange = (e) => {
    const newDate = valueToDate(e.target.value)
    onChange(newDate)
  }

  const isCurrentlyPrediction = isPredictionDate(currentDate)
  const modeColor = isCurrentlyPrediction ? 'orange' : 'green'
  const modeIcon = isCurrentlyPrediction ? '🔮' : '📊'
  const modeText = isCurrentlyPrediction ? 'Prediction Mode' : 'Historical Mode'

  const handleDateInputChange = (e) => {
    const newDate = e.target.value
    if (newDate) {
      onChange(newDate)
    }
  }

  const jumpToToday = () => {
    onChange(getTodayDate())
  }

  const jumpToPeak2017 = () => {
    onChange('2017-03-12') // Peak bloom date from 2017
  }

  const jumpToCutoff = () => {
    onChange(getCutoffDate())
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'date') return
      
      const current = new Date(currentDate)
      const oneDay = 24 * 60 * 60 * 1000
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          const prevDay = new Date(current.getTime() - oneDay)
          if (prevDay >= startDate) {
            onChange(prevDay.toISOString().split('T')[0])
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          const nextDay = new Date(current.getTime() + oneDay)
          if (nextDay <= endDate) {
            onChange(nextDay.toISOString().split('T')[0])
          }
          break
        case 'Home':
          e.preventDefault()
          onChange('2017-01-01')
          break
        case 'End':
          e.preventDefault()
          onChange('2025-12-31')
          break
        case 't':
        case 'T':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            jumpToCutoff()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentDate, onChange, startDate, endDate])

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-xl z-[9999] pointer-events-auto">
      {/* Header with date and mode */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-green-700 whitespace-nowrap">
            📅 {new Date(currentDate).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isCurrentlyPrediction 
              ? 'bg-orange-100 text-orange-700 border border-orange-200' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {modeIcon} {modeText}
          </span>
        </div>
        
        {/* Quick navigation buttons */}
        <div className="flex gap-2">
          <button
            onClick={jumpToPeak2017}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            title="Jump to 2017 Peak Bloom"
          >
            🏆 2017 Peak
          </button>
          <button
            onClick={jumpToCutoff}
            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
            title="Jump to Today"
          >
            📍 Today
          </button>
        </div>
      </div>

      {/* Main slider area */}
      <div className="flex items-center gap-4">
        {/* Date picker input */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Exact Date</label>
          <input
            type="date"
            value={currentDate}
            onChange={handleDateInputChange}
            min="2017-01-01"
            max="2025-12-31"
            className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Compact slider */}
        <div className="flex-1 relative max-w-md">
          <input
            type="range"
            min="0"
            max={maxValue}
            value={currentValue}
            onChange={handleChange}
            className={`w-full h-4 rounded-lg appearance-none cursor-pointer transition-colors ${
              isCurrentlyPrediction 
                ? 'accent-orange-600 hover:accent-orange-700' 
                : 'accent-green-600 hover:accent-green-700'
            }`}
            style={{
              background: `linear-gradient(to right, 
                #22c55e 0%, 
                #22c55e ${(cutoffValue / maxValue) * 100}%, 
                #f97316 ${(cutoffValue / maxValue) * 100}%, 
                #f97316 100%)`
            }}
          />
          
          {/* Today marker */}
          <div 
            className="absolute top-0 w-1 h-4 bg-red-500 rounded-full"
            style={{ left: `${(todayValue / maxValue) * 100}%` }}
            title="Today (Oct 4, 2025)"
          />
        </div>

        {/* Year range display */}
        <div className="flex flex-col items-center text-xs text-gray-600">
          <span className="font-medium">2017-2025</span>
          <span className="text-gray-400">9 years</span>
        </div>
      </div>
      
      {/* Footer with legend and instructions */}
      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
        <div className="flex flex-col">
          <span>Drag slider or use date picker to navigate</span>
          <span className="text-gray-400">Keyboard: ← → (day), Home/End (range), Ctrl+T (today)</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Historical Data
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            ML Predictions
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Today
          </span>
        </div>
      </div>
    </div>
  )
}

export default TimeSlider