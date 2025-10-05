import { getBloomStatus } from '../utils/bloomVisualization';
import { calculateWinterPrecipitation } from '../utils/precipitationAPI';
import NDVIChart from './NDVIChart';

function BloomDataTab({ location, date, ndviData, precipData, dataSource, dataError }) {
  // Add safety check at component level
  if (!ndviData || ndviData.length === 0) {
    return (
      <div className="bloom-data-tab">
        <p>Loading data for {location.name}...</p>
      </div>
    );
  }
  
  // Helper function to get NDVI for a specific date
  const getNDVIForDate = (date, ndviData) => {
    if (!ndviData || !date || !Array.isArray(ndviData)) {
      console.log('Invalid ndviData:', ndviData);
      return 0;
    }
    
    const dateStr = new Date(date).toISOString().split('T')[0];
    const exactMatch = ndviData.find(d => d.date === dateStr);
    if (exactMatch) {
      console.log(`Found exact match for ${dateStr}: NDVI ${exactMatch.ndvi}`);
      return exactMatch.ndvi;
    }
    
    // Find closest date
    const targetTime = new Date(dateStr).getTime();
    let closest = ndviData[0];
    let minDiff = Math.abs(new Date(ndviData[0].date).getTime() - targetTime);
    
    ndviData.forEach(d => {
      const diff = Math.abs(new Date(d.date).getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    });
    
    console.log(`Using closest match for ${dateStr}: ${closest.date} with NDVI ${closest.ndvi}`);
    return closest.ndvi;
  };

  console.log(`=== BloomDataTab Debug ===`);
  console.log(`Location:`, location);
  console.log(`Date:`, date);
  console.log(`NDVI Data:`, ndviData ? `${ndviData.length} records` : 'null');

  const currentNDVI = getNDVIForDate(date, ndviData);
  console.log(`Current NDVI: ${currentNDVI}`);
  
  const bloomStatus = getBloomStatus(currentNDVI, location.id);
  console.log(`Bloom status:`, bloomStatus);
  
  const year = new Date(date).getFullYear();
  const winterPrecip = precipData.data 
    ? calculateWinterPrecipitation(precipData.data, year)
    : null;
  
  return (
    <div className="bloom-data-tab">
      {/* Header */}
      <div className="location-header">
        <h2>{location.name}</h2>
        <p className="date">{new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
        
        {/* Show data source tag */}
        {dataSource === 'forecast' && (
          <span className="data-source-tag" style={{
            display: 'inline-block',
            padding: '4px 8px',
            background: '#dbeafe',
            color: '#1e40af',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            marginTop: '4px'
          }}>
            🔮 AI Prediction
          </span>
        )}
        
        {dataError && (
          <p style={{color: '#ef4444', fontSize: '14px', marginTop: '8px'}}>
            ⚠️ {dataError}
          </p>
        )}
      </div>
      
      {/* Main Bloom Status */}
      <div className={`bloom-status-hero ${bloomStatus.class}`}>
        <div className="status-badge">
          <span className="emoji">{bloomStatus.emoji}</span>
          <span className="text">{bloomStatus.text}</span>
        </div>
        <p className="description">{bloomStatus.description}</p>
        
        {/* Show bloom cause if wet winter + blooming */}
        {currentNDVI >= location.thresholds.blooming && 
         winterPrecip && winterPrecip > 100 && (
          <p className="bloom-cause">
            Triggered by wet winter ({Math.round(winterPrecip)}mm precipitation)
          </p>
        )}
      </div>
      
      {/* NDVI Metric */}
      <div className="ndvi-metric">
        <span className="label">NDVI</span>
        <span className="value">{currentNDVI.toFixed(3)}</span>
      </div>
      
      {/* NDVI Chart */}
      <div className="ndvi-chart-container">
        <h3>Bloom Progression</h3>
        <div style={{ height: '400px' }}>
          <NDVIChart locationId={location.id} highlightDate={date} ndviData={ndviData} dataSource={dataSource} />
        </div>
      </div>
      
      {/* Viewing Tips (always visible) */}
      <div className="viewing-tips">
        <h4>Viewing Tips</h4>
        <p>{getViewingTips(location.id)}</p>
      </div>
      
      {/* Advanced Data (collapsed, hidden if precip failed) */}
      {!precipData.error && (
        <details className="advanced-data">
          <summary>🔬 Data Details</summary>
          <div className="data-grid">
            {precipData.loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading precipitation data...</p>
              </div>
            ) : precipData.data ? (
              <>
                <div className="data-item">
                  <span className="label">Winter Precipitation</span>
                  <span className="value">{winterPrecip ? Math.round(winterPrecip) : '--'}mm</span>
                </div>
                <div className="data-item">
                  <span className="label">Peak NDVI</span>
                  <span className="value">{currentNDVI.toFixed(3)}</span>
                </div>
              </>
            ) : null}
          </div>
        </details>
      )}
    </div>
  );
}

// Helper function
function getViewingTips(locationId) {
  const tips = {
    'anza-borrego': "Henderson Canyon Road and Borrego Palm Canyon Trail offer spectacular displays.",
    'carrizo-plain': "Soda Lake Road provides easy access to hillside blooms. Arrive on weekdays to avoid crowds."
  };
  return tips[locationId] || "Check local conditions before visiting.";
}

export default BloomDataTab;
