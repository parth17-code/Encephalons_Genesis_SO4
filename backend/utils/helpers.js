const crypto = require('crypto');

/**
 * Generate SHA-256 hash for image
 */
const generateImageHash = (imageBuffer) => {
  return crypto.createHash('sha256').update(imageBuffer).digest('hex');
};

/**
 * Calculate distance between two geo points (Haversine formula)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const toRad = (value) => {
  return value * Math.PI / 180;
};

/**
 * Check if location is within acceptable radius
 */
const isWithinRadius = (lat1, lng1, lat2, lng2, maxRadius = 0.5) => {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= maxRadius; // Default 500m radius
};

/**
 * Check if timestamp is fresh (within last 30 minutes)
 */
const isTimestampFresh = (timestamp, maxMinutes = 30) => {
  const now = new Date();
  const diff = Math.abs(now - new Date(timestamp)) / 1000 / 60; // diff in minutes
  return diff <= maxMinutes;
};

/**
 * Get current week number
 */
const getWeekNumber = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Generate unique ID
 */
const generateUniqueId = (prefix = '') => {
  return `${prefix}${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
};

/**
 * Calculate days since last proof
 */
const daysSince = (date) => {
  const now = new Date();
  const diff = Math.abs(now - new Date(date));
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

module.exports = {
  generateImageHash,
  calculateDistance,
  isWithinRadius,
  isTimestampFresh,
  getWeekNumber,
  generateUniqueId,
  daysSince
};