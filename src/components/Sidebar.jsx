import californiaData from '../data/california2017.json'
import locationMetadata from '../data/locationMetadata.json'
import { getBloomStatus, getDaysAdvanceWarning } from '../utils/bloomDetection'
import { getNDVIForDate } from '../utils/dataExtender'
import { getDataForDate, isPredictionDate } from '../services/dataService'
import NDVIChart from './NDVIChart'
import { useState, useEffect } from 'react'

function Sidebar({ locationId, currentDate }) {
  const [dataPoint, setDataPoint] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPrediction, setIsPrediction] = useState(false)

  useEffect(() => {
    if (locationId && currentDate) {
      setIsLoading(true)
      getDataForDate(currentDate).then(result => {
        setDataPoint(result.data)
        setIsPrediction(result.isPrediction)
        setIsLoading(false)
      })
    }
  }, [currentDate])

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

  const location = californiaData.locations.find(l => l.id === locationId)
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
          <p className="text-sm">Fetching {isPrediction ? 'prediction' : 'historical'} data...</p>
        </div>
      </aside>
    )
  }

  // Handle prediction mode
  if (isPrediction) {
    return (
      <aside className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Location Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{metadata.fullName}</h2>
            <p className="text-sm text-gray-600">{location.region}</p>
            <div className="mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium inline-block">
              🔮 Bloom Forecast
            </div>
          </div>

          {/* Prediction Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Predicted Bloom Status</h3>
            {dataPoint ? (
              <div className="space-y-3">
                <div className={`inline-block px-4 py-2 rounded-full font-medium ${
                  dataPoint.bloom_pred === 1 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                }`}>
                  {dataPoint.bloom_pred === 1 ? '🌸 Bloom Predicted' : '🌱 No Bloom Expected'}
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Bloom Probability:</strong> {(dataPoint.bloom_prob * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Predicted NDVI:</strong> {dataPoint.ndvi.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Soil Moisture:</strong> {(dataPoint.soil_moisture * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Precipitation:</strong> {dataPoint.precipitation_mm.toFixed(1)}mm
                </p>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                Prediction data not available for this date
              </div>
            )}
          </div>

          {/* Model Information */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-orange-800 mb-2">🤖 Our Model Details</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Model Type:</strong> Gradient Boosting</p>
              <p><strong>Features:</strong> GDD, Soil Moisture, Precipitation</p>
              <p><strong>Training Data:</strong> 2017-2024 Historical Blooms</p>
              <p><strong>Confidence:</strong> {dataPoint ? (dataPoint.bloom_prob * 100).toFixed(1) : 'N/A'}%</p>
            </div>
          </div>

          {/* Forecast Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">⚠️ Forecast Disclaimer</h3>
            <p className="text-xs text-gray-600">
              This prediction is based on machine learning models trained on historical data. 
              Actual bloom conditions may vary due to unforeseen weather patterns or environmental factors.
            </p>
          </div>
        </div>
      </aside>
    )
  }

  // Historical mode (existing logic)
  const status = getBloomStatus(dataPoint?.ndvi || 0)
  const daysWarning = getDaysAdvanceWarning(location.alertDate, location.peakBloomDate)

  return (
    <aside className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Location Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{metadata.fullName}</h2>
          <p className="text-sm text-gray-600">{location.region}</p>
          <div className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium inline-block">
            📊 Historical Data
          </div>
        </div>

        {/* Current Status */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Status</h3>
          <div 
            className="inline-block px-4 py-2 rounded-full font-medium"
            style={{
              backgroundColor: status.color + '20',
              color: status.color,
              border: `2px solid ${status.color}`
            }}
          >
            {status.label}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            NDVI: {(dataPoint?.ndvi || 0).toFixed(2)} on {currentDate}
          </p>
        </div>

        {/* NDVI Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Bloom Progression</h3>
          <NDVIChart locationId={locationId} highlightDate={currentDate} />
        </div>

        {/* Peak Bloom Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">📅 Peak Bloom Information</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Alert Sent:</strong> {location.alertDate}</p>
            <p><strong>Peak Bloom:</strong> {location.peakBloomDate}</p>
            <p><strong>Advance Warning:</strong> {daysWarning} days</p>
          </div>
        </div>

        {/* Viewing Tips */}
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

        {/* Mock Notification */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">🔔 Alert Preview</h3>
          <p className="text-xs text-gray-600 italic">
            "Bloom detected at {metadata.fullName}! Peak viewing expected around {location.peakBloomDate}."
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar