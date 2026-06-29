import type { WeatherCondition } from '../models/weather.models';

/**
 * Maps WMO weather interpretation codes to NEMS condition labels.
 * @see https://open-meteo.com/en/docs
 */
export const mapWeatherCode = (code: number): WeatherCondition => {
  if (code === 0) {
    return 'sunny';
  }
  if (code >= 1 && code <= 2) {
    return 'partly-cloudy';
  }
  if (code >= 3 && code <= 48) {
    return 'cloudy';
  }
  if (code >= 51 && code <= 67) {
    return 'rainy';
  }
  if (code >= 80 && code <= 82) {
    return 'rainy';
  }
  if (code >= 95 && code <= 99) {
    return 'thunderstorm';
  }
  return 'partly-cloudy';
};

export const conditionLabel = (condition: WeatherCondition): string => {
  const labels: Record<WeatherCondition, string> = {
    sunny: 'Sunny',
    'partly-cloudy': 'Partly Cloudy',
    cloudy: 'Cloudy',
    rainy: 'Rainy',
    thunderstorm: 'Thunderstorm',
  };
  return labels[condition];
};

export const conditionEmoji = (condition: WeatherCondition): string => {
  const emojis: Record<WeatherCondition, string> = {
    sunny: '☀️',
    'partly-cloudy': '⛅',
    cloudy: '☁️',
    rainy: '🌧️',
    thunderstorm: '⛈️',
  };
  return emojis[condition];
};

export const mapMarkerColor = (
  condition: WeatherCondition,
  rainProbability: number,
  temperature: number,
): string => {
  if (condition === 'thunderstorm') {
    return '#8b5cf6';
  }
  if (rainProbability >= 50 || condition === 'rainy') {
    return '#3b82f6';
  }
  if (temperature >= 32 || condition === 'sunny') {
    return '#f59e0b';
  }
  if (condition === 'cloudy' || condition === 'partly-cloudy') {
    return '#94a3b8';
  }
  return '#22c55e';
};
