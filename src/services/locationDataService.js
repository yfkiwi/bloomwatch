/**
 * Enhanced Data Service for Multiple Locations
 * Handles Anza-Borrego and Carrizo Plain data loading
 */

// Cache for loaded data by location
const locationDataCache = {};

// Location configurations
export const LOCATIONS = {
  'anza-borrego': {
    id: 'anza-borrego',
    name: 'Anza-Borrego Desert State Park',
    coords: [33.2584, -116.3990], // [lat, lng]
    dataFile: '/Superbloom_2017-2025_LargerArea(1).csv', // existing
    color: '#ec4899', // pink
    disabled: false
  },
  'carrizo-plain': {
    id: 'carrizo-plain',
    name: 'Carrizo Plain National Monument',
    coords: [35.1682, -119.5871], // [lat, lng]
    dataFile: '/Superbloom_20172025_CarrizoPlain.csv', // Correct Carrizo Plain data
    color: '#f59e0b', // orange
    disabled: false
  },
  'death-valley': {
    id: 'death-valley',
    name: 'Death Valley National Park',
    coords: [36.5323, -116.9325], // [lat, lng]
    dataFile: null, // No data file - disabled
    color: '#9ca3af', // grey
    disabled: true,
    disabledReason: 'Insufficient bloom signal detected'
  }
};

/**
 * Load data for a specific location
 * @param {string} locationId - Location identifier
 * @returns {Promise<Array>} Parsed data array
 */
export async function loadLocationData(locationId) {
  // Return cached data if available
  if (locationDataCache[locationId]) {
    return locationDataCache[locationId];
  }

  const location = LOCATIONS[locationId];
  if (!location || !location.dataFile) {
    console.warn(`No data file configured for location: ${locationId}`);
    return [];
  }

  try {
    console.log(`=== Loading data for ${locationId} ===`);
    console.log(`Data file: ${location.dataFile}`);
    const response = await fetch(location.dataFile);
    
    console.log(`Response status: ${response.status}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log(`CSV loaded, first 200 chars:`, csvText.substring(0, 200));
    
    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }
    
    const headers = lines[0].split(',');
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',');
      return {
        date: values[0],
        ndvi: parseFloat(values[1]) || 0,
        ebi: parseFloat(values[2]) || 0,
        cloud_cover: parseFloat(values[3]) || 0,
        locationId: locationId // Add location identifier
      };
    }).filter(d => d.date); // Filter out invalid entries

    console.log(`Loaded ${data.length} data points for ${locationId}`);
    
    // Cache the data
    locationDataCache[locationId] = data;
    return data;
  } catch (error) {
    console.error(`Error loading data for ${locationId}:`, error);
    return [];
  }
}

/**
 * Get data for a specific location and date
 * @param {string} locationId - Location identifier
 * @param {string} targetDate - Target date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Data point or null if not found
 */
export async function getLocationDataForDate(locationId, targetDate) {
  const data = await loadLocationData(locationId);
  return data.find(d => d.date === targetDate) || null;
}

/**
 * Get all available dates for a location
 * @param {string} locationId - Location identifier
 * @returns {Promise<Array>} Array of date strings
 */
export async function getLocationDates(locationId) {
  const data = await loadLocationData(locationId);
  return data.map(d => d.date).sort();
}

/**
 * Get all available dates across all locations
 * @returns {Promise<Array>} Combined array of unique date strings
 */
export async function getAllAvailableDates() {
  const allDates = new Set();
  
  for (const locationId of Object.keys(LOCATIONS)) {
    if (LOCATIONS[locationId].disabled) continue;
    
    const dates = await getLocationDates(locationId);
    dates.forEach(date => allDates.add(date));
  }
  
  return Array.from(allDates).sort();
}

/**
 * Get location configuration by ID
 * @param {string} locationId - Location identifier
 * @returns {Object|null} Location configuration or null
 */
export function getLocationConfig(locationId) {
  return LOCATIONS[locationId] || null;
}

/**
 * Get all location configurations
 * @returns {Object} All location configurations
 */
export function getAllLocationConfigs() {
  return LOCATIONS;
}

/**
 * Check if a location is enabled
 * @param {string} locationId - Location identifier
 * @returns {boolean} True if location is enabled
 */
export function isLocationEnabled(locationId) {
  const location = LOCATIONS[locationId];
  return location && !location.disabled;
}

/**
 * Clear cache for a specific location
 * @param {string} locationId - Location identifier
 */
export function clearLocationCache(locationId) {
  if (locationId) {
    delete locationDataCache[locationId];
  } else {
    // Clear all cache
    Object.keys(locationDataCache).forEach(key => {
      delete locationDataCache[key];
    });
  }
}

/**
 * Get data range for a location
 * @param {string} locationId - Location identifier
 * @returns {Promise<Object>} Object with startDate and endDate
 */
export async function getLocationDataRange(locationId) {
  const data = await loadLocationData(locationId);
  if (data.length === 0) {
    return { startDate: null, endDate: null };
  }
  
  const dates = data.map(d => d.date).sort();
  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1]
  };
}
