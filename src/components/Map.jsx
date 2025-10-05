import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
//import bloomZones from '../data/bloomZones.js'
// Removed californiaData import - using location-specific data instead
import { getBloomStatus } from '../utils/bloomVisualization'
import { getNDVIForDate } from '../utils/dataHelpers'
import { getBloomOverlayOpacity, getBloomColor, getBloomIntensity } from '../utils/bloomVisualization'
import { LOCATION_CONFIGS } from '../config/locationConfig'
import { loadLocationData } from '../services/locationDataService'

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
      
      // Use dynamic bloom intensity with seasonal filtering
      const bloomIntensity = getBloomIntensity(point.ndvi, selectedDate);
      const bloomOpacity = getBloomOverlayOpacity(point.ndvi, selectedDate, point.parentLocation || point.id);
      
      console.log(`Point ${point.id || 'unknown'} - bloom intensity: ${bloomIntensity.toFixed(3)}, opacity: ${bloomOpacity.toFixed(3)}`);
      
      if (bloomOpacity > 0) { // Only show if seasonal filter allows
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
            bloomIntensity  // Use dynamic intensity
          ]);
        }
      } else {
        console.log(`Point ${point.id || 'unknown'} - SKIPPED (seasonal filter or below threshold)`);
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

    // Create heat layer - optimized for dynamic bloom colors
    if (heatData.length > 0) {
      console.log('Creating heatmap layer...');
      
      // Detect if we're in peak bloom period
      const hasPeakBloom = allPoints.some(point => {
        const bloomIntensity = getBloomIntensity(point.ndvi, selectedDate);
        return bloomIntensity > 0.7; // Peak bloom threshold
      });
      
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 60,
        blur: 30,
        max: 1.6,
        minOpacity: 0.15,
        gradient: hasPeakBloom ? {
          // PINK GRADIENT for peak bloom periods
          0.0: 'rgba(248, 181, 209, 0)',
          0.3: 'rgba(248, 181, 209, 0.3)',
          0.5: 'rgba(248, 181, 209, 0.5)',
          0.7: 'rgba(240, 147, 196, 0.7)',
          1.0: 'rgba(236, 72, 153, 0.85)'
        } : {
          // ORANGE/YELLOW GRADIENT for non-peak periods
          0.0: 'rgba(254, 243, 199, 0)',
          0.4: 'rgba(253, 230, 138, 0.5)',
          0.6: 'rgba(251, 191, 36, 0.6)',
          0.8: 'rgba(251, 146, 60, 0.7)',
          1.0: 'rgba(251, 146, 60, 0.8)'
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

// Clickable Real Location Markers with Real Data
const RealLocationMarkers = ({ realLocations, selectedDate, onLocationClick }) => {
  const [locationData, setLocationData] = useState({});
  
  // Load real data for all locations
  useEffect(() => {
    console.log('=== Loading Real Location Data ===');
    const loadAllLocationData = async () => {
      const dataPromises = realLocations.map(async (location) => {
        if (location.disabled) return null;
        
        try {
          console.log(`Loading data for ${location.id}`);
          const data = await loadLocationData(location.id);
          console.log(`Loaded ${data.length} records for ${location.id}`);
          return { locationId: location.id, data };
        } catch (error) {
          console.error(`Error loading data for ${location.id}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(dataPromises);
      const dataMap = {};
      results.forEach(result => {
        if (result) {
          dataMap[result.locationId] = result.data;
        }
      });
      
      console.log('All location data loaded:', Object.keys(dataMap));
      setLocationData(dataMap);
    };
    
    loadAllLocationData();
  }, [realLocations]);
  
  // Convert string to Date object if needed
  const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
  
  return (
    <>
      {realLocations.map(location => {
        // Get real NDVI data for this location
        const ndviData = locationData[location.id];
        let ndvi = 0;
        
        if (ndviData && ndviData.length > 0) {
          ndvi = getNDVIForDate(selectedDate, ndviData);
          console.log(`${location.id} - Real NDVI for ${selectedDate}: ${ndvi}`);
        } else {
          console.log(`${location.id} - No data available, using synthetic NDVI`);
          ndvi = calculateNDVIForDate(location, dateObj);
        }
        
        const bloomOpacity = getBloomOverlayOpacity(ndvi, dateObj, location.id);
        const bloomColor = getBloomColor(ndvi, location.id);
        const isActive = bloomOpacity > 0; // Whether in bloom period (seasonal + NDVI filter)
        const isDisabled = location.disabled;
        
        // Create disabled icon for disabled locations
        const disabledIcon = L.divIcon({
          className: 'custom-marker disabled',
          html: '<div style="background: #d1d5db; opacity: 0.5; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 12px;">📍</div>',
          iconSize: [20, 20]
        });
        
        return (
          <React.Fragment key={location.id}>
            {/* Large transparent clickable area - only for enabled locations */}
            {!isDisabled && (
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
            )}

            {/* Center marker point */}
            <CircleMarker
              center={[location.lat, location.lng]}
              radius={7}
              pathOptions={{
                fillColor: isDisabled ? '#d1d5db' : '#ffffff',
                fillOpacity: 1,
                color: isDisabled ? '#9ca3af' : (isActive ? bloomColor : '#9ca3af'),
                weight: 3,
                className: isDisabled ? 'disabled-marker' : (isActive ? 'active-marker' : 'dormant-marker')
              }}
              eventHandlers={{
                click: () => {
                  if (isDisabled) {
                    alert(`${location.name}: ${location.disabledReason}`);
                    return;
                  }
                  onLocationClick(location.id);
                }
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
                {isDisabled && (
                  <div style={{color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>
                    ⚠️ {location.disabledReason}
                  </div>
                )}
              </Tooltip>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </>
  );
};

// Legacy status text function - keeping for backward compatibility with markers
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
  // Get location configurations from new config
  const locationConfigs = LOCATION_CONFIGS;
  
  // Convert location configs to the format expected by existing code
  const realLocations = Object.values(locationConfigs).map(config => ({
    id: config.id,
    name: config.name.split(' ')[0] + ' ' + config.name.split(' ')[1], // Short name
    lat: config.coords[0], // latitude
    lng: config.coords[1], // longitude
    disabled: config.disabled,
    disabledReason: config.disabledReason
  }));

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