import React from 'react';
import { calculateWinterPrecipitation, getSpringPeakNDVI } from '../utils/precipitationAPI';

/**
 * Bloom Status Card Component
 * Displays winter precipitation, spring NDVI, and bloom classification
 */
function BloomStatusCard({ location, year, precipData, ndviData }) {
  const winterPrecip = calculateWinterPrecipitation(precipData, year);
  const springNDVI = getSpringPeakNDVI(ndviData, year);
  
  // Bloom classification thresholds
  const PRECIP_THRESHOLD = 100; // mm
  const NDVI_THRESHOLD = 0.45;
  
  const isBloom = winterPrecip > PRECIP_THRESHOLD && springNDVI > NDVI_THRESHOLD;
  
  // Handle missing data
  if (!precipData || !ndviData || ndviData.length === 0) {
    return (
      <div className="bloom-status-card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {year} Bloom Analysis - {location?.name || 'Unknown Location'}
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-500 text-sm">
            ⏳ Loading precipitation data...
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bloom-status-card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {year} Bloom Analysis - {location?.name || 'Unknown Location'}
      </h3>
      
      <div className="metrics-grid">
        <div className="metric">
          <div className="metric-label">Winter Precipitation</div>
          <div className="metric-value">{winterPrecip.toFixed(0)} mm</div>
          <div className={`metric-status ${winterPrecip > PRECIP_THRESHOLD ? 'wet' : 'dry'}`}>
            {winterPrecip > PRECIP_THRESHOLD ? '🌧️ Wet winter' : '☀️ Dry winter'}
          </div>
        </div>
        
        <div className="metric">
          <div className="metric-label">Spring Peak NDVI</div>
          <div className="metric-value">{springNDVI.toFixed(2)}</div>
          <div className={`metric-status ${springNDVI > NDVI_THRESHOLD ? 'green' : 'low'}`}>
            {springNDVI > NDVI_THRESHOLD ? '🌼 High greening' : '🏜️ Low greening'}
          </div>
        </div>
      </div>
      
      <div className={`bloom-verdict ${isBloom ? 'confirmed' : 'no-bloom'}`}>
        {isBloom ? (
          <>
            <span className="verdict-badge">✅ Confirmed Bloom</span>
            <p className="text-sm mt-2">
              Wet winter triggered exceptional spring bloom
            </p>
          </>
        ) : (
          <>
            <span className="verdict-badge">⭕ No Bloom Detected</span>
            <p className="text-sm mt-2">
              {winterPrecip <= PRECIP_THRESHOLD && springNDVI <= NDVI_THRESHOLD 
                ? 'Insufficient precipitation and vegetation response'
                : winterPrecip <= PRECIP_THRESHOLD 
                ? 'Insufficient precipitation'
                : 'Insufficient vegetation response'
              }
            </p>
          </>
        )}
      </div>
      
      {/* Additional context */}
      <div className="mt-4 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Precip threshold: {PRECIP_THRESHOLD}mm</span>
          <span>NDVI threshold: {NDVI_THRESHOLD}</span>
        </div>
      </div>
    </div>
  );
}

export default BloomStatusCard;
