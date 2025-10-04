import { useState } from 'react'

function TimeSlider({ currentDate, onChange }) {
  const startDate = new Date('2017-01-01')
  const endDate = new Date('2017-05-31')
  
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
    <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-95 border-t border-gray-300 p-4 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
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
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          
          <div className="flex gap-2 text-xs text-gray-600">
            <span>Jan 2017</span>
            <span>→</span>
            <span>May 2017</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimeSlider