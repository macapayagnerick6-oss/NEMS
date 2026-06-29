import { Component } from '@angular/core';

@Component({
  selector: 'app-top-nav',
  template: `
    <header class="topbar nems-enter nems-enter--down" role="banner">
      <div class="topbar__inner">
        <div class="topbar__brand">
          <span class="topbar__logo">NEMS</span>
        </div>

        <span class="topbar__badge" aria-label="Coverage region">Mindanao</span>
      </div>
    </header>
  `,
  styles: `
    .topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--topbar-bg);
      border-bottom: 1px solid var(--topbar-border);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: var(--topbar-shadow);
    }

    .topbar__inner {
      max-width: 720px;
      margin: 0 auto;
      padding: 0 1.25rem;
      height: var(--nav-height, 3.5rem);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .topbar__brand {
      display: flex;
      align-items: baseline;
      gap: 0.625rem;
      min-width: 0;
    }

    .topbar__logo {
      font-size: 1.125rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #38bdf8, var(--accent-dark));
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .topbar__badge {
      flex-shrink: 0;
      padding: 0.25rem 0.625rem;
      border-radius: 999px;
      border: 1px solid var(--badge-border);
      background: var(--badge-bg);
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--accent-dark);
    }
  `,
})
export class TopNavComponent {}
