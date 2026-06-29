import type { Location } from '../models/weather.models';

export const CAGAYAN_DE_ORO: Location = {
  name: 'Cagayan de Oro',
  latitude: 8.4542,
  longitude: 124.6319,
  admin1: 'Misamis Oriental',
  country: 'Philippines',
};

export const MINDANAO_BOUNDS = {
  south: 5.0,
  north: 9.5,
  west: 124.0,
  east: 127.0,
};

export const MAP_CENTER: [number, number] = [8.2, 125.5];

export const MAP_ZOOM = 7;

/** Grid spacing in degrees for regional weather map overlay */
export const MAP_GRID_STEP = 1.5;

/** Show detailed grid dots at this zoom level and above */
export const MAP_GRID_MIN_ZOOM = 9;

export const PRESET_LOCATIONS: Location[] = [
  CAGAYAN_DE_ORO,
  {
    name: 'Butuan',
    latitude: 8.9475,
    longitude: 125.5406,
    admin1: 'Agusan del Norte',
    country: 'Philippines',
  },
  {
    name: 'Davao City',
    latitude: 7.1907,
    longitude: 125.4553,
    admin1: 'Davao del Sur',
    country: 'Philippines',
  },
  {
    name: 'General Santos',
    latitude: 6.1164,
    longitude: 125.1716,
    admin1: 'South Cotabato',
    country: 'Philippines',
  },
  {
    name: 'Iligan',
    latitude: 8.228,
    longitude: 124.2452,
    admin1: 'Lanao del Norte',
    country: 'Philippines',
  },
  {
    name: 'Zamboanga City',
    latitude: 6.9214,
    longitude: 122.079,
    admin1: 'Zamboanga del Sur',
    country: 'Philippines',
  },
];
