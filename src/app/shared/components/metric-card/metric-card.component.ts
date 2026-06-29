import { Component, input } from '@angular/core';

type MetricTone = 'rain' | 'humidity' | 'wind' | 'default';

@Component({
  selector: 'app-metric-card',
  template: `
    <div
      class="metric-card"
      [class.metric-card--compact]="variant() === 'compact'"
      [class.metric-card--rain]="tone() === 'rain'"
      [class.metric-card--humidity]="tone() === 'humidity'"
      [class.metric-card--wind]="tone() === 'wind'"
    >
      <span class="metric-card__label">{{ label() }}</span>
      <span class="metric-card__value">
        {{ value() }}@if (unit()) { <span class="metric-card__unit">{{ unit() }}</span> }
      </span>
    </div>
  `,
  styles: `
    .metric-card {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-md);
      background: var(--surface-muted);
      border: 1px solid var(--border);
      transition: transform 0.15s, box-shadow 0.15s;
    }

    .metric-card--rain {
      background: var(--metric-rain-bg);
      border-color: var(--metric-rain-border);
    }

    .metric-card--rain .metric-card__value {
      color: var(--metric-rain-text);
    }

    .metric-card--humidity {
      background: var(--metric-humidity-bg);
      border-color: var(--metric-humidity-border);
    }

    .metric-card--humidity .metric-card__value {
      color: var(--metric-humidity-text);
    }

    .metric-card--wind {
      background: var(--metric-wind-bg);
      border-color: var(--metric-wind-border);
    }

    .metric-card--wind .metric-card__value {
      color: var(--metric-wind-text);
    }

    .metric-card--compact {
      padding: 0;
      border: none;
      background: transparent;
      border-radius: 0;
    }

    .metric-card__label {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .metric-card__value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .metric-card--compact .metric-card__value {
      font-size: 1rem;
      font-weight: 500;
    }

    .metric-card__unit {
      font-size: 0.875rem;
      font-weight: 600;
      opacity: 0.85;
      margin-left: 0.125rem;
    }
  `,
})
export class MetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly unit = input<string>('');
  readonly variant = input<'default' | 'compact'>('default');
  readonly tone = input<MetricTone>('default');
}
