import locationMetadata from '../data/locationMetadata.json'
import { getBloomStatus } from '../utils/bloomVisualization'
import { getNDVIForDate, isHistoricalDate, getMergedData } from '../utils/dataHelpers'
import { loadLocationData } from '../services/locationDataService'
import { getDataForDate, isPredictionDate } from '../services/dataService'
import NDVIChart from './NDVIChart'
import { useState, useEffect } from 'react'
import { LOCATION_CONFIGS } from '../config/locationConfig'
import { fetchPrecipitationWithTimeout } from '../utils/precipitationAPI'
import BloomDataTab from './BloomDataTab'
import PhotoGalleryTab from './PhotoGalleryTab'

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

const SidebarContent = ({ selectedDate, locationData, location, metadata }) => {
  const TODAY = new Date(); // Use actual current date
  const PREDICTION_END = new Date('2025-08-31');
  const isHistorical = selectedDate <= TODAY;
  const isPrediction = selectedDate > TODAY && selectedDate <= PREDICTION_END;
  const isOutOfRange = selectedDate > PREDICTION_END;

  if (isOutOfRange) {
    return (
      <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-orange-900">Prediction Unavailable</h3>
            <p className="text-sm text-orange-700 mt-1">
              ML forecasts available through August 2025
            </p>
            <button
              onClick={() => {/* Reset to prediction end */}}
              className="mt-2 px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              View Latest Forecast (Aug 31)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{metadata.fullName}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isHistorical 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
        }`}>
          {isHistorical ? '📊 Historical Data' : '🔮 ML Forecast'}
        </span>
      </div>

      <div className="text-gray-600">
        {new Date(selectedDate).toLocaleDateString('en-US', { 
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
        {isHistorical ? (
          <>
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
          </>
        ) : (
          <>
            <MetricCard
              label="Bloom Probability"
              value={`${((locationData?.bloom_prob || 0) * 100).toFixed(1)}%`}
              color="orange"
            />
            <MetricCard
              label="Predicted NDVI"
              value={(locationData?.ndvi || 0).toFixed(3)}
              color="blue"
            />
          </>
        )}
      </div>

      {/* Environmental Data */}
      {isPrediction && (
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-900 mb-2">Model Inputs</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-orange-700">GDD (Growing Degree Days):</span>
              <span className="font-medium">{locationData?.GDD_day?.toFixed(1) || 'N/A'}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700">Soil Moisture:</span>
              <span className="font-medium">{((locationData?.soil_moisture || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700">Precipitation:</span>
              <span className="font-medium">{locationData?.precipitation_mm?.toFixed(1) || 'N/A'}mm</span>
            </div>
          </div>
        </div>
      )}

      {/* NDVI Chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Bloom Progression</h3>
        <NDVIChart locationId={location.id} highlightDate={selectedDate} />
      </div>

      {/* Peak Bloom Info - for historical data */}
      {isHistorical && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-green-800 mb-2">Peak Bloom Timeline</h3>
          <div className="text-xs text-gray-700 space-y-1">
            <div className="flex justify-between">
              <span>Alert Sent:</span>
              <span className="font-medium">{location.alertDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Peak Bloom:</span>
              <span className="font-medium">{location.peakBloomDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Advance Warning:</span>
              <span className="font-medium">{getDaysAdvanceWarning(location.alertDate, location.peakBloomDate)} days</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Info (for predictions only) */}
      {isPrediction && (
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
          <div className="font-medium mb-1">ℹ️ Model Details</div>
          <div>Algorithm: Random Forest</div>
          <div>Training: 2015-2024 data</div>
          <div>Features: GDD, Soil Moisture, Precipitation</div>
        </div>
      )}

      {/* Viewing Tips - for historical data */}
      {isHistorical && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">🌸 Viewing Tips</h3>
            <p className="text-sm text-gray-600">{metadata.bestViewing}</p>
          </div>

          {/* Flower Types */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Common Flowers</h3>
            <div className="flex flex-wrap gap-2">
              {location.flowerTypes.map(flower => (
                <span 
                  key={flower}
                  className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs"
                >
                  {flower}
                </span>
              ))}
            </div>
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
              <p className="text-sm text-pink-700">Peak viewing: {new Date(selectedDate).toLocaleDateString('en-US', { 
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

      {/* Bloom Alert Card - Show if high probability (predictions) */}
      {isPrediction && locationData?.bloom_pred === 1 && (locationData?.bloom_prob || 0) >= 60 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-orange-800">Bloom Alert</h3>
              <p className="text-sm text-orange-700">Peak expected: {new Date(selectedDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
          <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors">
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

function Sidebar({ locationId, currentDate }) {
  const [dataPoint, setDataPoint] = useState(null)
  const [ndviData, setNdvIData] = useState(null) // Store full data array
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('bloom')
  const [dataSource, setDataSource] = useState('historical')
  const [dataError, setDataError] = useState(null)
  const [precipData, setPrecipData] = useState({
    loading: true,
    data: null,
    error: false
  })

  useEffect(() => {
    if (locationId && currentDate) {
      setIsLoading(true)
      console.log(`=== Sidebar Data Loading ===`);
      console.log(`Loading data for location: ${locationId}, date: ${currentDate}`);
      
      // Use new location-specific data loading
      loadLocationData(locationId).then(data => {
        console.log(`Loaded ${data.length} data points for ${locationId}`);
        
        // Determine if this is historical or forecast data
        const { data: mergedData, source, error } = getMergedData(data, [], currentDate);
        
        console.log(`Using ${source} data for ${currentDate}`);
        
        // Store full data array for BloomDataTab
        setNdvIData(mergedData);
        setDataSource(source);
        setDataError(error);
        
        // Get NDVI for current date
        const currentNDVI = getNDVIForDate(currentDate, mergedData);
        console.log(`Current NDVI for ${currentDate}: ${currentNDVI}`);
        
        // Create data point in expected format
        const dataPoint = {
          date: currentDate,
          ndvi: currentNDVI,
          locationId: locationId
        };
        
        setDataPoint(dataPoint);
        setIsLoading(false);
      }).catch(error => {
        console.error(`Error loading data for ${locationId}:`, error);
        setDataPoint(null);
        setNdvIData(null);
        setDataSource('historical');
        setDataError('Failed to load data');
        setIsLoading(false);
      });
    }
  }, [currentDate, locationId])

  // Fetch precipitation when location changes
  useEffect(() => {
    if (!locationId) return;
    
    const location = LOCATION_CONFIGS[locationId];
    if (!location || location.disabled) return;
    
    setPrecipData({ loading: true, data: null, error: false });
    
    fetchPrecipitationWithTimeout(
      location.coords[1],
      location.coords[0],
      '20170101',
      '20251001'
    ).then(result => {
      setPrecipData({
        loading: false,
        data: result.success ? result.data : null,
        error: !result.success
      });
    });
  }, [locationId]);

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
    )
  }

  const location = LOCATION_CONFIGS[locationId] || californiaData.locations.find(l => l.id === locationId)
  const metadata = locationMetadata[locationId]
  
  if (!location || !metadata) {
    return <div className="w-96 bg-white p-6">Location not found</div>
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
    )
  }

  return (
    <aside className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="tab-nav">
          <button
            className={`tab-button ${activeTab === 'bloom' ? 'active' : ''}`}
            onClick={() => setActiveTab('bloom')}
          >
            🌸 Bloom Info
          </button>
          <button
            className={`tab-button ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            📸 Photos
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'bloom' ? (
            <BloomDataTab
              location={location}
              date={currentDate}
              ndviData={ndviData}
              precipData={precipData}
              dataSource={dataSource}
              dataError={dataError}
            />
          ) : (
            <PhotoGalleryTab
              location={location}
              date={currentDate}
              ndviData={ndviData}
            />
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar