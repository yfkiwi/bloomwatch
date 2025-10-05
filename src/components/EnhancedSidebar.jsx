import React, { useState, useEffect } from 'react';
import { getLocationDataForDate, getLocationConfig, getAllLocationConfigs } from '../services/locationDataService';
import { fetchPrecipitationWithTimeout, fetchPrecipitationForLocations } from '../utils/precipitationAPI';
import locationMetadata from '../data/locationMetadata.json';
import BloomStatusCard from './BloomStatusCard';
import PrecipNDVIChart from './PrecipNDVIChart';
import NDVIChart from './NDVIChart';

// Color function based on NDVI
const getBloomColor = (ndvi) => {
  if (ndvi < 0.08) return '#9ca3af';  // Gray - dormant
  if (ndvi < 0.12) return '#86efac';  // Light green - emerging
  if (ndvi < 0.18) return '#fbbf24';  // Yellow - blooming
  return '#f8b5d1';                    // Soft pink - peak bloom
};

const getBloomStatusText = (ndvi) => {
  if (ndvi < 0.08) return 'Dormant';
  if (ndvi < 0.12) return 'Emerging';
  if (ndvi < 0.18) return 'Blooming';
  return 'Peak Bloom';
};

const MetricCard = ({ label, value, color }) => (
  <div className="bg-white p-3 rounded-lg border-2 border-gray-100">
    <div className="text-sm text-gray-600">{label}</div>
    <div className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</div>
  </div>
);

