import { Component, input, output } from '@angular/core';

import type { DailyForecast } from '../../core/models/weather.models';
import { WeatherIconComponent } from '../../shared/components/weather-icon/weather-icon.component';
import { DayLabelPipe, RainChancePipe, TempPipe } from '../../shared/pipes/weather.pipes';

@Component({
  selector: 'app-weather-daily',
  imports: [WeatherIconComponent, DayLabelPipe, TempPipe, RainChancePipe],
  template: `
    <section class="daily" aria-label="Daily forecast">
      <h3 class="section-title section-title--subtle">7-Day</h3>
      <div class="daily__list">
        @for (day of daily().slice(0, 7); track day.date) {
          <button
            type="button"
            class="daily__row"
            [class.daily__row--active]="day.date === selectedDate()"
            (click)="daySelect.emit(day.date)"
          >
            <span class="daily__date">{{ day.date | dayLabel }}</span>
            <app-weather-icon [condition]="day.condition" size="sm" />
            <span
              class="daily__rain"
              [class.daily__rain--wet]="day.rainProbability >= 30"
            >
              {{ day.rainProbability | rainChance }}
            </span>
            <span class="daily__temps">
              <span class="daily__temp-max">{{ day.tempMax | temp }}</span>
              <span class="daily__temp-sep">/</span>
              <span class="daily__temp-min">{{ day.tempMin | temp }}</span>
            </span>
          </button>
        }
      </div>
    </section>
  `,
  styles: `
    .daily {
      padding: 1.25rem 1.25rem 0.75rem;
    }

    .daily__list {
      display: flex;
      flex-direction: column;
    }

    .daily__row {
      display: grid;
      grid-template-columns: 5.5rem 2rem 2.5rem 1fr;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.625rem 0.25rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-primary);
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
    }

    .daily__row + .daily__row {
      border-top: 1px solid var(--border);
    }

    .daily__row:hover,
    .daily__row:focus-visible {
      background: var(--surface-muted);
      outline: none;
    }

    .daily__row--active {
      background: var(--accent-soft);
    }

    .daily__row--active .daily__date {
      font-weight: 600;
      color: var(--accent-dark);
    }

    .daily__date {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .daily__rain {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
      text-align: right;
    }

    .daily__rain--wet {
      color: var(--metric-rain-text);
      font-weight: 600;
    }

    .daily__temps {
      display: flex;
      align-items: center;
      gap: 0.125rem;
      font-size: 0.8125rem;
      font-variant-numeric: tabular-nums;
      justify-content: flex-end;
    }

    .daily__temp-max {
      font-weight: 600;
      color: var(--text-primary);
    }

    .daily__temp-sep {
      color: var(--text-muted);
      font-weight: 400;
    }

    .daily__temp-min {
      color: var(--text-muted);
      font-weight: 500;
    }
  `,
})
export class WeatherDailyComponent {
  readonly daily = input.required<DailyForecast[]>();
  readonly selectedDate = input.required<string>();
  readonly daySelect = output<string>();
}
