/**
 * NASA API services for climate data and satellite imagery
 * Provides functions to fetch weather data and generate satellite image URLs
 */

import california2017Data from '../data/california2017.json';

/**
 * Fetches climate data from NASA POWER API for a specific location and date range
 * @param {number} latitude - Latitude coordinate (-90 to 90)
 * @param {number} longitude - Longitude coordinate (-180 to 180)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array|null>} Array of climate data or null if error
 * @example
 * fetchClimateData(36.5, -116.8, '2017-03-01', '2017-03-31')
 * // Returns: [{ date: '2017-03-01', temperature: 22.5, precipitation: 0.0 }, ...]
 */
export async function fetchClimateData(latitude, longitude, startDate, endDate) {
  try {
    // Validate input parameters
    if (!latitude || !longitude || !startDate || !endDate) {
      console.warn('fetchClimateData: Missing required parameters');
      return null;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.warn('fetchClimateData: Invalid coordinate values');
      return null;
    }

    // Convert dates from YYYY-MM-DD to YYYYMMDD format for NASA API
    const formatDateForAPI = (dateStr) => {
      return dateStr.replace(/-/g, '');
    };

    const apiStartDate = formatDateForAPI(startDate);
    const apiEndDate = formatDateForAPI(endDate);

    // Validate date format
    if (!/^\d{8}$/.test(apiStartDate) || !/^\d{8}$/.test(apiEndDate)) {
      console.warn('fetchClimateData: Invalid date format. Use YYYY-MM-DD');
      return null;
    }

    // Construct NASA POWER API URL
    const baseURL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
    const params = new URLSearchParams({
      parameters: 'T2M,PRECTOTCORR',
      community: 'RE',
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      start: apiStartDate,
      end: apiEndDate,
      format: 'JSON'
    });

    const apiURL = `${baseURL}?${params.toString()}`;

    console.log(`Fetching climate data from NASA POWER API: ${apiURL}`);

    // Fetch data with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiURL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BloomWatch/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`NASA POWER API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Parse NASA POWER API response
    if (!data || !data.properties || !data.properties.parameter) {
      console.warn('Invalid response format from NASA POWER API');
      return null;
    }

    const { T2M, PRECTOTCORR } = data.properties.parameter;

    if (!T2M || !PRECTOTCORR) {
      console.warn('Missing temperature or precipitation data in API response');
      return null;
    }

    // Transform data to our format
    const climateData = [];
    const dates = Object.keys(T2M);

    for (const date of dates) {
      const temperature = T2M[date];
      const precipitation = PRECTOTCORR[date];

      if (temperature !== undefined && precipitation !== undefined) {
        // Convert date from YYYYMMDD to YYYY-MM-DD
        const formattedDate = `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`;
        
        climateData.push({
          date: formattedDate,
          temperature: parseFloat(temperature.toFixed(1)),
          precipitation: parseFloat(precipitation.toFixed(2))
        });
      }
    }

    console.log(`Successfully fetched ${climateData.length} days of climate data`);
    return climateData;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('fetchClimateData: Request timeout');
    } else {
      console.warn('fetchClimateData error:', error.message);
    }
    return null;
  }
}

/**
 * Generates NASA GIBS satellite imagery URL for a specific date and layer
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} layer - Satellite layer type
 * @returns {string|null} Template URL with placeholders or null if error
 * @example
 * getGIBSSatelliteURL('2017-03-28', 'MODIS_Terra_NDVI_8Day')
 * // Returns: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2017-03-28/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg'
 */
export function getGIBSSatelliteURL(date, layer) {
  try {
    // Validate input parameters
    if (!date || !layer) {
      console.warn('getGIBSSatelliteURL: Missing required parameters');
      return null;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.warn('getGIBSSatelliteURL: Invalid date format. Use YYYY-MM-DD');
      return null;
    }

    // Validate layer type
    const validLayers = [
      'MODIS_Terra_CorrectedReflectance_TrueColor',
      'MODIS_Terra_NDVI_8Day',
      'MODIS_Aqua_CorrectedReflectance_TrueColor',
      'MODIS_Aqua_NDVI_8Day'
    ];

    if (!validLayers.includes(layer)) {
      console.warn(`getGIBSSatelliteURL: Invalid layer. Must be one of: ${validLayers.join(', ')}`);
      return null;
    }

    // Validate date is not in the future
    const inputDate = new Date(date);
    const today = new Date();
    if (inputDate > today) {
      console.warn('getGIBSSatelliteURL: Date cannot be in the future');
      return null;
    }

    // Construct GIBS URL
    const baseURL = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
    const templateURL = `${baseURL}/${layer}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;

    console.log(`Generated GIBS URL for ${layer} on ${date}`);
    return templateURL;

  } catch (error) {
    console.warn('getGIBSSatelliteURL error:', error.message);
    return null;
  }
}

/**
 * Gets all location data, optionally enhanced with climate data from NASA API
 * @param {boolean} useAPI - Whether to fetch additional climate data (default: false)
 * @returns {Promise<Array>} Array of location objects with optional climate data
 * @example
 * const locations = await getAllLocationsData(false); // Just local data
 * const enhancedLocations = await getAllLocationsData(true); // With climate data
 */
export async function getAllLocationsData(useAPI = false) {
  try {
    console.log('Loading location data...');
    
    // Get base location data from JSON file
    const locations = california2017Data.locations || [];
    
    if (!useAPI) {
      console.log(`Loaded ${locations.length} locations without API enhancement`);
      return locations;
    }

    console.log('Enhancing location data with NASA climate data...');
    
    // Enhance each location with climate data
    const enhancedLocations = await Promise.all(
      locations.map(async (location) => {
        try {
          const [longitude, latitude] = location.coordinates;
          
          // Define date range for climate data (3 months around peak bloom)
          const peakDate = new Date(location.peakBloomDate);
          const startDate = new Date(peakDate);
          startDate.setMonth(startDate.getMonth() - 1); // 1 month before peak
          
          const endDate = new Date(peakDate);
          endDate.setMonth(endDate.getMonth() + 2); // 2 months after peak
          
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];

          // Fetch climate data
          const climateData = await fetchClimateData(
            latitude, 
            longitude, 
            startDateStr, 
            endDateStr
          );

          return {
            ...location,
            climateData: climateData || [],
            apiEnhanced: climateData !== null
          };

        } catch (error) {
          console.warn(`Failed to enhance location ${location.name}:`, error.message);
          return {
            ...location,
            climateData: [],
            apiEnhanced: false
          };
        }
      })
    );

    const successfulEnhancements = enhancedLocations.filter(loc => loc.apiEnhanced).length;
    console.log(`Successfully enhanced ${successfulEnhancements}/${locations.length} locations with climate data`);

    return enhancedLocations;

  } catch (error) {
    console.warn('getAllLocationsData error:', error.message);
    
    // Fallback to basic data if enhancement fails
    try {
      const fallbackData = california2017Data.locations || [];
      console.log('Falling back to basic location data');
      return fallbackData;
    } catch (fallbackError) {
      console.error('Failed to load fallback data:', fallbackError.message);
      return [];
    }
  }
}
