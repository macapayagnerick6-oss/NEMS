import { Component, input } from '@angular/core';

import type { WeatherCondition } from '../../../core/models/weather.models';
import {
  conditionEmoji,
  conditionLabel,
} from '../../../core/utils/weather-code.mapper';

@Component({
  selector: 'app-weather-icon',
  template: `
    <span
      class="weather-icon"
      [class.weather-icon--lg]="size() === 'lg'"
      [class.weather-icon--sm]="size() === 'sm'"
      [attr.aria-label]="conditionLabel(condition())"
      role="img"
    >
      {{ emoji() }}
    </span>
  `,
  styles: `
    .weather-icon {
      font-size: 1.75rem;
      line-height: 1;
      display: inline-block;
    }

    .weather-icon--sm {
      font-size: 1.25rem;
    }

    .weather-icon--lg {
      font-size: 3rem;
    }
  `,
})
export class WeatherIconComponent {
  readonly condition = input.required<WeatherCondition>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  protected conditionLabel = conditionLabel;

  protected emoji(): string {
    return conditionEmoji(this.condition());
  }
}
