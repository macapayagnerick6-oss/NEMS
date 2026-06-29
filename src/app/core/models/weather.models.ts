export type WeatherCondition =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rainy'
  | 'thunderstorm';

export type Location = {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country: string;
};

export type CurrentWeather = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  condition: WeatherCondition;
  observedAt: string;
  weatherCode: number;
};

export type HourlyForecast = {
  time: string;
  temperature: number;
  rainProbability: number;
  condition: WeatherCondition;
  weatherCode: number;
};

export type DailyForecast = {
  date: string;
  tempMax: number;
  tempMin: number;
  rainProbability: number;
  condition: WeatherCondition;
  weatherCode: number;
};

export type WeatherData = {
  location: Location;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
};

export type MapWeatherPoint = {
  latitude: number;
  longitude: number;
  temperature: number;
  rainProbability: number;
  condition: WeatherCondition;
  weatherCode: number;
};

export type GeocodingResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
};
