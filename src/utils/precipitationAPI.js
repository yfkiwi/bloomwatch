/**
 * Fetch precipitation with 8-second timeout
 */
export async function fetchPrecipitationWithTimeout(lat, lon, startDate, endDate, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const baseURL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
    const params = new URLSearchParams({
      parameters: 'PRECTOTCORR',
      community: 'AG',
      longitude: lon.toString(),   // Ensure string
      latitude: lat.toString(),    // Ensure string
      start: startDate,            // Format: YYYYMMDD
      end: endDate,
      format: 'JSON'
    });
    
    const url = `${baseURL}?${params.toString()}`;
    console.log('Fetching precipitation from:', url);
    
    const response = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('Precipitation API error:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Precipitation data received:', Object.keys(data.properties.parameter.PRECTOTCORR).length, 'days');
    
    return {
      success: true,
      data: data.properties.parameter.PRECTOTCORR
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.warn('Precipitation API error:', error.message);
    return {
      success: false,
      error: error.name === 'AbortError' ? 'timeout' : 'fetch_failed'
    };
  }
}

/**
 * Calculate winter precipitation (Dec-Feb)
 */
export function calculateWinterPrecipitation(precipData, year) {
  if (!precipData) return null;
  
  const winterDates = [];
  
  // December of previous year
  for (let day = 1; day <= 31; day++) {
    winterDates.push(`${year-1}12${String(day).padStart(2, '0')}`);
  }
  // January
  for (let day = 1; day <= 31; day++) {
    winterDates.push(`${year}01${String(day).padStart(2, '0')}`);
  }
  // February
  for (let day = 1; day <= 29; day++) {
    winterDates.push(`${year}02${String(day).padStart(2, '0')}`);
  }
  
  let total = 0;
  let count = 0;
  
  winterDates.forEach(dateKey => {
    if (precipData[dateKey] !== undefined && precipData[dateKey] !== null) {
      total += precipData[dateKey];
      count++;
    }
  });
  
  return count > 0 ? total : null;
}

/**
 * Calculate spring peak NDVI (Mar-May)
 */
export function getSpringPeakNDVI(ndviData, year) {
  if (!ndviData || !Array.isArray(ndviData)) return 0;
  
  // Filter for spring months (March-May) of the given year
  const springData = ndviData.filter(dataPoint => {
    const date = new Date(dataPoint.date);
    const pointYear = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    
    return pointYear === year && month >= 3 && month <= 5;
  });
  
  if (springData.length === 0) return 0;
  
  // Find the peak NDVI value in spring
  const peakNDVI = Math.max(...springData.map(point => point.ndvi || 0));
  
  return peakNDVI;
}

/**
 * Fetch precipitation for multiple locations
 */
export async function fetchPrecipitationForLocations(locations, startDate, endDate, timeoutMs = 8000) {
  const results = {};
  
  // Process locations in parallel with individual timeouts
  const promises = Object.entries(locations).map(async ([locationId, location]) => {
    try {
      const result = await fetchPrecipitationWithTimeout(
        location.coords[0], // lat
        location.coords[1], // lon
        startDate,
        endDate,
        timeoutMs
      );
      
      return { locationId, result };
    } catch (error) {
      console.warn(`Precipitation fetch failed for ${locationId}:`, error.message);
      return { 
        locationId, 
        result: { success: false, error: 'fetch_failed' }
      };
    }
  });
  
  const responses = await Promise.all(promises);
  
  // Process results
  responses.forEach(({ locationId, result }) => {
    if (result.success) {
      results[locationId] = result.data;
    } else {
      results[locationId] = null;
    }
  });
  
  return {
    success: true,
    data: results
  };
}