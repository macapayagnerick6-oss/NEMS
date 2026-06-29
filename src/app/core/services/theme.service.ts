import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'nems-theme';

function parseTheme(value: string | null | undefined): ThemeMode | null {
  return value === 'light' || value === 'dark' ? value : null;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly mode = signal<ThemeMode>('light');
  readonly isDark = computed(() => this.mode() === 'dark');

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    afterNextRender(() => {
      this.syncFromDom();

      new MutationObserver(() => {
        this.syncFromDom();
      }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
      });
    });
  }

  toggle(): void {
    this.setTheme(this.mode() === 'light' ? 'dark' : 'light', true);
  }

  setTheme(mode: ThemeMode, persist = false): void {
    this.mode.set(mode);
    this.applyToDom(mode);

    if (persist) {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }

  private syncFromDom(): void {
    const mode = parseTheme(document.documentElement.getAttribute('data-theme')) ?? 'light';
    if (this.mode() !== mode) {
      this.mode.set(mode);
    }
  }

  private applyToDom(mode: ThemeMode): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
    root.classList.toggle('theme-dark', mode === 'dark');
  }
}
