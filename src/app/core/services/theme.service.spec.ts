import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('theme-dark');
    document.documentElement.style.colorScheme = 'light';

    TestBed.configureTestingModule({});
  });

  it('should toggle data-theme on the document element', () => {
    const service = TestBed.inject(ThemeService);

    service.setTheme('light');

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(service.isDark()).toBe(false);

    service.toggle();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(service.isDark()).toBe(true);
    expect(localStorage.getItem('nems-theme')).toBe('dark');

    service.toggle();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    expect(service.isDark()).toBe(false);
    expect(localStorage.getItem('nems-theme')).toBe('light');
  });
});
