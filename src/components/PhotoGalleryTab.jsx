function PhotoGalleryTab({ location, date, ndviData }) {
  // Helper function to get NDVI for a specific date
  const getNDVIForDate = (date, ndviData) => {
    if (!ndviData || !date) return 0;
    const dateStr = new Date(date).toISOString().split('T')[0];
    return ndviData[dateStr] || 0;
  };

  const currentNDVI = getNDVIForDate(date, ndviData);
  const month = new Date(date).getMonth() + 1;
  
  // Determine which photo to show
  const isBloomPeriod = month >= 3 && month <= 5 && 
    currentNDVI >= location.thresholds.blooming;
  
  return (
    <div className="photo-gallery-tab">
      <h3>Bloom Photos</h3>
      
      {/* Photo Display */}
      <div className="gallery-display">
        {isBloomPeriod ? (
          <div className="photo-card bloom">
            <div className="placeholder-image peak">
              {/* Placeholder - replace with real images tomorrow */}
              <div className="placeholder-text">
                🌼 Peak Bloom Photo
                <br />
                <small>(Add screenshot here)</small>
              </div>
            </div>
            <p className="caption">Peak bloom - carpets of wildflowers</p>
          </div>
        ) : (
          <div className="photo-card dormant">
            <div className="placeholder-image desert">
              <div className="placeholder-text">
                🏜️ Desert Landscape
                <br />
                <small>(Add screenshot here)</small>
              </div>
            </div>
            <p className="caption">{month >= 6 ? 'Summer dormancy' : 'Pre-bloom landscape'}</p>
          </div>
        )}
      </div>
      
      {/* Future Feature Note */}
      <div className="future-feature">
        <p>
          📷 <strong>Coming Soon:</strong> Community-uploaded photos 
          will appear here, automatically synced with the timeline
        </p>
      </div>
      
      {/* Mock Upload Button */}
      <button 
        className="upload-btn-mock"
        onClick={() => alert('Photo upload feature coming soon! Users will be able to contribute bloom photos with geolocation and timestamp.')}
      >
        📤 Upload Bloom Photo
      </button>
      
      {/* Location Description */}
      <div className="location-description">
        <h4>Location Description</h4>
        <p>{getLocationDescription(location.id)}</p>
      </div>
    </div>
  );
}

function getLocationDescription(locationId) {
  const descriptions = {
    'anza-borrego': "California's largest state park becomes a wildflower wonderland after wet winters.",
    'carrizo-plain': "The 'Serengeti of California' hosts one of the state's most impressive superblooms."
  };
  return descriptions[locationId] || "";
}

export default PhotoGalleryTab;
