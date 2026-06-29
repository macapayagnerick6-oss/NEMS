import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { MINDANAO_BOUNDS } from '../constants/mindanao.config';
import type { GeocodingResult, Location } from '../models/weather.models';

type GeocodingApiResponse = {
  results?: GeocodingResult[];
};

const MINDANAO_BUFFER = 1;

const isInMindanao = (lat: number, lon: number): boolean =>
  lat >= MINDANAO_BOUNDS.south - MINDANAO_BUFFER &&
  lat <= MINDANAO_BOUNDS.north + MINDANAO_BUFFER &&
  lon >= MINDANAO_BOUNDS.west - MINDANAO_BUFFER &&
  lon <= MINDANAO_BOUNDS.east + MINDANAO_BUFFER;

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);

  search(query: string): Observable<Location[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return new Observable((subscriber) => {
        subscriber.next([]);
        subscriber.complete();
      });
    }

    return this.http
      .get<GeocodingApiResponse>('/api/geocode', {
        params: { q: trimmed },
      })
      .pipe(
        map((response) =>
          (response.results ?? [])
            .filter((result) => isInMindanao(result.latitude, result.longitude))
            .map((result) => ({
              name: result.name,
              latitude: result.latitude,
              longitude: result.longitude,
              admin1: result.admin1,
              country: 'Philippines',
            })),
        ),
      );
  }

  reverseGeocode(latitude: number, longitude: number): Observable<Location | null> {
    return this.http
      .get<{ result?: Location }>('/api/reverse-geocode', {
        params: {
          lat: String(latitude),
          lon: String(longitude),
        },
      })
      .pipe(map((response) => response.result ?? null));
  }
}
