import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

import { PRESET_LOCATIONS } from '../../core/constants/mindanao.config';
import type { Location } from '../../core/models/weather.models';
import { GeocodingService } from '../../core/services/geocoding.service';

@Component({
  selector: 'app-location-search',
  imports: [FormsModule],
  template: `
    <div class="search">
      <div class="search__inputs">
        <div class="search__row">
          <div class="search__field search__field--location">
            <label class="search__label" for="location-search">Location</label>
            <input
              id="location-search"
              class="search__input"
              type="search"
              [ngModel]="query()"
              (ngModelChange)="handleQueryChange($event)"
              placeholder="Search Mindanao…"
              autocomplete="off"
              aria-autocomplete="list"
              [attr.aria-expanded]="suggestions().length > 0"
              aria-controls="location-suggestions"
            />
          </div>
          <div class="search__field search__field--date">
            <label class="search__label" for="forecast-date">Date</label>
            <input
              id="forecast-date"
              class="search__input"
              type="date"
              [ngModel]="selectedDate()"
              (ngModelChange)="dateChange.emit($event)"
              [min]="minDate"
              [max]="maxDate"
            />
          </div>
        </div>

        @if (suggestions().length > 0) {
          <ul id="location-suggestions" class="search__suggestions" role="listbox">
            @for (item of suggestions(); track item.name + item.latitude) {
              <li role="presentation">
                <button
                  type="button"
                  class="search__suggestion"
                  role="option"
                  (click)="handleSelect(item)"
                >
                  <span class="search__suggestion-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/>
                      <circle cx="12" cy="10" r="2.5"/>
                    </svg>
                  </span>
                  <span class="search__suggestion-body">
                    <span class="search__suggestion-name">{{ item.name }}</span>
                    @if (item.admin1) {
                      <span class="search__suggestion-meta">{{ item.admin1 }}</span>
                    }
                  </span>
                </button>
              </li>
            }
          </ul>
        }
      </div>

      <div class="search__presets-wrap">
        <p class="search__presets-label">Popular cities</p>
        <div class="search__presets" role="group" aria-label="Popular cities">
          @for (preset of presets; track preset.name) {
            <button
              type="button"
              class="search__preset"
              [class.search__preset--active]="isActive(preset)"
              (click)="handleSelect(preset)"
            >
              {{ preset.name }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      overflow: visible;
    }

    .search {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow: visible;
    }

    .search__inputs {
      position: relative;
      z-index: 10;
      overflow: visible;
    }

    .search__row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      overflow: visible;
    }

    @media (min-width: 480px) {
      .search__row {
        grid-template-columns: 1fr auto;
        align-items: end;
      }
    }

    .search__field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
      overflow: visible;
    }

    .search__field--date {
      min-width: 9.5rem;
    }

    .search__label {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--text-secondary);
    }

    .search__input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.875rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .search__input:hover {
      border-color: var(--border-strong);
    }

    .search__input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px var(--accent-glow);
    }

    .search__suggestions {
      position: absolute;
      top: calc(100% + 0.375rem);
      left: 0;
      right: 0;
      z-index: 200;
      list-style: none;
      margin: 0;
      padding: 0.375rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      box-shadow: var(--shadow-md);
      max-height: 14rem;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .search__suggestion {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.625rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-primary);
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      font-size: 0.875rem;
      transition: background 0.12s;
    }

    .search__suggestion:hover,
    .search__suggestion:focus-visible {
      background: var(--surface-muted);
      outline: none;
    }

    .search__suggestion-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: var(--radius-sm);
      background: var(--accent-soft);
      color: var(--accent);
    }

    .search__suggestion-icon svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .search__suggestion-body {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }

    .search__suggestion-name {
      font-weight: 600;
      line-height: 1.3;
    }

    .search__suggestion-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.3;
    }

    .search__presets-wrap {
      padding: 0.75rem;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }

    .search__presets-label {
      margin: 0 0 0.625rem;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--text-secondary);
    }

    .search__presets {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .search__preset {
      padding: 0.375rem 0.875rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface-muted);
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      line-height: 1.3;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s, transform 0.12s;
    }

    .search__preset:hover,
    .search__preset:focus-visible {
      background: var(--surface-hover);
      border-color: var(--border-strong);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
      outline: none;
    }

    .search__preset:active {
      transform: scale(0.98);
    }

    .search__preset--active {
      background: var(--accent-soft);
      border-color: var(--accent-ring);
      color: var(--accent-dark);
      font-weight: 600;
      box-shadow: 0 0 0 1px var(--accent-glow);
    }

    .search__preset--active:hover,
    .search__preset--active:focus-visible {
      background: var(--accent-soft);
      border-color: var(--accent);
      color: var(--accent-dark);
    }
  `,
})
export class LocationSearchComponent {
  private readonly geocoding = inject(GeocodingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly selectedDate = input.required<string>();
  readonly activeLocation = input<Location | null>(null);
  readonly dateChange = output<string>();
  readonly locationSelect = output<Location>();

  protected readonly query = signal('');
  protected readonly suggestions = signal<Location[]>([]);
  protected readonly presets = PRESET_LOCATIONS;

  protected readonly minDate = new Date().toISOString().slice(0, 10);
  protected readonly maxDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    return date.toISOString().slice(0, 10);
  })();

  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.geocoding.search(term)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => this.suggestions.set(results));
  }

  protected handleQueryChange(value: string): void {
    this.query.set(value);
    this.search$.next(value);
  }

  protected handleSelect(location: Location): void {
    this.query.set(location.name);
    this.suggestions.set([]);
    this.locationSelect.emit(location);
  }

  protected isActive(preset: Location): boolean {
    const active = this.activeLocation();
    if (!active) {
      return false;
    }
    return (
      active.name === preset.name &&
      active.latitude === preset.latitude &&
      active.longitude === preset.longitude
    );
  }
}
