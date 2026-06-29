import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeService } from './core/services/theme.service';
import { TopNavComponent } from './shared/components/top-nav/top-nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNavComponent],
  template: `
    <div class="app-shell">
      <app-top-nav />
      <main class="app-main">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app.scss',
})
export class App {
  private readonly _theme = inject(ThemeService);
}
