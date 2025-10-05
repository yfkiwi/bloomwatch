/**
 * Data service for loading and merging historical and prediction data
 */

// Cache for loaded data
let historicalDataCache = null
let predictionDataCache = null

/**
 * Load historical data from CSV
 */
export async function loadHistoricalData() {
  if (historicalDataCache) {
    return historicalDataCache
  }

  try {
    const response = await fetch('/Superbloom_2017-2025_LargerArea(1).csv')
    const csvText = await response.text()
    
    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',')
    const data = lines.slice(1).map(line => {
      const values = line.split(',')
      return {
        date: values[0],
        ndvi: parseFloat(values[1]) || 0,
        ebi: parseFloat(values[2]) || 0,
        cloud_cover: parseFloat(values[3]) || 0
      }
    })

    historicalDataCache = data
    return data
  } catch (error) {
    console.error('Error loading historical data:', error)
    return []
  }
}

/**
 * Load prediction data from CSV
 */
export async function loadPredictionData() {
  if (predictionDataCache) {
    return predictionDataCache
  }

  try {
    const response = await fetch('/data25.csv')
    const csvText = await response.text()
    
    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',')
    const data = lines.slice(1).map(line => {
      const values = line.split(',')
      return {
        date: values[0],
        GDD_day: parseInt(values[1]) || 0,
        ndvi: parseFloat(values[2]) || 0,
        precipitation_mm: parseFloat(values[3]) || 0,
        soil_moisture: parseFloat(values[4]) || 0,
        bloom_pred: parseInt(values[5]) || 0,
        bloom_prob: parseFloat(values[6]) || 0
      }
    })

    predictionDataCache = data
    return data
  } catch (error) {
    console.error('Error loading prediction data:', error)
    return []
  }
}

/**
 * Get merged data for a specific date
 */
export async function getDataForDate(targetDate) {
  const historicalData = await loadHistoricalData()
  const predictionData = await loadPredictionData()
  
  const date = new Date(targetDate)
  const cutoffDate = new Date()
  
  // If date is before cutoff, use historical data
  if (date <= cutoffDate) {
    const historicalPoint = historicalData.find(d => d.date === targetDate)
    return {
      type: 'historical',
      data: historicalPoint,
      isPrediction: false
    }
  } else {
    // If date is after cutoff, use prediction data
    const predictionPoint = predictionData.find(d => d.date === targetDate)
    return {
      type: 'prediction',
      data: predictionPoint,
      isPrediction: true
    }
  }
}

/**
 * Get all available dates for the timeline
 */
export async function getAllAvailableDates() {
  const historicalData = await loadHistoricalData()
  const predictionData = await loadPredictionData()
  
  const historicalDates = historicalData.map(d => d.date)
  const predictionDates = predictionData.map(d => d.date)
  
  return [...new Set([...historicalDates, ...predictionDates])].sort()
}

/**
 * Check if a date is in the prediction range
 */
export function isPredictionDate(date) {
  const targetDate = new Date(date)
  const cutoffDate = new Date()
  return targetDate > cutoffDate
}

/**
 * Get the cutoff date between historical and prediction data
 */
export function getCutoffDate() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get today's date (Oct 4, 2025)
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}
