import type { Request, Response } from 'express';

import {
  MAP_GRID_STEP,
  MINDANAO_BOUNDS,
} from '../app/core/constants/mindanao.config';
import { mapWeatherCode } from '../app/core/utils/weather-code.mapper';

const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';

const FORECAST_PARAMS =
  'current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
  '&hourly=temperature_2m,precipitation_probability,weather_code' +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
  '&timezone=Asia%2FManila&forecast_days=16';

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const getCached = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
};

const setCache = <T>(key: string, data: T, ttlMs: number): void => {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
};

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_USER_AGENT = 'NEMS-Weather-App/1.0 (Neighbourhood Environmental Monitoring)';

type NominatimAddress = {
  municipality?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  neighbourhood?: string;
  county?: string;
  state?: string;
  country?: string;
};

type NominatimReverseResponse = {
  display_name?: string;
  address?: NominatimAddress;
};

const extractPlaceName = (data: NominatimReverseResponse): string => {
  const address = data.address ?? {};
  const candidates = [
    address.municipality,
    address.town,
    address.city,
    address.village,
    address.hamlet,
    address.suburb,
    address.neighbourhood,
  ].filter((value): value is string => Boolean(value));

  if (candidates.length > 0) {
    return candidates[0];
  }

  const displayName = data.display_name?.split(',')[0]?.trim();
  return displayName || 'Selected location';
};

const MINDANAO_BUFFER = 1;

const isInMindanao = (lat: number, lon: number): boolean =>
  lat >= MINDANAO_BOUNDS.south - MINDANAO_BUFFER &&
  lat <= MINDANAO_BOUNDS.north + MINDANAO_BUFFER &&
  lon >= MINDANAO_BOUNDS.west - MINDANAO_BUFFER &&
  lon <= MINDANAO_BOUNDS.east + MINDANAO_BUFFER;

export const handleReverseGeocode = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = Number(req.query['lat']);
    const lon = Number(req.query['lon']);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      res.status(400).json({ error: 'lat and lon are required' });
      return;
    }

    if (!isInMindanao(lat, lon)) {
      res.status(400).json({ error: 'Location outside Mindanao region' });
      return;
    }

    const cacheKey = `reverse:${lat.toFixed(3)}:${lon.toFixed(3)}`;
    const cached = getCached<{ result: unknown }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const url =
      `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lon}` +
      '&format=json&addressdetails=1&zoom=14&accept-language=en';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let data: NominatimReverseResponse;
    try {
      data = await fetchJson<NominatimReverseResponse>(url, {
        headers: { 'User-Agent': NOMINATIM_USER_AGENT },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const address = data.address ?? {};
    const payload = {
      result: {
        name: extractPlaceName(data),
        latitude: lat,
        longitude: lon,
        admin1: address.state ?? address.county,
        country: 'Philippines',
      },
    };

    setCache(cacheKey, payload, 7 * 24 * 60 * 60 * 1000);
    res.json(payload);
  } catch {
    res.status(502).json({ error: 'Reverse geocoding service unavailable' });
  }
};

export const handleGeocode = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = String(req.query['q'] ?? '').trim();
    if (query.length < 2) {
      res.json({ results: [] });
      return;
    }

    const cacheKey = `geocode:mindanao:${query.toLowerCase()}`;
    const cached = getCached<{ results: unknown[] }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const url =
      `${OPEN_METEO_GEOCODE}?name=${encodeURIComponent(query)}` +
      '&count=10&language=en&country_code=PH';
    const data = await fetchJson<{ results?: unknown[] }>(url);
    const results = (data.results ?? []).filter((result) => {
      const item = result as { latitude: number; longitude: number };
      return isInMindanao(item.latitude, item.longitude);
    });
    const payload = { results };

    setCache(cacheKey, payload, 24 * 60 * 60 * 1000);
    res.json(payload);
  } catch {
    res.status(502).json({ error: 'Geocoding service unavailable' });
  }
};

export const handleWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = Number(req.query['lat']);
    const lon = Number(req.query['lon']);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      res.status(400).json({ error: 'lat and lon are required' });
      return;
    }

    const cacheKey = `weather:${lat}:${lon}`;
    const cached = getCached<unknown>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const url = `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lon}&${FORECAST_PARAMS}`;
    const data = await fetchJson<unknown>(url);
    setCache(cacheKey, data, 15 * 60 * 1000);
    res.json(data);
  } catch {
    res.status(502).json({ error: 'Weather service unavailable' });
  }
};

type ForecastPoint = {
  latitude: number;
  longitude: number;
  current: {
    temperature_2m: number;
    weather_code: number;
  };
  hourly: {
    precipitation_probability: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
  };
};

export const handleWeatherGrid = async (req: Request, res: Response): Promise<void> => {
  try {
    const date = String(req.query['date'] ?? new Date().toISOString().slice(0, 10));
    const cacheKey = `grid:${date}`;
    const cached = getCached<{ points: unknown[] }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const coordinates: { lat: number; lon: number }[] = [];
    for (let lat = MINDANAO_BOUNDS.south; lat <= MINDANAO_BOUNDS.north; lat += MAP_GRID_STEP) {
      for (let lon = MINDANAO_BOUNDS.west; lon <= MINDANAO_BOUNDS.east; lon += MAP_GRID_STEP) {
        coordinates.push({ lat, lon });
      }
    }

    const points = await Promise.all(
      coordinates.map(async ({ lat, lon }) => {
        const url =
          `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lon}&${FORECAST_PARAMS}`;
        const data = await fetchJson<ForecastPoint>(url);
        const dayIndex = data.daily.time.indexOf(date);
        const useDaily = dayIndex >= 0;

        const temperature = useDaily
          ? data.daily.temperature_2m_max[dayIndex]
          : data.current.temperature_2m;
        const rainProbability = useDaily
          ? (data.daily.precipitation_probability_max[dayIndex] ?? 0)
          : (data.hourly.precipitation_probability[0] ?? 0);
        const weatherCode = useDaily
          ? data.daily.weather_code[dayIndex]
          : data.current.weather_code;

        return {
          latitude: lat,
          longitude: lon,
          temperature,
          rainProbability,
          weatherCode,
          condition: mapWeatherCode(weatherCode),
        };
      }),
    );

    const payload = { points };
    setCache(cacheKey, payload, 30 * 60 * 1000);
    res.json(payload);
  } catch {
    res.status(502).json({ error: 'Weather grid service unavailable' });
  }
};
