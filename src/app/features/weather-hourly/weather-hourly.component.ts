import { Component, input } from '@angular/core';

import type { HourlyForecast } from '../../core/models/weather.models';
import { WeatherIconComponent } from '../../shared/components/weather-icon/weather-icon.component';
import { HourLabelPipe, RainChancePipe, TempPipe } from '../../shared/pipes/weather.pipes';

@Component({
  selector: 'app-weather-hourly',
  imports: [WeatherIconComponent, HourLabelPipe, TempPipe, RainChancePipe],
  template: `
    <section class="hourly" aria-label="Hourly forecast">
      <h3 class="section-title section-title--subtle">Hourly</h3>
      <div
        class="hourly__scroll scroll-x"
        tabindex="0"
        role="region"
        aria-label="Scroll hourly forecast"
      >
        @for (hour of hourly(); track hour.time) {
          <article class="hourly__item">
            <time class="hourly__time">{{ hour.time | hourLabel }}</time>
            <app-weather-icon [condition]="hour.condition" size="sm" />
            <span class="hourly__temp">{{ hour.temperature | temp }}</span>
            <span
              class="hourly__rain"
              [class.hourly__rain--wet]="hour.rainProbability >= 30"
            >
              {{ hour.rainProbability | rainChance }}
            </span>
          </article>
        } @empty {
          <p class="hourly__empty">No hourly data for this date.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .hourly {
      padding: 1.25rem;
    }

    .hourly__scroll {
      display: flex;
      gap: 0;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      scroll-snap-type: x mandatory;
    }

    .hourly__item {
      flex: 0 0 auto;
      scroll-snap-align: start;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      min-width: 3.75rem;
      padding: 0.625rem 0.75rem;
      border-right: 1px solid var(--border);
    }

    .hourly__item:last-child {
      border-right: none;
    }

    .hourly__time {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .hourly__temp {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .hourly__rain {
      font-size: 0.625rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .hourly__rain--wet {
      color: var(--metric-rain-text);
    }

    .hourly__empty {
      margin: 0;
      padding: 0.75rem 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
  `,
})
export class WeatherHourlyComponent {
  readonly hourly = input.required<HourlyForecast[]>();
}
