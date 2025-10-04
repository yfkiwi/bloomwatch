import { useState } from 'react'

function TimeSlider({ currentDate, onChange }) {
  const startDate = new Date('2017-01-01')
  const endDate = new Date('2018-05-31') // Extended to include 2018 for future demo
  
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

  const handleChange = (e) => {
    const newDate = valueToDate(e.target.value)
    onChange(newDate)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-xl z-[9999] pointer-events-auto">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-green-700 whitespace-nowrap">
          📅 {new Date(currentDate).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </span>
        
        <input
          type="range"
          min="0"
          max={maxValue}
          value={currentValue}
          onChange={handleChange}
          className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 hover:accent-green-700 transition-colors"
        />
        
        <div className="flex gap-2 text-sm text-gray-600 font-medium">
          <span>Jan 2017</span>
          <span>→</span>
          <span>May 2018</span>
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Drag to explore bloom progression over time
      </div>
    </div>
  )
}

export default TimeSlider