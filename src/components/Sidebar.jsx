import californiaData from '../data/california2017.json'
import locationMetadata from '../data/locationMetadata.json'
import { getBloomStatus, getDaysAdvanceWarning } from '../utils/bloomDetection'
import { getNDVIForDate } from '../utils/dataExtender'
import NDVIChart from './NDVIChart'

function Sidebar({ locationId, currentDate }) {
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

  const dataPoint = getNDVIForDate(location.ndviData, currentDate)
  const status = getBloomStatus(dataPoint?.ndvi || 0)
  const daysWarning = getDaysAdvanceWarning(location.alertDate, location.peakBloomDate)

  return (
    <aside className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Location Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{metadata.fullName}</h2>
          <p className="text-sm text-gray-600">{location.region}</p>
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