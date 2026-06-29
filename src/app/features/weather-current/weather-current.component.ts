import { Component, input } from '@angular/core';

import type { CurrentWeather, Location } from '../../core/models/weather.models';
import { conditionLabel } from '../../core/utils/weather-code.mapper';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { WeatherIconComponent } from '../../shared/components/weather-icon/weather-icon.component';
import {
  FullDateLabelPipe,
  RainChancePipe,
  TempPipe,
  WindSpeedPipe,
} from '../../shared/pipes/weather.pipes';

@Component({
  selector: 'app-weather-current',
  imports: [
    WeatherIconComponent,
    MetricCardComponent,
    TempPipe,
    WindSpeedPipe,
    RainChancePipe,
    FullDateLabelPipe,
  ],
  template: `
    @if (current(); as weather) {
      <section class="current card" aria-label="Current weather conditions">
        <div class="current__hero-panel">
          <div class="current__meta">
            <h2 class="current__location">{{ location().name }}</h2>
            @if (location().admin1) {
              <p class="current__region">{{ location().admin1 }}, {{ location().country }}</p>
            }
            <p class="current__date">{{ selectedDate() | fullDateLabel }}</p>
          </div>

          <div class="current__hero">
            <div class="current__reading">
              <span class="current__temp">{{ weather.temperature | temp }}</span>
              <span class="current__condition">{{ conditionLabel(weather.condition) }}</span>
            </div>
            <app-weather-icon [condition]="weather.condition" size="lg" />
          </div>

          <div class="current__metrics">
            <app-metric-card label="Rain" tone="rain" variant="compact" [value]="weather.rainProbability | rainChance" />
            <app-metric-card label="Humidity" tone="humidity" variant="compact" [value]="weather.humidity" unit="%" />
            <app-metric-card label="Wind" tone="wind" variant="compact" [value]="weather.windSpeed | windSpeed" />
          </div>
        </div>
      </section>
    }
  `,
  styles: `
    .current {
      padding: 0;
      overflow: hidden;
      border: none;
      box-shadow: var(--shadow-md);
    }

    .current__hero-panel {
      padding: 1.5rem;
      background: var(--hero-gradient);
      color: #fff;
    }

    .current__meta {
      margin-bottom: 1.25rem;
    }

    .current__location {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .current__region {
      margin: 0.125rem 0 0;
      font-size: 0.8125rem;
      color: var(--hero-text-subtle);
    }

    .current__date {
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      color: var(--hero-text-faint);
    }

    .current__hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .current__reading {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .current__temp {
      font-size: 3rem;
      font-weight: 300;
      letter-spacing: -0.04em;
      line-height: 1;
    }

    .current__condition {
      font-size: 1rem;
      font-weight: 500;
      opacity: 0.9;
    }

    .current__metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      padding: 0.875rem 1.5rem 1.25rem;
      background: rgba(255, 255, 255, 0.12);
      border-top: 1px solid rgba(255, 255, 255, 0.15);
    }

    :host ::ng-deep .current__metrics .metric-card__label {
      color: var(--hero-metric-label);
    }

    :host ::ng-deep .current__metrics .metric-card__value {
      color: #fff;
      font-size: 1rem;
    }

    @media (max-width: 400px) {
      .current__metrics {
        grid-template-columns: 1fr;
        gap: 0.625rem;
      }
    }
  `,
})
export class WeatherCurrentComponent {
  readonly location = input.required<Location>();
  readonly current = input.required<CurrentWeather | null>();
  readonly selectedDate = input.required<string>();

  protected conditionLabel = conditionLabel;
}
