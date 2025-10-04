/**
 * Data extension utilities for generating future bloom data
 * Used to demonstrate forecasting capabilities with fake data
 */

/**
 * Extends NDVI data by repeating patterns from the previous year
 * @param {Array} originalData - Original NDVI data array
 * @param {string} baseYear - Base year to repeat (e.g., '2017')
 * @param {string} targetYear - Target year to generate (e.g., '2018')
 * @returns {Array} Extended NDVI data with seasonal variations
 */
export function extendNDVIData(originalData, baseYear = '2017', targetYear = '2018') {
  if (!originalData || originalData.length === 0) {
    return []
  }

  // Find the peak bloom date in original data
  const peakBloom = originalData.reduce((max, d) => d.ndvi > max.ndvi ? d : max)
  const peakDate = new Date(peakBloom.date)
  
  // Calculate seasonal offset (slight variation each year)
  const seasonalOffset = Math.sin(parseInt(targetYear) * 0.5) * 7 // ±7 days variation
  const newPeakDate = new Date(peakDate)
  newPeakDate.setFullYear(parseInt(targetYear))
  newPeakDate.setDate(newPeakDate.getDate() + seasonalOffset)
  
  // Generate extended data
  const extendedData = []
  
  // Repeat the pattern with slight variations
  originalData.forEach((dataPoint, index) => {
    const originalDate = new Date(dataPoint.date)
    const newDate = new Date(originalDate)
    newDate.setFullYear(parseInt(targetYear))
    
    // Add seasonal variation to NDVI values
    const seasonalVariation = 1 + (Math.sin(index * 0.1) * 0.05) // ±5% variation
    const newNDVI = Math.max(0, Math.min(1, dataPoint.ndvi * seasonalVariation))
    
    extendedData.push({
      date: newDate.toISOString().split('T')[0],
      ndvi: parseFloat(newNDVI.toFixed(2))
    })
  })
  
  return extendedData.sort((a, b) => new Date(a.date) - new Date(b.date))
}

/**
 * Generates forecast data for future dates
 * @param {Array} historicalData - Historical NDVI data
 * @param {string} startDate - Start date for forecast (YYYY-MM-DD)
 * @param {number} days - Number of days to forecast
 * @returns {Array} Forecast NDVI data
 */
export function generateForecastData(historicalData, startDate, days = 90) {
  if (!historicalData || historicalData.length === 0) {
    return []
  }

  // Use the last 30 days of historical data as base pattern
  const recentData = historicalData.slice(-30)
  const forecastData = []
  
  for (let i = 0; i < days; i++) {
    const forecastDate = new Date(startDate)
    forecastDate.setDate(forecastDate.getDate() + i)
    
    // Use cyclical pattern from historical data
    const patternIndex = i % recentData.length
    const baseNDVI = recentData[patternIndex].ndvi
    
    // Add seasonal trend (declining after peak season)
    const daysFromPeak = i - 30 // Assuming peak was ~30 days ago
    const seasonalTrend = Math.max(0.1, 1 - (daysFromPeak * 0.01))
    
    // Add random variation
    const randomVariation = (Math.random() - 0.5) * 0.1
    
    const forecastNDVI = Math.max(0.05, Math.min(0.9, baseNDVI * seasonalTrend + randomVariation))
    
    forecastData.push({
      date: forecastDate.toISOString().split('T')[0],
      ndvi: parseFloat(forecastNDVI.toFixed(2))
    })
  }
  
  return forecastData
}

/**
 * Gets NDVI data for any date, including future dates
 * @param {Array} locationData - Location's NDVI data
 * @param {string} targetDate - Target date (YYYY-MM-DD)
 * @returns {Object|null} NDVI data point or null if not found
 */
export function getNDVIForDate(locationData, targetDate) {
  if (!locationData || !targetDate) return null
  
  // First try to find exact date
  let dataPoint = locationData.find(d => d.date === targetDate)
  
  if (dataPoint) {
    return dataPoint
  }
  
  // If not found and date is in the future, generate forecast
  const target = new Date(targetDate)
  const today = new Date()
  
  if (target > today) {
    const lastDataPoint = locationData[locationData.length - 1]
    const daysDiff = Math.floor((target - new Date(lastDataPoint.date)) / (1000 * 60 * 60 * 24))
    
    if (daysDiff > 0 && daysDiff <= 365) {
      // Generate forecast for this specific date
      const forecastData = generateForecastData(locationData, lastDataPoint.date, daysDiff)
      return forecastData.find(d => d.date === targetDate) || null
    }
  }
  
  // If date is in the past but not in data, interpolate
  const sortedData = [...locationData].sort((a, b) => new Date(a.date) - new Date(b.date))
  const targetTime = new Date(targetDate).getTime()
  
  for (let i = 0; i < sortedData.length - 1; i++) {
    const current = new Date(sortedData[i].date).getTime()
    const next = new Date(sortedData[i + 1].date).getTime()
    
    if (targetTime >= current && targetTime <= next) {
      // Linear interpolation
      const ratio = (targetTime - current) / (next - current)
      const interpolatedNDVI = sortedData[i].ndvi + (sortedData[i + 1].ndvi - sortedData[i].ndvi) * ratio
      
      return {
        date: targetDate,
        ndvi: parseFloat(interpolatedNDVI.toFixed(2))
      }
    }
  }
  
  return null
}
