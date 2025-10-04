export function getBloomStatus(ndvi) {
  if (ndvi >= 0.22) {
    return { label: 'Peak Bloom', color: '#22c55e' }; // Green
  } else if (ndvi >= 0.18) {
    return { label: 'Emerging Bloom', color: '#eab308' }; // Yellow
  } else if (ndvi >= 0.12) {
    return { label: 'Early Growth', color: '#f97316' }; // Orange
  } else {
    return { label: 'Dormant', color: '#8b4513' }; // Brown
  }
}

export function detectBloomAlert(ndviTimeSeries) {
  const alert = ndviTimeSeries.find(d => d.ndvi >= 0.22)
  return alert ? alert.date : null
}

export function getPeakBloom(ndviTimeSeries) {
  return ndviTimeSeries.reduce((max, d) => 
    d.ndvi > max.ndvi ? d : max
  )
}

export function getDaysAdvanceWarning(alertDate, peakDate) {
  const alert = new Date(alertDate);
  const peak = new Date(peakDate);
  return Math.round((peak - alert) / (1000 * 60 * 60 * 24));
}

export function filterDataByDateRange(data, startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return data.filter(d => {
    const date = new Date(d.date)
    return date >= start && date <= end
  })
}