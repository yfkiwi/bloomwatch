import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import bloomZones from '../data/bloomZones.js'
import californiaData from '../data/california2017.json'
import { getBloomStatus } from '../utils/bloomDetection'
import { getNDVIForDate } from '../utils/dataExtender'

// Fix default marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Generate synthetic data points around real locations
const generateSyntheticPoints = (realLocation, baseNDVI, selectedDate) => {
  const syntheticPoints = [];
  const numSatellites = 6; // 6 virtual points around each real location
  
  for (let i = 0; i < numSatellites; i++) {
    const angle = (i * 360) / numSatellites;
    const distance = 0.3 + Math.random() * 0.4; // 0.3-0.7 degree random distance
    
    const lat = realLocation.lat + Math.cos(angle * Math.PI / 180) * distance;
    const lng = realLocation.lng + Math.sin(angle * Math.PI / 180) * distance;
    
    // NDVI with natural variation but close to real value
    const variation = 0.85 + Math.random() * 0.3; // 85%-115%
    const ndvi = baseNDVI * variation;
    
    syntheticPoints.push({
      id: `synthetic-${realLocation.id}-${i}`,
      lat,
      lng,
      ndvi: Math.max(0.05, Math.min(0.3, ndvi)), // Limit range
      isSynthetic: true,
      parentLocation: realLocation.id
    });
  }
  
  return syntheticPoints;
};

// South to north bloom gradient - latitude affects bloom timing
const getLatitudeBasedBloomOffset = (latitude) => {
  // South (Anza-Borrego ~33°N) blooms earliest
  // North (Death Valley ~36°N) delayed by ~12 days
  const baseLat = 33;
  const latDiff = latitude - baseLat;
  return Math.floor(latDiff * 4); // 4 days delay per degree latitude
};

const calculateNDVIForDate = (location, selectedDate) => {
  // Convert string to Date object if needed
  const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
  
  // Extract month and day only (ignore year for pattern matching)
  const selectedMonth = dateObj.getMonth();
  const selectedDay = dateObj.getDate();
  
  // Peak bloom: March 15 + latitude offset
  const daysOffset = getLatitudeBasedBloomOffset(location.lat);
  const basePeakDate = new Date(2017, 2, 15); // March 15
  basePeakDate.setDate(basePeakDate.getDate() + daysOffset);
  
  const peakMonth = basePeakDate.getMonth();
  const peakDay = basePeakDate.getDate();
  
  // Calculate day-of-year for both dates
  const selectedDOY = selectedMonth * 30 + selectedDay;
  const peakDOY = peakMonth * 30 + peakDay;
  
  // Days difference (handling year wraparound)
  let daysDiff = selectedDOY - peakDOY;
  if (daysDiff > 180) daysDiff -= 365;
  if (daysDiff < -180) daysDiff += 365;
  
  // Gaussian bloom curve
  const peakNDVI = 0.25;
  const sigma = 20; // Increased from 15 to 20 for wider bloom period
  const ndvi = peakNDVI * Math.exp(-(daysDiff ** 2) / (2 * sigma ** 2));
  
  // Add base vegetation value for spring months (March-May)
  const springMonths = [2, 3, 4]; // March, April, May
  const isSpring = springMonths.includes(selectedMonth);
  const baseSpringNDVI = isSpring ? 0.12 : 0.05; // Increased from 0.08 to 0.12
  
  return Math.max(baseSpringNDVI, ndvi);
};

// Combine all data points (real + synthetic)
const getAllBloomPoints = (selectedDate, realLocations) => {
  console.log('=== getAllBloomPoints CALLED ===');
  console.log('Date:', selectedDate);
  console.log('Real locations count:', realLocations.length);
  
  // Convert string to Date object if needed
  const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
  
  const allPoints = [];
  
  realLocations.forEach(realLoc => {
    // Calculate NDVI for this location
    const ndvi = calculateNDVIForDate(realLoc, dateObj);
    console.log(`${realLoc.name}: calculated NDVI = ${ndvi.toFixed(3)}`);
    
    // Add real location
    allPoints.push({
      ...realLoc,
      ndvi,
      isSynthetic: false
    });
    
    // Add surrounding synthetic points
    const syntheticPoints = generateSyntheticPoints(realLoc, ndvi, dateObj);
    console.log(`Generated ${syntheticPoints.length} synthetic points for ${realLoc.name}`);
    allPoints.push(...syntheticPoints);
  });
  
  console.log('Total points after generation:', allPoints.length);
  return allPoints;
};