const SidebarContent = ({ selectedDate, locationData, locationId, metadata }) => {
  const [precipitationData, setPrecipitationData] = useState(null);
  const [isLoadingPrecip, setIsLoadingPrecip] = useState(false);
  const [precipError, setPrecipError] = useState(null);
  const [ndviData, setNdviData] = useState([]);
  const [isLoadingNDVI, setIsLoadingNDVI] = useState(false);

  // Load NDVI data for the location
  useEffect(() => {
    async function loadNDVIData() {
      if (!locationId) return;
      
      setIsLoadingNDVI(true);
      try {
        const { loadLocationData } = await import('../services/locationDataService');
        const data = await loadLocationData(locationId);
        setNdviData(data || []);
      } catch (error) {
        console.error('Error loading NDVI data:', error);
        setNdviData([]);
      } finally {
        setIsLoadingNDVI(false);
      }
    }

    loadNDVIData();
  }, [locationId]);

  // Load precipitation data with timeout and fallback
  useEffect(() => {
    async function loadPrecipitationData() {
      if (!locationId) return;
      
      setIsLoadingPrecip(true);
      setPrecipError(null);
      
      try {
        const locationConfig = getLocationConfig(locationId);
        if (!locationConfig || locationConfig.disabled) {
          setIsLoadingPrecip(false);
          return;
        }
        
        // Use the new timeout function for individual location
        const result = await fetchPrecipitationWithTimeout(
          locationConfig.coords[0], // lat
          locationConfig.coords[1], // lon
          '20170101', // Start date
          '20251231', // End date
          8000 // 8 second timeout
        );
        
        if (result.success) {
          setPrecipitationData({ [locationId]: result.data });
          setPrecipError(null);
        } else {
          setPrecipitationData(null);
          setPrecipError(result.message);
        }
      } catch (error) {
        console.error('Error loading precipitation data:', error);
        setPrecipitationData(null);
        setPrecipError('Unable to load precipitation data');
      } finally {
        setIsLoadingPrecip(false);
      }
    }

    loadPrecipitationData();
  }, [locationId]);

  const TODAY = new Date();
  const selectedDateObj = new Date(selectedDate);
  const isHistorical = selectedDateObj <= TODAY;
  const currentYear = selectedDateObj.getFullYear();

  if (!locationData) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <h3 className="text-lg font-semibold mb-2">Loading Data</h3>
        <p className="text-sm">Fetching location data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{metadata?.fullName || 'Unknown Location'}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isHistorical 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
        }`}>
          {isHistorical ? '📊 Historical Data' : '🔮 ML Forecast'}
        </span>
      </div>

      <div className="text-gray-600">
        {selectedDateObj.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
        locationData?.ndvi >= 0.18 
          ? 'bg-pink-100 text-pink-700'
          : locationData?.ndvi >= 0.12
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-700'
      }`}>
        <span className="text-xl">
          {locationData?.ndvi >= 0.18 ? '🌸' : locationData?.ndvi >= 0.12 ? '🌱' : '🏜️'}
        </span>
        <span className="font-semibold">{getBloomStatusText(locationData?.ndvi || 0)}</span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="NDVI"
          value={(locationData?.ndvi || 0).toFixed(3)}
          color="blue"
        />
        <MetricCard
          label="Status"
          value={getBloomStatusText(locationData?.ndvi || 0)}
          color="green"
        />
      </div>

      {/* Bloom Status Card with Precipitation Analysis */}
      {isHistorical && precipitationData && !precipError && (
        <BloomStatusCard
          location={metadata}
          year={currentYear}
          precipData={precipitationData[locationId]}
          ndviData={ndviData}
        />
      )}

      {/* Precipitation vs NDVI Chart */}
      {isHistorical && precipitationData && !precipError && ndviData.length > 0 && (
        <PrecipNDVIChart
          ndviData={ndviData}
          precipData={precipitationData[locationId]}
          year={currentYear}
          locationName={metadata?.fullName}
        />
      )}

      {/* Loading states */}
      {isLoadingPrecip && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin text-blue-600">⏳</div>
            <div className="text-sm text-blue-700">Loading precipitation data from NASA...</div>
          </div>
        </div>
      )}

      {isLoadingNDVI && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin text-gray-600">⏳</div>
            <div className="text-sm text-gray-700">Loading NDVI data...</div>
          </div>
        </div>
      )}

      {/* Error states */}
      {!isLoadingPrecip && precipError && (
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-3">
            <span className="text-orange-600">⚠️</span>
            <div className="text-sm text-orange-700">
              <div className="font-medium">Precipitation data unavailable</div>
              <div className="text-xs text-orange-600 mt-1">
                {precipError}. Bloom analysis continues using NDVI data only.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NDVI Chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Bloom Progression</h3>
        <NDVIChart locationId={locationId} highlightDate={selectedDate} />
      </div>

      {/* Viewing Tips - for historical data */}
      {isHistorical && metadata && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">🌸 Viewing Tips</h3>
            <p className="text-sm text-gray-600">{metadata.bestViewing}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Location Description</h3>
            <p className="text-sm text-gray-600">{metadata.description}</p>
          </div>
        </>
      )}

      {/* Peak Bloom Alert Card - Show if peak bloom detected */}
      {isHistorical && locationData?.ndvi >= 0.18 && (
        <div className="bg-gradient-to-r from-pink-50/80 to-rose-50/80 border-2 border-pink-200/60 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🌸</span>
            <div>
              <h3 className="font-semibold text-pink-800">Peak Bloom Alert</h3>
              <p className="text-sm text-pink-700">Peak viewing: {selectedDateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
          <button className="w-full bg-pink-400 text-white py-2 px-4 rounded-lg font-medium hover:bg-pink-500 transition-colors">
            Plan Your Visit
          </button>
        </div>
      )}

      {/* Notification Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-3">Get Bloom Notifications</h3>
        <div className="space-y-3">
          <input 
            type="email" 
            placeholder="your@email.com" 
            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Subscribe
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Get alerts when blooms are detected at your favorite locations
        </p>
      </div>
    </div>
  );
};

function EnhancedSidebar({ locationId, currentDate }) {
  const [dataPoint, setDataPoint] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (locationId && currentDate) {
      setIsLoading(true);
      getLocationDataForDate(locationId, currentDate).then(result => {
        setDataPoint(result);
        setIsLoading(false);
      }).catch(error => {
        console.error('Error loading location data:', error);
        setDataPoint(null);
        setIsLoading(false);
      });
    }
  }, [currentDate, locationId]);

  if (!locationId) {
    return (
      <aside className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="text-center text-gray-500 mt-20">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-semibold mb-2">Select a Location</h3>
          <p className="text-sm">
            Click on any bloom marker on the map to view detailed information
          </p>
        </div>
      </aside>
    );
  }

  const locationConfig = getLocationConfig(locationId);
  const metadata = locationMetadata[locationId];
  
  if (!locationConfig || !metadata) {
    return (
      <aside className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="text-center text-red-500 mt-20">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-semibold mb-2">Location Not Found</h3>
          <p className="text-sm">Location configuration not found</p>
        </div>
      </aside>
    );
  }

  if (isLoading) {
    return (
      <aside className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="text-center text-gray-500 mt-20">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-semibold mb-2">Loading Data</h3>
          <p className="text-sm">Fetching data...</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6">
        <SidebarContent 
          selectedDate={currentDate}
          locationData={dataPoint}
          locationId={locationId}
          metadata={metadata}
        />
      </div>
    </aside>
  );
}

export default EnhancedSidebar;
