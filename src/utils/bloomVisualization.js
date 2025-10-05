import { LOCATION_CONFIGS } from '../config/locationConfig';

/**
 * Get bloom overlay opacity using location-specific thresholds
 */
export function getBloomOverlayOpacity(ndvi, date, locationId) {
  console.log(`=== getBloomOverlayOpacity DEBUG ===`);
  console.log(`Input - NDVI: ${ndvi}, Date: ${date}, LocationID: ${locationId}`);
  
  const location = LOCATION_CONFIGS[locationId];
  if (!location || location.disabled) {
    console.log(`❌ Location ${locationId} not found or disabled`);
    return 0;
  }
  
  console.log(`Location: ${location.name}`);
  
  // Safety check - if location doesn't have thresholds, use default
  if (!location.thresholds) {
    console.warn(`No thresholds for ${locationId}, using defaults`);
    const month = new Date(date).getMonth() + 1;
    console.log(`Month: ${month}`);
    
    if (month >= 6 || month === 1) {
      console.log(`❌ Seasonal filter: Month ${month} - hiding overlay`);
      return 0;
    }
    
    if (ndvi < 0.12) return 0;
    if (ndvi < 0.18) return 0.4;
    if (ndvi < 0.25) return 0.6;
    return 0.8;
  }
  
  const thresholds = location.thresholds;
  console.log(`Thresholds:`, thresholds);
  
  // 1. Seasonal filter: Jun-Jan = no blooms
  const month = new Date(date).getMonth() + 1;
  console.log(`Month: ${month}`);
  
  if (month >= 6 || month === 1) {
    console.log(`❌ Seasonal filter: Month ${month} - hiding overlay`);
    return 0;
  }
  
  console.log(`✅ Seasonal filter passed for month ${month}`);
  
  // 2. NDVI threshold check (location-specific)
  console.log(`Checking NDVI ${ndvi} against thresholds:`, {
    noBloom: thresholds.noBloom,
    emerging: thresholds.emerging,
    blooming: thresholds.blooming,
    peakBloom: thresholds.peakBloom
  });
  
  if (ndvi < thresholds.noBloom) {
    console.log(`❌ Below noBloom threshold: ${ndvi} < ${thresholds.noBloom}`);
    return 0;
  }
  if (ndvi < thresholds.emerging) {
    console.log(`✅ Emerging: ${ndvi} < ${thresholds.emerging} - opacity 0.15`);
    return 0.15;
  }
  if (ndvi < thresholds.blooming) {
    console.log(`✅ Blooming: ${ndvi} < ${thresholds.blooming} - opacity 0.4`);
    return 0.4;
  }
  if (ndvi < thresholds.peakBloom) {
    console.log(`✅ Near peak: ${ndvi} < ${thresholds.peakBloom} - opacity 0.6`);
    return 0.6;
  }
  console.log(`✅ Peak bloom: ${ndvi} >= ${thresholds.peakBloom} - opacity 0.8`);
  return 0.8;
}

/**
 * Get color gradient for bloom overlay
 */
