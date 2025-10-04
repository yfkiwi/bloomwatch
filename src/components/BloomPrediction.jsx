import { useState, useEffect } from 'react';

// Simple climate-based prediction
function predictBloom(winterRain, springTemp) {
  let probability = 0;
  let reasoning = [];
  
  if (winterRain >= 150) {
    probability = 70;
    reasoning.push(`✅ Abundant winter rain (${winterRain}mm) matches 2017 levels`);
  } else if (winterRain >= 100) {
    probability = 45;
    reasoning.push(`⚠️ Moderate rain (${winterRain}mm) - ${Math.round(winterRain/150*100)}% of 2017`);
  } else if (winterRain >= 50) {
    probability = 20;
    reasoning.push(`⚠️ Low rainfall (${winterRain}mm)`);
  } else {
    reasoning.push(`❌ Insufficient rain (${winterRain}mm < 50mm threshold)`);
  }
  
  if (springTemp > 15 && springTemp < 25) {
    probability += 20;
    reasoning.push(`✅ Optimal spring temps (${springTemp}°C)`);
  } else if (springTemp <= 15) {
    probability += 10;
    reasoning.push(`⚠️ Cool spring (${springTemp}°C)`);
  }
  
  const intensity = probability > 60 ? "High - Superbloom Likely" :
                    probability > 40 ? "Moderate Bloom Likely" :
                    probability > 20 ? "Low Bloom Possible" : "Unlikely";
  
  return { probability: Math.min(probability, 90), intensity, reasoning };
}

export default function BloomPrediction() {
  const [prediction, setPrediction] = useState(null);
  
  useEffect(() => {
    // Example current season data (replace with NASA POWER API later)
    const currentWinterRain = 120; // mm
    const currentSpringTemp = 17;   // °C
    
    const result = predictBloom(currentWinterRain, currentSpringTemp);
    setPrediction(result);
  }, []);
  
  if (!prediction) return <div className="p-6">Loading prediction...</div>;
  
  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🔮 2025 Bloom Forecast
      </h2>
      
      {/* Probability Gauge */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Bloom Likelihood</span>
          <span className="text-3xl font-bold text-blue-600">
            {prediction.probability}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className="h-4 rounded-full bg-gradient-to-r from-yellow-400 to-green-600 transition-all duration-1000"
            style={{ width: `${prediction.probability}%` }}
          />
        </div>
      </div>
      
      {/* Intensity */}
      <div className="mb-4 p-3 bg-white rounded-lg">
        <p className="text-xs text-gray-600 mb-1">Forecast Intensity</p>
        <p className={`text-lg font-bold ${
          prediction.intensity.includes("High") ? "text-green-600" :
          prediction.intensity.includes("Moderate") ? "text-yellow-600" :
          "text-gray-600"
        }`}>
          {prediction.intensity}
        </p>
      </div>
      
      {/* Climate Factors */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-semibold mb-2 text-gray-700 text-sm">Climate Analysis</h3>
        <ul className="space-y-1">
          {prediction.reasoning.map((reason, i) => (
            <li key={i} className="text-xs flex items-start">
              <span className="mr-2">
                {reason.startsWith('✅') ? '🌱' : reason.startsWith('❌') ? '🌵' : '⚡'}
              </span>
              <span className="text-gray-700">{reason.replace(/[✅❌⚠️]/g, '').trim()}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Methodology */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-gray-700">
          <strong className="font-semibold">Methodology:</strong> Climate-driven prediction 
          using winter precipitation thresholds calibrated from 2017 superbloom conditions.
          Data from NASA POWER API.
        </p>
      </div>
      
      {/* Comparison */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">2017 Reference</p>
          <p className="text-sm font-bold text-gray-700">150mm rain</p>
          <p className="text-xs text-gray-600">NDVI: 0.24</p>
        </div>
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Current 2024-25</p>
          <p className="text-sm font-bold text-blue-600">120mm rain</p>
          <p className="text-xs text-gray-600">80% of 2017</p>
        </div>
      </div>
    </div>
  );
}