// Smooth Bloom Heatmap Component
const SmoothBloomHeatmap = ({ selectedDate, realLocations }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    console.log('=== HEATMAP DEBUG ===');
    console.log('selectedDate:', selectedDate);
    console.log('realLocations:', realLocations);
    console.log('L.heatLayer available:', typeof L.heatLayer);
    
    // Check if leaflet.heat is loaded
    if (typeof L.heatLayer !== 'function') {
      console.error('leaflet.heat plugin not loaded! L.heatLayer is:', typeof L.heatLayer);
      return;
    }
    
    // Clear old layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Get all points (real + synthetic)
    const allPoints = getAllBloomPoints(selectedDate, realLocations);
    console.log('Total points (real + synthetic):', allPoints.length);
    console.log('Sample points:', allPoints.slice(0, 3));
    
    // Generate heatmap data - each point spreads into multiple heat points
    const heatData = [];
    
    // Force some test data if no points meet threshold
    let hasValidPoints = false;
    
    allPoints.forEach(point => {
      console.log(`Point ${point.id || 'unknown'} has NDVI ${point.ndvi.toFixed(3)}`);
      if (point.ndvi >= 0.05) { // Lowered threshold from 0.06 to 0.05
        hasValidPoints = true;
        console.log(`Point ${point.id || 'unknown'} - generating heat points`);
        // Each point generates 40 spread points for smooth coverage
        const numHeatPoints = 40;
        
        for (let i = 0; i < numHeatPoints; i++) {
          // Random polar coordinates
          const r = Math.random() * 0.4; // 0.4 degree radius
          const theta = Math.random() * 2 * Math.PI;
          
          heatData.push([
            point.lat + r * Math.cos(theta),
            point.lng + r * Math.sin(theta),
            point.ndvi * 1.5  // Intensity
          ]);
        }
      } else {
        console.log(`Point ${point.id || 'unknown'} - SKIPPED (below 0.06 threshold)`);
      }
    });
    
    // If no valid points, add some test data to verify heatmap works
    if (!hasValidPoints) {
      console.log('No valid points found, adding test heatmap data...');
      realLocations.forEach(loc => {
        for (let i = 0; i < 20; i++) {
          const r = Math.random() * 0.3;
          const theta = Math.random() * 2 * Math.PI;
          heatData.push([
            loc.lat + r * Math.cos(theta),
            loc.lng + r * Math.sin(theta),
            0.15 // Test intensity
          ]);
        }
      });
    }

    console.log('Total heat data points:', heatData.length);

    // Create heat layer - optimized for soft effect
    if (heatData.length > 0) {
      console.log('Creating heatmap layer...');
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 60,          // Even larger radius for better coverage
        blur: 30,            // Reduced blur for more visible effect
        max: 0.5,            // Increased max for stronger colors
        minOpacity: 0.2,     // Increased minimum opacity
        gradient: {
          0.0: 'rgba(255, 192, 203, 0)',      // Transparent
          0.3: 'rgba(255, 182, 193, 0.3)',    // Light pink 30%
          0.5: 'rgba(255, 160, 186, 0.5)',    // Medium pink 50%
          0.7: 'rgba(255, 105, 180, 0.7)',    // Bright pink 70%
          0.9: 'rgba(236, 72, 153, 0.85)',    // Deep pink 85%
          1.0: 'rgba(219, 39, 119, 0.9)'      // Magenta 90%
        }
      });
      
      heatLayerRef.current.addTo(map);
      console.log('Heatmap layer added to map');
    } else {
      console.warn('No heat data to display - all points below NDVI threshold');
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [selectedDate, realLocations, map]);

  return null;
};

