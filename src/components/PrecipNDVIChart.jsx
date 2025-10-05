import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';

/**
 * Precipitation vs NDVI Chart Component
 * Shows combined visualization of precipitation (bars) and NDVI (line) for a given year
 */
function PrecipNDVIChart({ ndviData, precipData, year, locationName }) {
  // Handle missing data
  if (!ndviData || !Array.isArray(ndviData) || ndviData.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Precipitation vs Vegetation Response ({year})
        </h3>
        <div className="text-center py-8 text-gray-500">
          ⏳ Loading chart data...
        </div>
      </div>
    );
  }

  if (!precipData) {
    return (
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Precipitation vs Vegetation Response ({year})
        </h3>
        <div className="text-center py-8 text-gray-500">
          ⏳ Loading precipitation data...
        </div>
      </div>
    );
  }

  // Combine data for chart - filter to specified year
  const chartData = ndviData
    .filter(d => d.date && d.date.startsWith(year.toString()))
    .map(d => {
      const dateKey = d.date.replace(/-/g, ''); // "2017-03-15" -> "20170315"
      const month = new Date(d.date).getMonth() + 1;
      const day = new Date(d.date).getDate();
      
      return {
        date: d.date,
        displayDate: `${month}/${day}`, // Shorter display format
        ndvi: d.ndvi || 0,
        precipitation: precipData[dateKey] || 0
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

  // If no data for the year, show message
  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Precipitation vs Vegetation Response ({year})
        </h3>
        <div className="text-center py-8 text-gray-500">
          No data available for {year}
        </div>
      </div>
    );
  }

  // Calculate statistics for reference lines
  const maxNDVI = Math.max(...chartData.map(d => d.ndvi));
  const maxPrecip = Math.max(...chartData.map(d => d.precipitation));
  const avgNDVI = chartData.reduce((sum, d) => sum + d.ndvi, 0) / chartData.length;

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Precipitation vs Vegetation Response ({year})
        {locationName && <span className="text-sm text-gray-600 ml-2">- {locationName}</span>}
      </h3>
      
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            
            <XAxis 
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              yAxisId="left" 
              orientation="left"
              label={{ value: 'NDVI', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              domain={[0, Math.max(0.6, maxNDVI * 1.1)]}
              tick={{ fontSize: 12 }}
            />
            
            <YAxis 
              yAxisId="right" 
              orientation="right"
              label={{ value: 'Precipitation (mm)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
              domain={[0, Math.max(50, maxPrecip * 1.2)]}
              tick={{ fontSize: 12 }}
            />
            
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value, name) => [
                name === 'precipitation' ? `${value.toFixed(1)} mm` : value.toFixed(3),
                name === 'precipitation' ? 'Daily Precip' : 'NDVI'
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            
            {/* Precipitation as bars */}
            <Bar 
              yAxisId="right" 
              dataKey="precipitation" 
              fill="#3b82f6" 
              opacity={0.7} 
              name="Daily Precip (mm)"
              radius={[2, 2, 0, 0]}
            />
            
            {/* NDVI as line */}
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="ndvi" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
              name="NDVI"
            />
            
            {/* Reference lines */}
            <ReferenceLine 
              yAxisId="left" 
              y={0.45} 
              stroke="#ef4444" 
              strokeDasharray="5 5" 
              strokeWidth={1}
              label={{ value: "Bloom threshold", position: "topRight", style: { fontSize: '10px', fill: '#ef4444' } }}
            />
            
            {/* Average NDVI line */}
            <ReferenceLine 
              yAxisId="left" 
              y={avgNDVI} 
              stroke="#6b7280" 
              strokeDasharray="3 3" 
              strokeWidth={1}
              label={{ value: `Avg: ${avgNDVI.toFixed(2)}`, position: "topLeft", style: { fontSize: '10px', fill: '#6b7280' } }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Chart statistics */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="font-medium text-gray-800">Peak NDVI</div>
          <div className="text-lg font-semibold text-green-600">{maxNDVI.toFixed(3)}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="font-medium text-gray-800">Max Daily Precip</div>
          <div className="text-lg font-semibold text-blue-600">{maxPrecip.toFixed(1)} mm</div>
        </div>
      </div>
    </div>
  );
}

export default PrecipNDVIChart;
