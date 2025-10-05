import predictions from '../data/predictions2025_2026.json'

/**
 * Service for accessing 2025-2026 bloom prediction data
 * Data structure per location:
 * - predictedPeakDate, predictedStartDate, predictedEndDate
 * - predictedPeakNDVI, predictionConfidence, modelAccuracy
 * - inputFeatures: { winterPrecipitation_mm, winterAvgTemperature_C }
 * - ndviData: array of { date, ndvi, predicted, confidence?, offSeason? }
 */
class PredictionService {
  constructor() {
    this.cache = predictions
  }

  /**
   * Get all prediction data for a location
   * @param {string} locationId - e.g., 'anza-borrego', 'carrizo-plain'
   * @returns {Object|null} Full prediction object or null
   */
  getPredictionsForLocation(locationId) {
    return this.cache[locationId] || null
  }

  /**
   * Get NDVI data for a specific date
   * @param {string} locationId
   * @param {string} dateStr - Format: YYYY-MM-DD
   * @returns {Object|null} { date, ndvi, predicted, ... } or null
   */
  getPredictedNDVIForDate(locationId, dateStr) {
    const location = this.cache[locationId]
    if (!location) return null
    const entry = (location.ndviData || []).find(d => d.date === dateStr)
    return entry || null
  }

  /**
   * Get complete NDVI time series (includes offSeason data)
   * @param {string} locationId
   * @returns {Array} Array of { date, ndvi, predicted, ... }
   */
  getPredictedSeries(locationId) {
    const location = this.cache[locationId]
    return (location && location.ndviData) ? location.ndviData : []
  }

  /**
   * Get only bloom prediction period data (filters out offSeason)
   * @param {string} locationId
   * @returns {Array} Array with predicted: true entries only
   */
  getBloomPredictionSeries(locationId) {
    const location = this.cache[locationId]
    if (!location) return []
    return (location.ndviData || []).filter(d => d.predicted === true)
  }

  /**
   * Check if a date has actual prediction data (not offSeason)
   * @param {string} locationId
   * @param {string} dateStr
   * @returns {boolean}
   */
  hasPredictionForDate(locationId, dateStr) {
    const entry = this.getPredictedNDVIForDate(locationId, dateStr)
    return entry ? entry.predicted === true : false
  }

  /**
   * Check if date is within bloom prediction window
   * @param {string} locationId
   * @param {string} dateStr
   * @returns {boolean}
   */
  isInBloomPredictionRange(locationId, dateStr) {
    const location = this.cache[locationId]
    if (!location) return false
    const date = new Date(dateStr)
    const startDate = new Date(location.predictedStartDate)
    const endDate = new Date(location.predictedEndDate)
    return date >= startDate && date <= endDate
  }
}

export default new PredictionService()


