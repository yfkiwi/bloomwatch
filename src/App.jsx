import { useState } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import TimeSlider from './components/TimeSlider'
import { getTodayDate } from './services/dataService'
import './App.css'

function App() {
  const [currentDate, setCurrentDate] = useState(getTodayDate()) // Start at today's date
  const [selectedLocation, setSelectedLocation] = useState(null)

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
                  Earth's Flowering Pulse - Historical Data & ML Predictions
                </p>
              </div>
            </div>
            
            {/* Mode Indicator */}
            <div className="text-sm text-green-100">
              Drag timeline to explore 2017-2025
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