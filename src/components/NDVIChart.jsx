import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import californiaData from '../data/california2017.json'

function NDVIChart({ locationId, highlightDate }) {
  const location = californiaData.locations.find(l => l.id === locationId)
  
  if (!location) return <div>No data</div>

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={location.ndviData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
          strokeWidth={3}
          dot={{ fill: '#22c55e', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default NDVIChart