import { useState } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import TimeSlider from './components/TimeSlider'
import { getTodayDate } from './services/dataService'
import './App.css'

function App() {
  // Smart timeline - default to recent data (2024-2025)
  const [currentDate, setCurrentDate] = useState('2024-01-01') // Start with recent data
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showFullHistory, setShowFullHistory] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="text-white shadow-lg z-10" style={{
        background: 'linear-gradient(135deg, #f8b5d1, #f9a8d4)'
      }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌸</span>
              <div>
                <h1 className="text-2xl font-bold">BloomWatch</h1>
                <p className="text-sm text-pink-100">
                  Earth's Flowering Pulse - Historical Data & ML Predictions
                </p>
              </div>
            </div>
            
            {/* Use Case Indicator */}
            <div className="text-sm text-pink-100">
              Track California's wildflower blooms from 2017-2025
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
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
            showFullHistory={showFullHistory}
            onToggleHistory={setShowFullHistory}
          />
        </div>
        {/* Sidebar */}
        <Sidebar 
          locationId={selectedLocation} 
          currentDate={currentDate} 
        />
      </main>
    </div>
  )
}

export default App