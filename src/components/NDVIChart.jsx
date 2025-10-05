import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Area, ComposedChart } from 'recharts'
import { LOCATION_CONFIGS } from '../config/locationConfig'

function NDVIChart({ locationId, highlightDate, ndviData, dataSource }) {
  // 检查 ndviData 是否存在
  if (!ndviData || !Array.isArray(ndviData) || ndviData.length === 0) {
    console.error('NDVIChart: Invalid data received', ndviData);
    return <div>No data available for chart</div>
  }
  
  console.log('NDVIChart rendering with', ndviData.length, 'data points');

  // Calculate time window around highlightDate with data sampling
  const getContextualData = () => {
    if (!highlightDate) return ndviData
    
    const currentDate = new Date(highlightDate)
    const currentYear = currentDate.getFullYear()
    
    // Show data from current year to next year (e.g., 2021 shows 2021-2022)
    const startYear = currentYear
    const endYear = currentYear + 1
    
    const filteredData = ndviData.filter(dataPoint => {
      if (!dataPoint || !dataPoint.date) return false; // Safety check
      const pointYear = new Date(dataPoint.date).getFullYear()
      return pointYear >= startYear && pointYear <= endYear
    })
    
    console.log('Filtered to', filteredData.length, 'points for year range', startYear, '-', endYear);

    // Sample data more intelligently - take key points for each month
    const sampledData = []
    const monthlyData = {}
    
    // Group by month
    filteredData.forEach(point => {
      const date = new Date(point.date)
      const monthKey = date.getFullYear() + '-' + (date.getMonth() + 1)
      if (!monthlyData[monthKey]) monthlyData[monthKey] = []
      monthlyData[monthKey].push(point)
    })
    
    // Take 1-2 representative points per month
    Object.keys(monthlyData).sort().forEach(monthKey => {
      const monthPoints = monthlyData[monthKey]
      // Take the point closest to mid-month
      const midMonth = monthPoints.reduce((closest, point) => {
        const pointDay = new Date(point.date).getDate()
        const closestDay = new Date(closest.date).getDate()
        return Math.abs(pointDay - 15) < Math.abs(closestDay - 15) ? point : closest
      })
      sampledData.push(midMonth)
    })
    
    // CRITICAL: Always include the highlight date if it exists in full data
    const highlightPoint = ndviData.find(d => d.date === highlightDate)
    if (highlightPoint && !sampledData.find(d => d.date === highlightDate)) {
      sampledData.push(highlightPoint)
      sampledData.sort((a, b) => new Date(a.date) - new Date(b.date))
    }

    return sampledData.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const contextualData = getContextualData()

  // Add bloom window data for shaded region - use location-specific threshold
  const location = LOCATION_CONFIGS[locationId];
  const peakBloomThreshold = location?.thresholds?.peakBloom || 0.22;
  
  const dataWithBloomWindow = contextualData.map(point => ({
    ...point,
    bloomThreshold: peakBloomThreshold,
    bloomWindow: Math.max(0, point.ndvi - peakBloomThreshold)
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Get the actual data point
      const ndviValue = data.ndvi; // Use the actual NDVI value from data
      
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">
            {new Date(label).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
          <p className="text-sm text-gray-600">
            NDVI: <span className="font-semibold text-green-600">{ndviValue?.toFixed(3) || 'N/A'}</span>
          </p>
          {data.bloom_prob !== undefined && (
            <p className="text-xs text-blue-600 mt-1">
              Bloom probability: {(data.bloom_prob * 100).toFixed(0)}%
            </p>
          )}
          <p className="text-xs text-gray-500">
            {ndviValue >= peakBloomThreshold ? '🌸 Peak Bloom Zone' : '🌱 Below Bloom Threshold'}
          </p>
        </div>
      )
    }
    return null
  }

  // Find the selected date point for display
  const selectedPoint = contextualData.find(d => d.date === highlightDate);
  
  return (
    <div>
      {/* Show data source indicator */}
      {dataSource === 'forecast' && (
        <div className="forecast-indicator" style={{
          fontSize: '12px',
          color: '#3b82f6',
          marginBottom: '8px',
          fontWeight: 600
        }}>
          🔮 AI Model Prediction
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={dataWithBloomWindow} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11 }}
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis 
            domain={[0, 1]} 
            tick={{ fontSize: 11 }}
            label={{ value: 'NDVI', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Bloom window shaded area */}
          <Area
            type="monotone"
            dataKey="bloomThreshold"
            stroke="none"
            fill="#22c55e"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="bloomWindow"
            stroke="none"
            fill="#22c55e"
            fillOpacity={0.2}
            stackId="1"
          />
          
          {/* Peak bloom threshold line - use location-specific threshold */}
          {(() => {
            // Get location-specific threshold
            const location = LOCATION_CONFIGS[locationId];
            const threshold = location?.thresholds?.peakBloom || 0.22;
            
            return (
              <ReferenceLine 
                y={threshold} 
                stroke="#22c55e" 
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{ 
                  value: `Peak Bloom (${threshold})`, 
                  position: 'right', 
                  fontSize: 10,
                  fill: '#22c55e',
                  offset: 10
                }}
              />
            );
          })()}
          
          {/* Selected date marker */}
          {highlightDate && (
            <ReferenceLine 
              x={highlightDate} 
              stroke="#3b82f6" 
              strokeWidth={3}
              label={{ 
                value: 'Selected Date', 
                position: 'top', 
                fontSize: 10,
                fill: '#3b82f6'
              }}
            />
          )}
          
          {/* Main NDVI line */}
          <Line 
            type="monotone" 
            dataKey="ndvi" 
            stroke="#22c55e" 
            strokeWidth={3}
            dot={{ fill: '#22c55e', r: 3, stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#22c55e', stroke: '#ffffff', strokeWidth: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Historical NDVI</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22c55e, #22c55e 4px, transparent 4px, transparent 8px)' }}></div>
          <span>Peak Bloom Zone</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500"></div>
          <span>Selected Date</span>
        </div>
      </div>
    </div>
  )
}

export default NDVIChart