export const LOCATION_CONFIGS = {
  'anza-borrego': {
    id: 'anza-borrego',
    name: "Anza-Borrego Desert State Park",
    coords: [33.25, -116.18], // [lat, lng] format
    dataFile: "/data/anzaborrego.csv",
    color: "#ec4899",
    thresholds: {
      noBloom: 0.12,
      emerging: 0.15,
      blooming: 0.18,
      peakBloom: 0.22
    }
  },
  'carrizo-plain': {
    id: 'carrizo-plain',
    name: "Carrizo Plain National Monument",
    coords: [35.14, -119.84], // [lat, lng] format
    dataFile: "/data/carrizoplain.csv",
    color: "#f59e0b",
    thresholds: {
      noBloom: 0.20,
      emerging: 0.35,
      blooming: 0.50,
      peakBloom: 0.60
    }
  },
  'death-valley': {
    id: 'death-valley',
    name: "Death Valley National Park",
    coords: [36.25, -116.82], // [lat, lng] format
    disabled: true,
    disabledReason: "Insufficient bloom signal detected",
    color: "#9ca3af"
  }
};
