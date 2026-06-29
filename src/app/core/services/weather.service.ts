import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import type {
  DailyForecast,
  HourlyForecast,
  Location,
  MapWeatherPoint,
  WeatherData,
} from '../models/weather.models';
import { mapWeatherCode } from '../utils/weather-code.mapper';

type ForecastApiResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
};

type GridApiResponse = {
  points: MapWeatherPoint[];
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);

  getForecast(location: Location, date?: string): Observable<WeatherData> {
    const params: Record<string, string> = {
      lat: String(location.latitude),
      lon: String(location.longitude),
    };
    if (date) {
      params['date'] = date;
    }

    return this.http
      .get<ForecastApiResponse>('/api/weather', { params })
      .pipe(map((response) => this.transformForecast(location, response, date)));
  }

  getGridForecast(date?: string): Observable<MapWeatherPoint[]> {
    const params: Record<string, string> = {};
    if (date) {
      params['date'] = date;
    }

    return this.http
      .get<GridApiResponse>('/api/weather/grid', { params })
      .pipe(map((response) => response.points));
  }

  private transformForecast(
    location: Location,
    response: ForecastApiResponse,
    selectedDate?: string,
  ): WeatherData {
    const targetDate = selectedDate ?? response.current.time.slice(0, 10);
    const hourlyIndices = response.hourly.time
      .map((time, index) => ({ time, index }))
      .filter(({ time }) => time.startsWith(targetDate));

    const currentHourIndex = this.findNearestHourIndex(
      response.hourly.time,
      response.current.time,
    );
    const rainProbability =
      response.hourly.precipitation_probability[currentHourIndex] ?? 0;

    const hourly: HourlyForecast[] = hourlyIndices.map(({ time, index }) => ({
      time,
      temperature: response.hourly.temperature_2m[index],
      rainProbability: response.hourly.precipitation_probability[index] ?? 0,
      weatherCode: response.hourly.weather_code[index],
      condition: mapWeatherCode(response.hourly.weather_code[index]),
    }));

    const daily: DailyForecast[] = response.daily.time.map((day, index) => ({
      date: day,
      tempMax: response.daily.temperature_2m_max[index],
      tempMin: response.daily.temperature_2m_min[index],
      rainProbability: response.daily.precipitation_probability_max[index] ?? 0,
      weatherCode: response.daily.weather_code[index],
      condition: mapWeatherCode(response.daily.weather_code[index]),
    }));

    const selectedDaily = daily.find((day) => day.date === targetDate);

    return {
      location,
      current: {
        temperature: selectedDaily
          ? Math.round((selectedDaily.tempMax + selectedDaily.tempMin) / 2)
          : response.current.temperature_2m,
        humidity: response.current.relative_humidity_2m,
        windSpeed: response.current.wind_speed_10m,
        rainProbability: selectedDaily?.rainProbability ?? rainProbability,
        condition: selectedDaily
          ? selectedDaily.condition
          : mapWeatherCode(response.current.weather_code),
        observedAt: response.current.time,
        weatherCode: selectedDaily?.weatherCode ?? response.current.weather_code,
      },
      hourly,
      daily,
    };
  }

  private findNearestHourIndex(times: string[], currentTime: string): number {
    const currentMs = new Date(currentTime).getTime();
    let nearestIndex = 0;
    let smallestDiff = Number.POSITIVE_INFINITY;

    times.forEach((time, index) => {
      const diff = Math.abs(new Date(time).getTime() - currentMs);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }
}
