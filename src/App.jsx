import { useState } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import TimeSlider from './components/TimeSlider'
import BloomPrediction from './components/BloomPrediction'
import './App.css'

function App() {
  const [currentDate, setCurrentDate] = useState('2017-03-15')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [activeTab, setActiveTab] = useState('historical') // NEW

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌸</span>
              <div>
                <h1 className="text-2xl font-bold">BloomWatch</h1>
                <p className="text-sm text-green-100">
                  Earth's Flowering Pulse - Powered by NASA Satellite Data
                </p>
              </div>
            </div>
            
            {/* Tab Navigation - NEW */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('historical')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'historical'
                    ? 'bg-white text-green-600'
                    : 'bg-green-700 text-white hover:bg-green-800'
                }`}
              >
                📊 2017 Analysis
              </button>
              <button
                onClick={() => setActiveTab('prediction')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'prediction'
                    ? 'bg-white text-green-600'
                    : 'bg-green-700 text-white hover:bg-green-800'
                }`}
              >
                🔮 2025 Forecast
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'historical' ? (
          <>
            {/* Map Area */}
            <div className="flex-1 relative">
              <Map 
                currentDate={currentDate} 
                onLocationSelect={setSelectedLocation}
                selectedLocation={selectedLocation}
              />
              <TimeSlider 
                currentDate={currentDate} 
                onChange={setCurrentDate} 
              />
            </div>
            {/* Sidebar */}
            <Sidebar 
              locationId={selectedLocation} 
              currentDate={currentDate} 
            />
          </>
        ) : (
          /* Prediction View - NEW */
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <BloomPrediction />
              
              {/* Methodology Explanation */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">How It Works</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    <strong>1. Historical Calibration:</strong> We analyzed the 2017 
                    Anza-Borrego bloom using Sentinel-2 satellite data. Peak NDVI of 
                    0.24 occurred March 12, following 150mm winter precipitation.
                  </p>
                  <p>
                    <strong>2. Climate Monitoring:</strong> Current season precipitation 
                    and temperature data from NASA POWER API.
                  </p>
                  <p>
                    <strong>3. Threshold Prediction:</strong> Desert blooms require 
                    over 100mm winter rain and spring warming. We compare current conditions 
                    to 2017 reference.
                  </p>
                  <p>
                    <strong>4. Validation:</strong> Prediction will be validated in 
                    March 2025 when Sentinel-2 imagery becomes available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App