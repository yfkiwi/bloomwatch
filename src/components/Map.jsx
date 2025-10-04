import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import bloomZones from '../data/bloomZones.js'
import californiaData from '../data/california2017.json'
import { getBloomStatus } from '../utils/bloomDetection'

// Fix default marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons based on bloom status
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

function Map({ currentDate, onLocationSelect, selectedLocation }) {
  return (
    <MapContainer
      center={[36.7, -119.4]}
      zoom={6}
      className="h-full w-full"
      style={{ background: '#e0f2fe' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Render markers for each bloom location */}
      {bloomZones.features.map((feature) => {
        const locationId = feature.properties.id
        const location = californiaData.locations.find(l => l.id === locationId)
        
        if (!location) return null

        // Find NDVI for current date
        const dataPoint = location.ndviData.find(d => d.date === currentDate)
        const status = getBloomStatus(dataPoint?.ndvi || 0)
        
        return (
          <Marker
            key={locationId}
            position={feature.geometry.coordinates.slice().reverse()} // [lat, lon]
            icon={createCustomIcon(status.color)}
            eventHandlers={{
              click: () => onLocationSelect(locationId)
            }}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold text-lg">{feature.properties.name}</h3>
                <p className="text-sm text-gray-600">{feature.properties.region}</p>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: status.color + '20',
                      color: status.color,
                      border: `2px solid ${status.color}`
                    }}>
                    {status.label}
                  </span>
                </div>
                <p className="text-xs mt-2 text-gray-500">
                  Click marker for details
                </p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Legend */}
      <div className="leaflet-bottom leaflet-right">
        <div className="leaflet-control bg-white rounded-lg shadow-lg p-4 m-4">
          <h4 className="font-bold text-sm mb-2">Bloom Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Peak Bloom</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span>Emerging</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>No Bloom</span>
            </div>
          </div>
        </div>
      </div>
    </MapContainer>
  )
}

export default Map