export function getBloomColor(ndvi, locationId) {
  console.log(`=== getBloomColor DEBUG ===`);
  console.log(`Input - NDVI: ${ndvi}, LocationID: ${locationId}`);
  
  const location = LOCATION_CONFIGS[locationId];
  
  // Safety check - if location doesn't exist or doesn't have thresholds, use default
  if (!location || !location.thresholds) {
    console.warn(`Using default color thresholds for ${locationId}`);
    if (ndvi < 0.12) {
      console.log(`Color: Pale yellow (#fef3c7) - below 0.12`);
      return '#fef3c7';
    }
    if (ndvi < 0.18) {
      console.log(`Color: Light yellow (#fde68a) - below 0.18`);
      return '#fde68a';
    }
    if (ndvi < 0.25) {
      console.log(`Color: Yellow-orange (#fbbf24) - below 0.25`);
      return '#fbbf24';
    }
    console.log(`Color: Pink (#ec4899) - above 0.25`);
    return '#ec4899';
  }
  
  const thresholds = location.thresholds;
  console.log(`Using location-specific thresholds:`, thresholds);
  
  if (ndvi < thresholds.emerging) {
    console.log(`Color: Pale yellow (#fef3c7) - below emerging threshold ${thresholds.emerging}`);
    return '#fef3c7';
  }
  if (ndvi < thresholds.blooming) {
    console.log(`Color: Light yellow (#fde68a) - below blooming threshold ${thresholds.blooming}`);
    return '#fde68a';
  }
  if (ndvi < thresholds.peakBloom) {
    console.log(`Color: Yellow-orange (#fbbf24) - below peak threshold ${thresholds.peakBloom}`);
    return '#fbbf24';
  }
  console.log(`Color: Pink (#ec4899) - above peak threshold ${thresholds.peakBloom}`);
  return '#ec4899';
}

/**
 * Get bloom intensity for heatmap visualization
 */
export function getBloomIntensity(ndvi, date) {
  // Seasonal filter: Jun-Jan = no blooms
  const month = new Date(date).getMonth() + 1;
  if (month >= 6 || month === 1) return 0;
  
  // Basic intensity calculation
  if (ndvi < 0.08) return 0;
  if (ndvi < 0.12) return 0.2;
  if (ndvi < 0.18) return 0.6;
  if (ndvi < 0.25) return 1.0;
  return 1.6; // Peak bloom intensity
}

/**
 * Get bloom status text for UI
 */
export function getBloomStatus(ndvi, locationId) {
  console.log(`=== getBloomStatus DEBUG ===`);
  console.log(`Input - NDVI: ${ndvi}, LocationID: ${locationId}`);
  
  const location = LOCATION_CONFIGS[locationId];
  console.log(`Location config:`, location);
  
  if (!location) {
    console.error(`Location ${locationId} not found in LOCATION_CONFIGS`);
    return {
      text: 'No Bloom',
      emoji: '🏜️',
      description: 'Location not found',
      class: 'dormant'
    };
  }
  
  const thresholds = location.thresholds;
  console.log(`Thresholds for ${location.name}:`, thresholds);
  
  if (!thresholds) {
    console.error(`No thresholds found for location ${locationId}`);
    return {
      text: 'No Bloom',
      emoji: '🏜️',
      description: 'No thresholds configured',
      class: 'dormant'
    };
  }
  
  console.log(`Checking NDVI ${ndvi} against thresholds:`, {
    noBloom: thresholds.noBloom,
    emerging: thresholds.emerging,
    blooming: thresholds.blooming,
    peakBloom: thresholds.peakBloom
  });
  
  if (ndvi >= thresholds.peakBloom) {
    console.log(`✅ PEAK BLOOM: ${ndvi} >= ${thresholds.peakBloom}`);
    return {
      text: 'PEAK BLOOM',
      emoji: '🌼',
      description: 'Best viewing time!',
      class: 'peak-bloom'
    };
  } else if (ndvi >= thresholds.blooming) {
    console.log(`✅ BLOOMING: ${ndvi} >= ${thresholds.blooming}`);
    return {
      text: 'Blooming',
      emoji: '🌱',
      description: 'Flowers emerging',
      class: 'blooming'
    };
  } else if (ndvi >= thresholds.emerging) {
    console.log(`✅ EMERGING: ${ndvi} >= ${thresholds.emerging}`);
    return {
      text: 'Emerging',
      emoji: '🌿',
      description: 'Early greening',
      class: 'emerging'
    };
  } else {
    console.log(`❌ NO BLOOM: ${ndvi} < ${thresholds.noBloom}`);
    return {
      text: 'No Bloom',
      emoji: '🏜️',
      description: 'Off-season',
      class: 'dormant'
    };
  }
}