import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import californiaData from '../data/california2017.json'

function NDVIChart({ locationId, highlightDate }) {
  const location = californiaData.locations.find(l => l.id === locationId)
  
  if (!location) return <div>No data</div>

  // Calculate time window around highlightDate with data sampling
  const getContextualData = () => {
    if (!highlightDate) return location.ndviData
    
    const currentDate = new Date(highlightDate)
    const currentYear = currentDate.getFullYear()
    
    // Show data from current year to next year (e.g., 2021 shows 2021-2022)
    const startYear = currentYear
    const endYear = currentYear + 1
    
    const filteredData = location.ndviData.filter(dataPoint => {
      const pointYear = new Date(dataPoint.date).getFullYear()
      return pointYear >= startYear && pointYear <= endYear
    })

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
    
    // Always include the highlight date if it exists
    const highlightPoint = filteredData.find(d => d.date === highlightDate)
    if (highlightPoint && !sampledData.find(d => d.date === highlightDate)) {
      sampledData.push(highlightPoint)
      sampledData.sort((a, b) => new Date(a.date) - new Date(b.date))
    }

    return sampledData.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const contextualData = getContextualData()

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={contextualData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
        <Tooltip 
          labelFormatter={(date) => new Date(date).toLocaleDateString()}
          formatter={(value) => [value.toFixed(2), 'NDVI']}
        />
        <ReferenceLine 
          y={0.22} 
          stroke="#ef4444" 
          strokeDasharray="5 5" 
          label={{ value: 'Peak Bloom Threshold', position: 'right', fontSize: 10 }}
        />
        {highlightDate && (
          <ReferenceLine 
            x={highlightDate} 
            stroke="#3b82f6" 
            strokeWidth={2}
            label={{ value: 'Current', position: 'top', fontSize: 10 }}
          />
        )}
        <Line 
          type="monotone" 
          dataKey="ndvi" 
          stroke="#22c55e" 
          strokeWidth={2}
          dot={{ fill: '#22c55e', r: 2 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default NDVIChart