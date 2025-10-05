/**
 * Data helper functions for extracting NDVI values from location data
 */

/**
 * Get NDVI value for a specific date from location data
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} ndviData - Array of data objects with date and ndvi properties
 * @returns {number} NDVI value or 0 if not found
 */
export function getNDVIForDate(dateString, ndviData) {
  if (!ndviData || ndviData.length === 0) {
    console.warn('getNDVIForDate: No data');
    return 0;
  }
  
  // Normalize date to YYYY-MM-DD format
  const targetDate = dateString.split('T')[0]; // Remove time if present
  
  // Try exact match first
  const exactMatch = ndviData.find(d => d.date === targetDate);
  if (exactMatch) {
    console.log(`✓ Exact match for ${targetDate}: NDVI ${exactMatch.ndvi}`);
    return exactMatch.ndvi;
  }
  
  // If no exact match, find closest date within 7 days
  const targetTime = new Date(targetDate).getTime();
  const weekInMs = 7 * 24 * 60 * 60 * 1000;
  
  let closest = null;
  let minDiff = Infinity;
  
  ndviData.forEach(d => {
    const dataTime = new Date(d.date).getTime();
    const diff = Math.abs(dataTime - targetTime);
    
    // Only consider dates within 7 days
    if (diff < minDiff && diff < weekInMs) {
      minDiff = diff;
      closest = d;
    }
  });
  
  if (closest) {
    console.log(`⚠ Closest match for ${targetDate}: ${closest.date} (NDVI ${closest.ndvi})`);
    return closest.ndvi;
  }
  
  console.error(`✗ No data found near ${targetDate}`);
  return 0;
}

/**
 * Convert location data array to date-indexed object for faster lookups
 * @param {Array} dataArray - Array of data objects
 * @returns {Object} Object with date strings as keys
 */
export function createDateIndex(dataArray) {
  if (!dataArray || dataArray.length === 0) {
    return {};
  }
  
  const dateIndex = {};
  dataArray.forEach(item => {
    if (item.date) {
      dateIndex[item.date] = item;
    }
  });
  
  console.log(`Created date index with ${Object.keys(dateIndex).length} dates`);
  return dateIndex;
}

/**
 * Get date range from data array
 * @param {Array} dataArray - Array of data objects
 * @returns {Object} Object with startDate and endDate
 */
export function getDateRange(dataArray) {
  if (!dataArray || dataArray.length === 0) {
    return { startDate: null, endDate: null };
  }
  
  const dates = dataArray.map(d => d.date).filter(Boolean).sort();
  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1]
  };
}

/**
 * Determine if a date should use historical or forecast data
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} True if historical, false if forecast
 */
export function isHistoricalDate(dateString) {
  const targetDate = new Date(dateString);
  const today = new Date();
  
  // Set time to midnight for fair comparison
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return targetDate <= today;
}

/**
 * Merge historical and forecast data intelligently
 * @param {Array} historicalData - Historical data array
 * @param {Array} forecastData - Forecast data array
 * @param {string} selectedDate - Currently selected date
 * @returns {Object} Object with data, source, and optional error
 */
export function getMergedData(historicalData, forecastData, selectedDate) {
  // If selected date is historical, only use historical
  if (isHistoricalDate(selectedDate)) {
    return {
      data: historicalData || [],
      source: 'historical'
    };
  }
  
  // For forecast dates, check if we have forecast data
  if (!forecastData || forecastData.length === 0) {
    console.warn('Forecast date selected but no forecast data available');
    return {
      data: [],
      source: 'forecast',
      error: 'No forecast data available'
    };
  }
  
  return {
    data: forecastData,
    source: 'forecast'
  };
}