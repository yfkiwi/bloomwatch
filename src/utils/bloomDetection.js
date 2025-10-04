export function getBloomStatus(ndvi) {
  if (ndvi >= 0.6) {
    return {
      status: 'peak',
      color: '#22c55e',
      label: '🟢 Peak Bloom'
    }
  }
  if (ndvi >= 0.4) {
    return {
      status: 'emerging',
      color: '#eab308',
      label: '🟡 Emerging'
    }
  }
  return {
    status: 'none',
    color: '#ef4444',
    label: '🔴 No Bloom'
  }
}

export function detectBloomAlert(ndviTimeSeries) {
  const alert = ndviTimeSeries.find(d => d.ndvi >= 0.6)
  return alert ? alert.date : null
}

export function getPeakBloom(ndviTimeSeries) {
  return ndviTimeSeries.reduce((max, d) => 
    d.ndvi > max.ndvi ? d : max
  )
}

export function getDaysAdvanceWarning(alertDate, peakDate) {
  const alert = new Date(alertDate)
  const peak = new Date(peakDate)
  const diff = peak - alert
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function filterDataByDateRange(data, startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return data.filter(d => {
    const date = new Date(d.date)
    return date >= start && date <= end
  })
}