// Clickable Real Location Markers
const RealLocationMarkers = ({ realLocations, selectedDate, onLocationClick }) => {
  // Convert string to Date object if needed
  const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
  
  return (
    <>
      {realLocations.map(location => {
        const ndvi = calculateNDVIForDate(location, dateObj);
        const isActive = ndvi >= 0.12; // Whether in bloom period
        
        return (
          <React.Fragment key={location.id}>
            {/* Large transparent clickable area */}
            <Circle
              center={[location.lat, location.lng]}
              radius={80000}  // 80km click radius
              pathOptions={{
                fillColor: '#EC4899',
                fillOpacity: 0,
                color: 'transparent',
                weight: 0
              }}
              eventHandlers={{
                click: () => onLocationClick(location.id),
                mouseover: (e) => {
                  e.target.setStyle({ 
                    fillOpacity: 0.08,
                    fillColor: '#FF69B4'
                  });
                },
                mouseout: (e) => {
                  e.target.setStyle({ fillOpacity: 0 });
                }
              }}
            />

            {/* Center marker point */}
            <CircleMarker
              center={[location.lat, location.lng]}
              radius={7}
              pathOptions={{
                fillColor: '#ffffff',
                fillOpacity: 1,
                color: isActive ? '#EC4899' : '#9ca3af',
                weight: 3,
                className: isActive ? 'active-marker' : 'dormant-marker'
              }}
              eventHandlers={{
                click: () => onLocationClick(location.id)
              }}
            >
              <Tooltip 
                permanent 
                direction="top" 
                offset={[0, -15]}
                className="location-tooltip"
              >
                <div className="font-semibold text-sm">
                  {location.name}
                </div>
              </Tooltip>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </>
  );
};

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

// Bloom marker component
const BloomMarker = ({ location, data, onLocationClick }) => {
  const ndvi = data?.ndvi || 0;
  const color = getBloomColor(ndvi);
  const radius = Math.max(10, ndvi * 150); // Size based on intensity
  const isPeakBloom = ndvi >= 0.18;

  return (
    <>
      {/* Main pulsing marker */}
      <CircleMarker
        center={[location.lat, location.lng]}
        radius={radius / 15}
        pathOptions={{
          fillColor: color,
          fillOpacity: 0.8,
          color: color,
          weight: 3,
          className: isPeakBloom ? 'bloom-pulse' : ''
        }}
        eventHandlers={{
          click: () => onLocationClick(location.id)
        }}
      >
        <Tooltip>
          <div className="font-medium">{location.name}</div>
          <div className="text-sm">{getBloomStatusText(ndvi)}</div>
          <div className="text-xs text-gray-600">NDVI: {ndvi.toFixed(3)}</div>
        </Tooltip>
      </CircleMarker>

      {/* Ripple effect for blooming locations */}
      {ndvi >= 0.12 && (
        <Circle
          center={[location.lat, location.lng]}
          radius={radius}
          pathOptions={{
            fillColor: color,
            fillOpacity: 0.15,
            color: color,
            weight: 0,
            className: 'bloom-ripple'
          }}
        />
      )}

      {/* Secondary ripple for peak blooms */}
      {isPeakBloom && (
        <Circle
          center={[location.lat, location.lng]}
          radius={radius * 1.5}
          pathOptions={{
            fillColor: color,
            fillOpacity: 0.1,
            weight: 0,
            className: 'bloom-ripple-secondary'
          }}
        />
      )}
    </>
  );
};

// Particle explosion component
const BloomExplosion = ({ center, isActive }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isActive) {
      const particleData = Array.from({ length: 24 }, (_, i) => ({
        id: Math.random(),
        angle: (i * 360) / 24,
        distance: Math.random() * 80 + 40,
        delay: Math.random() * 0.3
      }));
      
      setParticles(particleData);
      
      // Clear particles after animation
      setTimeout(() => setParticles([]), 1800);
    }
  }, [isActive]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[1000]">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="bloom-particle"
          style={{
            '--angle': `${particle.angle}deg`,
            '--distance': `${particle.distance}px`,
            '--delay': `${particle.delay}s`,
            left: `${center.x}px`,
            top: `${center.y}px`
          }}
        />
      ))}
    </div>
  );
};

function Map({ currentDate, onLocationSelect, selectedLocation }) {
  // Define the 3 real locations with proper coordinates
  const realLocations = [
    {
      id: 'anza-borrego',
      name: 'Anza-Borrego Desert',
      lat: 33.2584,
      lng: -116.3990
    },
    {
      id: 'carrizo-plain', 
      name: 'Carrizo Plain',
      lat: 35.1682,
      lng: -119.5871
    },
    {
      id: 'death-valley',
      name: 'Death Valley',
      lat: 36.5323,
      lng: -116.9325
    }
  ];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[35.0, -118.0]}
        zoom={7}
        className="h-full w-full"
        style={{ background: '#e0f2fe' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Smooth Bloom Heatmap Background */}
        <SmoothBloomHeatmap 
          selectedDate={currentDate}
          realLocations={realLocations}
        />

        {/* Clickable Real Location Markers */}
        <RealLocationMarkers
          realLocations={realLocations}
          selectedDate={currentDate}
          onLocationClick={onLocationSelect}
        />

        {/* Legend */}
        <div className="leaflet-bottom leaflet-right">
          <div className="leaflet-control bg-white rounded-lg shadow-lg p-4 m-4">
            <h4 className="font-bold text-sm mb-2">Bloom Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f8b5d1' }}></div>
                <span>Peak Bloom</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#fbbf24' }}></div>
                <span>Blooming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#86efac' }}></div>
                <span>Emerging</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#9ca3af' }}></div>
                <span>Dormant</span>
              </div>
            </div>
          </div>
        </div>
      </MapContainer>
    </div>
  )
}

export default Map