import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { CAGAYAN_DE_ORO } from '../../core/constants/mindanao.config';
import type { Location, WeatherData } from '../../core/models/weather.models';
import { WeatherService } from '../../core/services/weather.service';
import { LocationSearchComponent } from '../location-search/location-search.component';
import { WeatherCurrentComponent } from '../weather-current/weather-current.component';
import { WeatherDailyComponent } from '../weather-daily/weather-daily.component';
import { WeatherHourlyComponent } from '../weather-hourly/weather-hourly.component';
import { WeatherMapComponent } from '../weather-map/weather-map.component';

@Component({
  selector: 'app-home',
  imports: [
    LocationSearchComponent,
    WeatherCurrentComponent,
    WeatherHourlyComponent,
    WeatherDailyComponent,
    WeatherMapComponent,
  ],
  template: `
    <div class="page">
      <section id="forecast" class="page__controls nems-enter nems-enter--up">
        <app-location-search
          [selectedDate]="selectedDate()"
          [activeLocation]="location()"
          (dateChange)="handleDateChange($event)"
          (locationSelect)="handleLocationSelect($event)"
        />
      </section>

      <section id="map" class="page__map nems-enter nems-enter--up nems-enter--d1">
        <app-weather-map
          [activeLocation]="location()"
          [selectedDate]="selectedDate()"
          (locationSelect)="handleLocationSelect($event)"
        />
      </section>

      @if (error()) {
        <div class="page__alert" role="alert">
          <span>{{ error() }}</span>
          <button type="button" class="page__alert-btn" (click)="loadWeather()">Retry</button>
        </div>
      }

      @if (loading()) {
        <div class="page__loading nems-enter nems-enter--fade" aria-live="polite">
          <div class="page__spinner" aria-hidden="true"></div>
          <p>Fetching latest conditions…</p>
        </div>
      }

      @if (weather(); as data) {
        <app-weather-current
          class="nems-enter nems-enter--scale nems-enter--d2"
          [location]="data.location"
          [current]="data.current"
          [selectedDate]="selectedDate()"
        />

        <section class="forecast-group card nems-enter nems-enter--up nems-enter--d3" aria-label="Forecast">
          <app-weather-daily
            class="forecast-group__daily"
            [daily]="data.daily"
            [selectedDate]="selectedDate()"
            (daySelect)="handleDateChange($event)"
          />
          <div class="forecast-group__divider" aria-hidden="true"></div>
          <app-weather-hourly
            class="forecast-group__hourly"
            [hourly]="data.hourly"
          />
        </section>
      }

      <footer class="page__footer">
        <p class="page__footer-tagline">Neighbourhood Environmental Monitoring</p>
        <p>Open-Meteo · Cagayan de Oro &amp; Mindanao</p>
      </footer>
    </div>
  `,
  styles: `
    .page {
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
      padding: 1.25rem 1rem 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page__controls {
      position: relative;
      z-index: 30;
      scroll-margin-top: calc(var(--nav-height) + 1rem);
    }

    .page__map {
      position: relative;
      z-index: 1;
      scroll-margin-top: calc(var(--nav-height) + 1rem);
    }

    .page__loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.875rem;
      padding: 2.5rem 1rem;
      color: var(--text-secondary);
      font-size: 0.9375rem;
    }

    .page__spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid var(--accent-soft);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .page__alert {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-md);
      background: var(--danger-bg);
      border: 1px solid var(--danger-border);
      color: var(--danger);
      font-size: 0.875rem;
    }

    .page__alert-btn {
      padding: 0.375rem 0.875rem;
      border: 1px solid var(--danger-border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      color: var(--danger);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    }

    .page__alert-btn:hover,
    .page__alert-btn:focus-visible {
      background: var(--danger-bg);
      outline: none;
    }

    .forecast-group {
      padding: 0;
      overflow: hidden;
    }

    .forecast-group__divider {
      height: 1px;
      margin: 0 1.25rem;
      background: var(--border);
    }

    :host ::ng-deep .forecast-group__daily .daily,
    :host ::ng-deep .forecast-group__hourly .hourly {
      box-shadow: none;
      border: none;
      border-radius: 0;
    }

    .page__footer {
      padding-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .page__footer p {
      margin: 0;
      font-size: 0.6875rem;
      color: var(--text-muted);
      text-align: center;
    }

    .page__footer-tagline {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly weatherService = inject(WeatherService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly location = signal<Location>(CAGAYAN_DE_ORO);
  protected readonly selectedDate = signal(new Date().toISOString().slice(0, 10));
  protected readonly weather = signal<WeatherData | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  private skipQueryParamLoad = false;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (this.skipQueryParamLoad) {
          return;
        }

        const lat = Number(params.get('lat'));
        const lon = Number(params.get('lon'));
        const name = params.get('name');
        const date = params.get('date');

        if (date) {
          this.selectedDate.set(date);
        }

        if (!Number.isNaN(lat) && !Number.isNaN(lon) && name) {
          this.location.set({
            name,
            latitude: lat,
            longitude: lon,
            admin1: params.get('admin1') ?? undefined,
            country: params.get('country') ?? 'Philippines',
          });
        }

        this.loadWeather();
      });
  }

  protected handleLocationSelect(location: Location): void {
    this.applySelection(location, this.selectedDate());
  }

  protected handleDateChange(date: string): void {
    this.applySelection(this.location(), date);
  }

  protected loadWeather(): void {
    const location = this.location();
    const date = this.selectedDate();

    this.loading.set(true);
    this.error.set(null);

    this.weatherService
      .getForecast(location, date)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((forecast) => {
        this.loading.set(false);

        if (!forecast) {
          this.error.set('Unable to load weather data. Please try again.');
          return;
        }

        this.weather.set(forecast);
      });
  }

  private applySelection(location: Location, date: string): void {
    this.location.set(location);
    this.selectedDate.set(date);
    this.loadWeather();
    this.syncQueryParams(location, date);
  }

  private syncQueryParams(location: Location, date: string): void {
    this.skipQueryParamLoad = true;

    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {
          name: location.name,
          lat: location.latitude,
          lon: location.longitude,
          admin1: location.admin1 ?? null,
          country: location.country ?? null,
          date,
        },
        queryParamsHandling: 'merge',
      })
      .finally(() => {
        this.skipQueryParamLoad = false;
      });
  }
}
